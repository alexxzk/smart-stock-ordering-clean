"""
Sales Tracking API
Handles sales data import, revenue tracking, and real-time dashboard
"""

from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query, Request, File, UploadFile
from pydantic import BaseModel, Field
import uuid
import logging
import csv
import io
from decimal import Decimal

# Database connection
try:
    import firebase_admin
    from firebase_admin import firestore
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    db = firestore.client()
except ImportError:
    db = None

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic Models
class SalesTransaction(BaseModel):
    id: Optional[str] = None
    transaction_date: datetime
    total_amount: float
    tax_amount: float = 0
    discount_amount: float = 0
    payment_method: Optional[str] = None
    customer_id: Optional[str] = None
    staff_id: Optional[str] = None
    pos_system: Optional[str] = None
    external_transaction_id: Optional[str] = None
    notes: Optional[str] = None

class SalesTransactionItem(BaseModel):
    id: Optional[str] = None
    transaction_id: str
    menu_item_id: str
    quantity: int
    unit_price: float
    total_price: float
    modifications: Optional[str] = None

class SalesImportItem(BaseModel):
    transaction_date: str
    menu_item_name: str
    quantity: int
    unit_price: float
    total_price: float
    payment_method: Optional[str] = None
    external_transaction_id: Optional[str] = None

class DashboardMetrics(BaseModel):
    today_sales: float
    yesterday_sales: float
    week_sales: float
    month_sales: float
    year_sales: float
    top_selling_items: List[Dict[str, Any]]
    sales_by_hour: List[Dict[str, Any]]
    sales_by_day: List[Dict[str, Any]]
    payment_methods: Dict[str, float]
    average_transaction: float
    transactions_count: int

class SalesReport(BaseModel):
    period: str
    total_sales: float
    total_transactions: int
    average_transaction: float
    top_items: List[Dict[str, Any]]
    sales_by_category: Dict[str, float]
    sales_by_payment_method: Dict[str, float]
    hourly_breakdown: List[Dict[str, Any]]
    daily_breakdown: List[Dict[str, Any]]

# Helper functions
async def get_current_user(request: Request):
    """Extract user ID from request"""
    user = getattr(request.state, 'user', None)
    if not user:
        import os
        if os.getenv("DEV_MODE", "false").lower() == "true":
            return {
                "uid": "dev-user-123",
                "email": "dev@example.com",
                "name": "Development User"
            }
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

def find_or_create_menu_item(item_name: str, price: float) -> str:
    """Find existing menu item or create new one"""
    try:
        if not db:
            return str(uuid.uuid4())
            
        # Search for existing item
        menu_items = db.collection('menu_items').where('name', '==', item_name).stream()
        
        for item in menu_items:
            return item.id
        
        # Create new item if not found
        item_id = str(uuid.uuid4())
        item_data = {
            'id': item_id,
            'name': item_name,
            'price': price,
            'is_active': True,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        db.collection('menu_items').document(item_id).set(item_data)
        return item_id
        
    except Exception as e:
        logger.error(f"Error finding/creating menu item: {e}")
        return str(uuid.uuid4())

def update_inventory_from_sale(menu_item_id: str, quantity: int):
    """Update inventory based on sale (deduct ingredients)"""
    try:
        if not db:
            return
            
        # Get recipe ingredients
        recipe_items = db.collection('recipe_ingredients')\
                        .where('menu_item_id', '==', menu_item_id)\
                        .stream()
        
        for recipe_item in recipe_items:
            recipe_data = recipe_item.to_dict()
            product_id = recipe_data.get('product_id')
            ingredient_quantity = recipe_data.get('quantity', 0)
            
            if product_id and ingredient_quantity > 0:
                # Deduct from inventory using FIFO
                total_needed = ingredient_quantity * quantity
                
                # Get inventory items in FIFO order
                inventory_items = db.collection('inventory')\
                                  .where('product_id', '==', product_id)\
                                  .stream()
                
                items_list = []
                for item in inventory_items:
                    data = item.to_dict()
                    data['id'] = item.id
                    items_list.append(data)
                
                # Sort by expiry date (FIFO)
                items_list.sort(key=lambda x: x.get('expiry_date') or date.max)
                
                remaining_needed = total_needed
                
                for item in items_list:
                    if remaining_needed <= 0:
                        break
                    
                    item_quantity = item['quantity']
                    
                    if item_quantity <= remaining_needed:
                        # Use entire item
                        db.collection('inventory').document(item['id']).delete()
                        remaining_needed -= item_quantity
                    else:
                        # Partial use
                        new_quantity = item_quantity - remaining_needed
                        db.collection('inventory').document(item['id']).update({
                            'quantity': new_quantity,
                            'updated_at': datetime.now()
                        })
                        remaining_needed = 0
                
                # Create stock adjustment record
                adjustment_id = str(uuid.uuid4())
                adjustment_data = {
                    'id': adjustment_id,
                    'product_id': product_id,
                    'adjustment_type': 'sale',
                    'quantity_change': -total_needed,
                    'reason': f'Sale of {quantity} x {menu_item_id}',
                    'adjustment_date': datetime.now(),
                    'notes': 'Auto-generated from sale'
                }
                
                db.collection('stock_adjustments').document(adjustment_id).set(adjustment_data)
                
    except Exception as e:
        logger.error(f"Error updating inventory from sale: {e}")

def parse_csv_sales_data(csv_content: str) -> List[SalesImportItem]:
    """Parse CSV sales data"""
    try:
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        sales_items = []
        
        for row in csv_reader:
            # Map CSV columns to our format
            # Assuming common POS CSV format
            item = SalesImportItem(
                transaction_date=row.get('date', row.get('transaction_date', '')),
                menu_item_name=row.get('item_name', row.get('product_name', '')),
                quantity=int(row.get('quantity', row.get('qty', 1))),
                unit_price=float(row.get('price', row.get('unit_price', 0))),
                total_price=float(row.get('total', row.get('total_price', 0))),
                payment_method=row.get('payment_method', row.get('payment_type', '')),
                external_transaction_id=row.get('transaction_id', row.get('receipt_id', ''))
            )
            
            sales_items.append(item)
        
        return sales_items
        
    except Exception as e:
        logger.error(f"Error parsing CSV: {e}")
        return []

# API Endpoints

@router.post("/transactions")
async def create_transaction(
    transaction: SalesTransaction,
    current_user: dict = Depends(get_current_user)
):
    """Create a new sales transaction"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        transaction_id = str(uuid.uuid4())
        transaction_data = {
            'id': transaction_id,
            'transaction_date': transaction.transaction_date,
            'total_amount': transaction.total_amount,
            'tax_amount': transaction.tax_amount,
            'discount_amount': transaction.discount_amount,
            'payment_method': transaction.payment_method,
            'customer_id': transaction.customer_id,
            'staff_id': transaction.staff_id or current_user['uid'],
            'pos_system': transaction.pos_system,
            'external_transaction_id': transaction.external_transaction_id,
            'notes': transaction.notes,
            'created_at': datetime.now()
        }
        
        db.collection('sales_transactions').document(transaction_id).set(transaction_data)
        
        return {"success": True, "transaction_id": transaction_id, "message": "Transaction created successfully"}
    except Exception as e:
        logger.error(f"Error creating transaction: {e}")
        raise HTTPException(status_code=500, detail="Failed to create transaction")

@router.post("/transactions/{transaction_id}/items")
async def add_transaction_item(
    transaction_id: str,
    item: SalesTransactionItem,
    current_user: dict = Depends(get_current_user)
):
    """Add item to transaction"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        item_id = str(uuid.uuid4())
        item_data = {
            'id': item_id,
            'transaction_id': transaction_id,
            'menu_item_id': item.menu_item_id,
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'total_price': item.total_price,
            'modifications': item.modifications,
            'created_at': datetime.now()
        }
        
        db.collection('sales_transaction_items').document(item_id).set(item_data)
        
        # Update inventory
        update_inventory_from_sale(item.menu_item_id, item.quantity)
        
        return {"success": True, "item_id": item_id, "message": "Item added successfully"}
    except Exception as e:
        logger.error(f"Error adding transaction item: {e}")
        raise HTTPException(status_code=500, detail="Failed to add item")

@router.post("/import/csv")
async def import_sales_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Import sales data from CSV file"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        sales_items = parse_csv_sales_data(csv_content)
        
        if not sales_items:
            raise HTTPException(status_code=400, detail="No valid sales data found in CSV")
        
        # Group items by transaction
        transactions = {}
        imported_count = 0
        
        for item in sales_items:
            transaction_key = f"{item.transaction_date}_{item.external_transaction_id}"
            
            if transaction_key not in transactions:
                transactions[transaction_key] = {
                    'transaction_date': datetime.strptime(item.transaction_date, '%Y-%m-%d'),
                    'total_amount': 0,
                    'payment_method': item.payment_method,
                    'external_transaction_id': item.external_transaction_id,
                    'items': []
                }
            
            # Find or create menu item
            menu_item_id = find_or_create_menu_item(item.menu_item_name, item.unit_price)
            
            # Add item to transaction
            transactions[transaction_key]['items'].append({
                'menu_item_id': menu_item_id,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'total_price': item.total_price
            })
            
            transactions[transaction_key]['total_amount'] += item.total_price
        
        # Create transactions
        for transaction_data in transactions.values():
            transaction_id = str(uuid.uuid4())
            
            # Create transaction
            transaction_doc = {
                'id': transaction_id,
                'transaction_date': transaction_data['transaction_date'],
                'total_amount': transaction_data['total_amount'],
                'payment_method': transaction_data['payment_method'],
                'external_transaction_id': transaction_data['external_transaction_id'],
                'staff_id': current_user['uid'],
                'pos_system': 'csv_import',
                'created_at': datetime.now()
            }
            
            db.collection('sales_transactions').document(transaction_id).set(transaction_doc)
            
            # Create transaction items
            for item in transaction_data['items']:
                item_id = str(uuid.uuid4())
                item_doc = {
                    'id': item_id,
                    'transaction_id': transaction_id,
                    'menu_item_id': item['menu_item_id'],
                    'quantity': item['quantity'],
                    'unit_price': item['unit_price'],
                    'total_price': item['total_price'],
                    'created_at': datetime.now()
                }
                
                db.collection('sales_transaction_items').document(item_id).set(item_doc)
                
                # Update inventory
                update_inventory_from_sale(item['menu_item_id'], item['quantity'])
                
                imported_count += 1
        
        return {"success": True, "imported_transactions": len(transactions), "imported_items": imported_count}
        
    except Exception as e:
        logger.error(f"Error importing CSV: {e}")
        raise HTTPException(status_code=500, detail="Failed to import CSV data")

@router.get("/dashboard")
async def get_dashboard_metrics(
    current_user: dict = Depends(get_current_user)
):
    """Get real-time dashboard metrics"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        today = date.today()
        yesterday = today - timedelta(days=1)
        week_start = today - timedelta(days=7)
        month_start = today - timedelta(days=30)
        year_start = today - timedelta(days=365)
        
        # Get sales data
        transactions = db.collection('sales_transactions').stream()
        
        today_sales = 0
        yesterday_sales = 0
        week_sales = 0
        month_sales = 0
        year_sales = 0
        transaction_count = 0
        
        item_sales = {}
        hourly_sales = {}
        daily_sales = {}
        payment_methods = {}
        
        for transaction in transactions:
            data = transaction.to_dict()
            transaction_date = data.get('transaction_date')
            
            if isinstance(transaction_date, str):
                transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d')
            
            amount = data.get('total_amount', 0)
            payment_method = data.get('payment_method', 'unknown')
            
            transaction_count += 1
            
            # Calculate period sales
            if transaction_date.date() == today:
                today_sales += amount
                
                # Hourly breakdown
                hour = transaction_date.hour
                if hour not in hourly_sales:
                    hourly_sales[hour] = 0
                hourly_sales[hour] += amount
                
            if transaction_date.date() == yesterday:
                yesterday_sales += amount
                
            if transaction_date.date() >= week_start:
                week_sales += amount
                
            if transaction_date.date() >= month_start:
                month_sales += amount
                
                # Daily breakdown
                day_key = transaction_date.strftime('%Y-%m-%d')
                if day_key not in daily_sales:
                    daily_sales[day_key] = 0
                daily_sales[day_key] += amount
                
            if transaction_date.date() >= year_start:
                year_sales += amount
            
            # Payment methods
            if payment_method not in payment_methods:
                payment_methods[payment_method] = 0
            payment_methods[payment_method] += amount
            
            # Get transaction items for top selling items
            items = db.collection('sales_transaction_items')\
                     .where('transaction_id', '==', transaction.id)\
                     .stream()
            
            for item in items:
                item_data = item.to_dict()
                menu_item_id = item_data.get('menu_item_id')
                quantity = item_data.get('quantity', 0)
                
                if menu_item_id not in item_sales:
                    item_sales[menu_item_id] = {
                        'quantity': 0,
                        'revenue': 0,
                        'name': 'Unknown'
                    }
                
                item_sales[menu_item_id]['quantity'] += quantity
                item_sales[menu_item_id]['revenue'] += item_data.get('total_price', 0)
        
        # Get menu item names for top selling items
        for menu_item_id in item_sales.keys():
            menu_item = db.collection('menu_items').document(menu_item_id).get()
            if menu_item.exists:
                item_sales[menu_item_id]['name'] = menu_item.to_dict().get('name', 'Unknown')
        
        # Sort top selling items
        top_selling_items = sorted(
            [{'id': k, **v} for k, v in item_sales.items()],
            key=lambda x: x['quantity'],
            reverse=True
        )[:10]
        
        # Format hourly sales
        sales_by_hour = [
            {'hour': hour, 'sales': amount}
            for hour, amount in sorted(hourly_sales.items())
        ]
        
        # Format daily sales
        sales_by_day = [
            {'date': day, 'sales': amount}
            for day, amount in sorted(daily_sales.items())
        ]
        
        metrics = DashboardMetrics(
            today_sales=today_sales,
            yesterday_sales=yesterday_sales,
            week_sales=week_sales,
            month_sales=month_sales,
            year_sales=year_sales,
            top_selling_items=top_selling_items,
            sales_by_hour=sales_by_hour,
            sales_by_day=sales_by_day,
            payment_methods=payment_methods,
            average_transaction=year_sales / transaction_count if transaction_count > 0 else 0,
            transactions_count=transaction_count
        )
        
        return {"success": True, "metrics": metrics.dict()}
        
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard metrics")

@router.get("/reports")
async def get_sales_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Generate sales report for date range"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        # Get transactions in date range
        transactions = db.collection('sales_transactions').stream()
        
        total_sales = 0
        total_transactions = 0
        item_sales = {}
        category_sales = {}
        payment_method_sales = {}
        hourly_breakdown = {}
        daily_breakdown = {}
        
        for transaction in transactions:
            data = transaction.to_dict()
            transaction_date = data.get('transaction_date')
            
            if isinstance(transaction_date, str):
                transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d')
            
            # Filter by date range
            if start_date <= transaction_date.date() <= end_date:
                amount = data.get('total_amount', 0)
                payment_method = data.get('payment_method', 'unknown')
                
                total_sales += amount
                total_transactions += 1
                
                # Payment method breakdown
                if payment_method not in payment_method_sales:
                    payment_method_sales[payment_method] = 0
                payment_method_sales[payment_method] += amount
                
                # Hourly breakdown
                hour = transaction_date.hour
                if hour not in hourly_breakdown:
                    hourly_breakdown[hour] = 0
                hourly_breakdown[hour] += amount
                
                # Daily breakdown
                day_key = transaction_date.strftime('%Y-%m-%d')
                if day_key not in daily_breakdown:
                    daily_breakdown[day_key] = 0
                daily_breakdown[day_key] += amount
                
                # Get transaction items
                items = db.collection('sales_transaction_items')\
                         .where('transaction_id', '==', transaction.id)\
                         .stream()
                
                for item in items:
                    item_data = item.to_dict()
                    menu_item_id = item_data.get('menu_item_id')
                    quantity = item_data.get('quantity', 0)
                    revenue = item_data.get('total_price', 0)
                    
                    if menu_item_id not in item_sales:
                        item_sales[menu_item_id] = {
                            'quantity': 0,
                            'revenue': 0,
                            'name': 'Unknown',
                            'category': 'Unknown'
                        }
                    
                    item_sales[menu_item_id]['quantity'] += quantity
                    item_sales[menu_item_id]['revenue'] += revenue
        
        # Get menu item details
        for menu_item_id in item_sales.keys():
            menu_item = db.collection('menu_items').document(menu_item_id).get()
            if menu_item.exists:
                menu_data = menu_item.to_dict()
                item_sales[menu_item_id]['name'] = menu_data.get('name', 'Unknown')
                
                # Get category
                category_id = menu_data.get('category_id')
                if category_id:
                    category = db.collection('menu_categories').document(category_id).get()
                    if category.exists:
                        category_name = category.to_dict().get('name', 'Unknown')
                        item_sales[menu_item_id]['category'] = category_name
                        
                        # Category sales
                        if category_name not in category_sales:
                            category_sales[category_name] = 0
                        category_sales[category_name] += item_sales[menu_item_id]['revenue']
        
        # Sort top items
        top_items = sorted(
            [{'id': k, **v} for k, v in item_sales.items()],
            key=lambda x: x['revenue'],
            reverse=True
        )[:20]
        
        # Format breakdowns
        hourly_breakdown_list = [
            {'hour': hour, 'sales': amount}
            for hour, amount in sorted(hourly_breakdown.items())
        ]
        
        daily_breakdown_list = [
            {'date': day, 'sales': amount}
            for day, amount in sorted(daily_breakdown.items())
        ]
        
        report = SalesReport(
            period=f"{start_date} to {end_date}",
            total_sales=total_sales,
            total_transactions=total_transactions,
            average_transaction=total_sales / total_transactions if total_transactions > 0 else 0,
            top_items=top_items,
            sales_by_category=category_sales,
            sales_by_payment_method=payment_method_sales,
            hourly_breakdown=hourly_breakdown_list,
            daily_breakdown=daily_breakdown_list
        )
        
        return {"success": True, "report": report.dict()}
        
    except Exception as e:
        logger.error(f"Error generating sales report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate sales report")

@router.get("/transactions")
async def get_transactions(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100),
    current_user: dict = Depends(get_current_user)
):
    """Get sales transactions with optional filtering"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        query = db.collection('sales_transactions')
        
        # Apply date filters if provided
        if start_date:
            query = query.where('transaction_date', '>=', start_date)
        if end_date:
            query = query.where('transaction_date', '<=', end_date)
        
        # Order by date and limit
        query = query.order_by('transaction_date', direction=firestore.Query.DESCENDING).limit(limit)
        
        transactions = []
        for doc in query.stream():
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Get transaction items
            items = []
            item_docs = db.collection('sales_transaction_items')\
                         .where('transaction_id', '==', doc.id)\
                         .stream()
            
            for item_doc in item_docs:
                item_data = item_doc.to_dict()
                item_data['id'] = item_doc.id
                
                # Get menu item name
                menu_item = db.collection('menu_items').document(item_data['menu_item_id']).get()
                if menu_item.exists:
                    item_data['menu_item_name'] = menu_item.to_dict().get('name', 'Unknown')
                
                items.append(item_data)
            
            data['items'] = items
            transactions.append(data)
        
        return {"success": True, "transactions": transactions}
        
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get transactions")

@router.get("/revenue/trends")
async def get_revenue_trends(
    period: str = Query("30d"),  # 7d, 30d, 90d, 1y
    current_user: dict = Depends(get_current_user)
):
    """Get revenue trends over time"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        # Calculate date range
        end_date = date.today()
        
        if period == "7d":
            start_date = end_date - timedelta(days=7)
        elif period == "30d":
            start_date = end_date - timedelta(days=30)
        elif period == "90d":
            start_date = end_date - timedelta(days=90)
        elif period == "1y":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get transactions
        transactions = db.collection('sales_transactions').stream()
        
        daily_revenue = {}
        
        for transaction in transactions:
            data = transaction.to_dict()
            transaction_date = data.get('transaction_date')
            
            if isinstance(transaction_date, str):
                transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d')
            
            if start_date <= transaction_date.date() <= end_date:
                day_key = transaction_date.strftime('%Y-%m-%d')
                
                if day_key not in daily_revenue:
                    daily_revenue[day_key] = 0
                
                daily_revenue[day_key] += data.get('total_amount', 0)
        
        # Fill missing days with 0
        current_date = start_date
        while current_date <= end_date:
            day_key = current_date.strftime('%Y-%m-%d')
            if day_key not in daily_revenue:
                daily_revenue[day_key] = 0
            current_date += timedelta(days=1)
        
        # Format for chart
        trends = [
            {'date': day, 'revenue': revenue}
            for day, revenue in sorted(daily_revenue.items())
        ]
        
        return {"success": True, "trends": trends}
        
    except Exception as e:
        logger.error(f"Error getting revenue trends: {e}")
        raise HTTPException(status_code=500, detail="Failed to get revenue trends")