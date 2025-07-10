"""
Inventory Management API
Handles stock tracking, FIFO expiry, low stock alerts, and inventory operations
"""

from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field
import uuid
import logging
from decimal import Decimal

# Database connection (assume Firebase/Firestore)
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
class ProductCategory(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#4ECDC4"

class Product(BaseModel):
    id: Optional[str] = None
    name: str
    category_id: Optional[str] = None
    unit: str = "kg"
    package_size: Optional[str] = None
    cost_per_unit: Optional[float] = None
    supplier_id: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    allergens: Optional[List[str]] = []
    storage_requirements: Optional[str] = None
    shelf_life_days: Optional[int] = None

class InventoryItem(BaseModel):
    id: Optional[str] = None
    product_id: str
    quantity: float
    unit: str
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    received_date: Optional[date] = None
    cost_per_unit: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class StockAdjustment(BaseModel):
    id: Optional[str] = None
    product_id: str
    adjustment_type: str = "manual"  # manual, sale, waste, received
    quantity_change: float
    reason: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None

class LowStockAlert(BaseModel):
    id: Optional[str] = None
    product_id: str
    alert_threshold: float
    current_stock: float
    is_acknowledged: bool = False

class InventoryReport(BaseModel):
    total_value: float
    total_items: int
    low_stock_items: int
    expiring_items: int
    categories: Dict[str, Any]
    top_value_items: List[Dict[str, Any]]

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

def calculate_total_stock(product_id: str) -> float:
    """Calculate total stock for a product across all inventory items"""
    try:
        inventory_ref = db.collection('inventory')
        query = inventory_ref.where('product_id', '==', product_id)
        docs = query.stream()
        
        total = 0.0
        for doc in docs:
            data = doc.to_dict()
            total += float(data.get('quantity', 0))
        
        return total
    except Exception as e:
        logger.error(f"Error calculating stock for product {product_id}: {e}")
        return 0.0

def get_fifo_items(product_id: str) -> List[Dict]:
    """Get inventory items for a product in FIFO order (earliest expiry first)"""
    try:
        inventory_ref = db.collection('inventory')
        query = inventory_ref.where('product_id', '==', product_id)
        docs = query.stream()
        
        items = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            items.append(data)
        
        # Sort by expiry date (FIFO)
        items.sort(key=lambda x: x.get('expiry_date') or date.max)
        return items
    except Exception as e:
        logger.error(f"Error getting FIFO items for product {product_id}: {e}")
        return []

def create_stock_adjustment(product_id: str, quantity_change: float, 
                          adjustment_type: str, reason: str = None, 
                          reference_id: str = None, user_id: str = None):
    """Create a stock adjustment record"""
    try:
        adjustment_id = str(uuid.uuid4())
        adjustment_data = {
            'id': adjustment_id,
            'product_id': product_id,
            'adjustment_type': adjustment_type,
            'quantity_change': quantity_change,
            'reason': reason,
            'reference_id': reference_id,
            'adjusted_by': user_id,
            'adjustment_date': datetime.now(),
            'notes': f"Auto-generated {adjustment_type} adjustment"
        }
        
        db.collection('stock_adjustments').document(adjustment_id).set(adjustment_data)
        return adjustment_id
    except Exception as e:
        logger.error(f"Error creating stock adjustment: {e}")
        return None

def check_low_stock_alerts(product_id: str = None):
    """Check and create low stock alerts"""
    try:
        # Get all products or specific product
        if product_id:
            products = [db.collection('products').document(product_id).get()]
        else:
            products = db.collection('products').stream()
        
        for product_doc in products:
            if not product_doc.exists:
                continue
                
            product_data = product_doc.to_dict()
            current_stock = calculate_total_stock(product_doc.id)
            
            # Get alert threshold (default 5 units)
            threshold = 5.0  # Could be configurable per product
            
            if current_stock <= threshold:
                # Check if alert already exists
                alert_ref = db.collection('low_stock_alerts')
                existing_query = alert_ref.where('product_id', '==', product_doc.id)\
                                         .where('is_acknowledged', '==', False)
                existing_alerts = list(existing_query.stream())
                
                if not existing_alerts:
                    # Create new alert
                    alert_id = str(uuid.uuid4())
                    alert_data = {
                        'id': alert_id,
                        'product_id': product_doc.id,
                        'alert_threshold': threshold,
                        'current_stock': current_stock,
                        'alert_date': datetime.now(),
                        'is_acknowledged': False
                    }
                    db.collection('low_stock_alerts').document(alert_id).set(alert_data)
                    
    except Exception as e:
        logger.error(f"Error checking low stock alerts: {e}")

# API Endpoints

@router.get("/products/categories")
async def get_product_categories(current_user: dict = Depends(get_current_user)):
    """Get all product categories"""
    try:
        categories = []
        docs = db.collection('product_categories').stream()
        
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            categories.append(data)
        
        return {"success": True, "categories": categories}
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")

@router.post("/products/categories")
async def create_product_category(
    category: ProductCategory,
    current_user: dict = Depends(get_current_user)
):
    """Create a new product category"""
    try:
        category_id = str(uuid.uuid4())
        category_data = {
            'id': category_id,
            'name': category.name,
            'description': category.description,
            'color': category.color,
            'created_at': datetime.now()
        }
        
        db.collection('product_categories').document(category_id).set(category_data)
        
        return {"success": True, "category_id": category_id, "message": "Category created successfully"}
    except Exception as e:
        logger.error(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")

@router.get("/products")
async def get_products(
    category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get all products with optional filtering"""
    try:
        query = db.collection('products')
        
        if category_id:
            query = query.where('category_id', '==', category_id)
        
        docs = query.stream()
        products = []
        
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Add current stock
            data['current_stock'] = calculate_total_stock(doc.id)
            
            # Filter by search if provided
            if search and search.lower() not in data['name'].lower():
                continue
            
            products.append(data)
        
        return {"success": True, "products": products}
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")

@router.post("/products")
async def create_product(
    product: Product,
    current_user: dict = Depends(get_current_user)
):
    """Create a new product"""
    try:
        product_id = str(uuid.uuid4())
        product_data = {
            'id': product_id,
            'name': product.name,
            'category_id': product.category_id,
            'unit': product.unit,
            'package_size': product.package_size,
            'cost_per_unit': product.cost_per_unit,
            'supplier_id': product.supplier_id,
            'barcode': product.barcode,
            'description': product.description,
            'allergens': product.allergens,
            'storage_requirements': product.storage_requirements,
            'shelf_life_days': product.shelf_life_days,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        db.collection('products').document(product_id).set(product_data)
        
        return {"success": True, "product_id": product_id, "message": "Product created successfully"}
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail="Failed to create product")

@router.get("/products/{product_id}")
async def get_product(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific product with inventory details"""
    try:
        # Get product
        product_doc = db.collection('products').document(product_id).get()
        if not product_doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_data = product_doc.to_dict()
        product_data['id'] = product_doc.id
        
        # Get inventory items
        inventory_items = get_fifo_items(product_id)
        product_data['inventory_items'] = inventory_items
        product_data['total_stock'] = sum(item['quantity'] for item in inventory_items)
        
        # Get recent adjustments
        adjustments = []
        adjustment_docs = db.collection('stock_adjustments')\
                           .where('product_id', '==', product_id)\
                           .order_by('adjustment_date', direction=firestore.Query.DESCENDING)\
                           .limit(10).stream()
        
        for doc in adjustment_docs:
            data = doc.to_dict()
            data['id'] = doc.id
            adjustments.append(data)
        
        product_data['recent_adjustments'] = adjustments
        
        return {"success": True, "product": product_data}
    except Exception as e:
        logger.error(f"Error fetching product: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch product")

@router.get("/inventory")
async def get_inventory(
    low_stock_only: bool = Query(False),
    expiring_soon: bool = Query(False),
    days_to_expiry: int = Query(7),
    current_user: dict = Depends(get_current_user)
):
    """Get inventory with optional filters"""
    try:
        inventory_items = []
        docs = db.collection('inventory').stream()
        
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Get product info
            product_doc = db.collection('products').document(data['product_id']).get()
            if product_doc.exists:
                product_data = product_doc.to_dict()
                data['product_name'] = product_data.get('name', 'Unknown')
                data['product_unit'] = product_data.get('unit', 'unit')
            
            # Apply filters
            if low_stock_only:
                total_stock = calculate_total_stock(data['product_id'])
                if total_stock > 5:  # threshold
                    continue
            
            if expiring_soon and data.get('expiry_date'):
                expiry_date = data['expiry_date']
                if isinstance(expiry_date, str):
                    expiry_date = datetime.strptime(expiry_date, '%Y-%m-%d').date()
                days_until_expiry = (expiry_date - date.today()).days
                if days_until_expiry > days_to_expiry:
                    continue
            
            inventory_items.append(data)
        
        return {"success": True, "inventory": inventory_items}
    except Exception as e:
        logger.error(f"Error fetching inventory: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch inventory")

@router.post("/inventory")
async def add_inventory_item(
    item: InventoryItem,
    current_user: dict = Depends(get_current_user)
):
    """Add new inventory item"""
    try:
        item_id = str(uuid.uuid4())
        item_data = {
            'id': item_id,
            'product_id': item.product_id,
            'quantity': item.quantity,
            'unit': item.unit,
            'batch_number': item.batch_number,
            'expiry_date': item.expiry_date,
            'received_date': item.received_date or date.today(),
            'cost_per_unit': item.cost_per_unit,
            'location': item.location,
            'notes': item.notes,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        db.collection('inventory').document(item_id).set(item_data)
        
        # Create stock adjustment record
        create_stock_adjustment(
            product_id=item.product_id,
            quantity_change=item.quantity,
            adjustment_type='received',
            reason='Inventory item added',
            reference_id=item_id,
            user_id=current_user['uid']
        )
        
        # Check low stock alerts
        check_low_stock_alerts(item.product_id)
        
        return {"success": True, "item_id": item_id, "message": "Inventory item added successfully"}
    except Exception as e:
        logger.error(f"Error adding inventory item: {e}")
        raise HTTPException(status_code=500, detail="Failed to add inventory item")

@router.put("/inventory/{item_id}")
async def update_inventory_item(
    item_id: str,
    item: InventoryItem,
    current_user: dict = Depends(get_current_user)
):
    """Update existing inventory item"""
    try:
        # Get current item
        current_doc = db.collection('inventory').document(item_id).get()
        if not current_doc.exists:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        current_data = current_doc.to_dict()
        quantity_change = item.quantity - current_data.get('quantity', 0)
        
        # Update item
        item_data = {
            'quantity': item.quantity,
            'unit': item.unit,
            'batch_number': item.batch_number,
            'expiry_date': item.expiry_date,
            'received_date': item.received_date,
            'cost_per_unit': item.cost_per_unit,
            'location': item.location,
            'notes': item.notes,
            'updated_at': datetime.now()
        }
        
        db.collection('inventory').document(item_id).update(item_data)
        
        # Create stock adjustment if quantity changed
        if quantity_change != 0:
            create_stock_adjustment(
                product_id=item.product_id,
                quantity_change=quantity_change,
                adjustment_type='manual',
                reason='Inventory item updated',
                reference_id=item_id,
                user_id=current_user['uid']
            )
        
        return {"success": True, "message": "Inventory item updated successfully"}
    except Exception as e:
        logger.error(f"Error updating inventory item: {e}")
        raise HTTPException(status_code=500, detail="Failed to update inventory item")

@router.post("/inventory/adjust")
async def adjust_stock(
    adjustment: StockAdjustment,
    current_user: dict = Depends(get_current_user)
):
    """Manually adjust stock levels"""
    try:
        # Create adjustment record
        adjustment_id = create_stock_adjustment(
            product_id=adjustment.product_id,
            quantity_change=adjustment.quantity_change,
            adjustment_type=adjustment.adjustment_type,
            reason=adjustment.reason,
            reference_id=adjustment.reference_id,
            user_id=current_user['uid']
        )
        
        # Apply adjustment using FIFO
        if adjustment.quantity_change < 0:  # Deduction
            remaining = abs(adjustment.quantity_change)
            fifo_items = get_fifo_items(adjustment.product_id)
            
            for item in fifo_items:
                if remaining <= 0:
                    break
                
                item_quantity = item['quantity']
                if item_quantity <= remaining:
                    # Use entire item
                    db.collection('inventory').document(item['id']).delete()
                    remaining -= item_quantity
                else:
                    # Partial use
                    new_quantity = item_quantity - remaining
                    db.collection('inventory').document(item['id']).update({
                        'quantity': new_quantity,
                        'updated_at': datetime.now()
                    })
                    remaining = 0
        
        # Check low stock alerts
        check_low_stock_alerts(adjustment.product_id)
        
        return {"success": True, "adjustment_id": adjustment_id, "message": "Stock adjusted successfully"}
    except Exception as e:
        logger.error(f"Error adjusting stock: {e}")
        raise HTTPException(status_code=500, detail="Failed to adjust stock")

@router.get("/alerts/low-stock")
async def get_low_stock_alerts(
    current_user: dict = Depends(get_current_user)
):
    """Get all low stock alerts"""
    try:
        alerts = []
        docs = db.collection('low_stock_alerts')\
                .where('is_acknowledged', '==', False)\
                .order_by('alert_date', direction=firestore.Query.DESCENDING)\
                .stream()
        
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Get product info
            product_doc = db.collection('products').document(data['product_id']).get()
            if product_doc.exists:
                product_data = product_doc.to_dict()
                data['product_name'] = product_data.get('name', 'Unknown')
                data['product_unit'] = product_data.get('unit', 'unit')
            
            alerts.append(data)
        
        return {"success": True, "alerts": alerts}
    except Exception as e:
        logger.error(f"Error fetching low stock alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch alerts")

@router.post("/alerts/low-stock/{alert_id}/acknowledge")
async def acknowledge_low_stock_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Acknowledge a low stock alert"""
    try:
        db.collection('low_stock_alerts').document(alert_id).update({
            'is_acknowledged': True,
            'acknowledged_by': current_user['uid'],
            'acknowledged_at': datetime.now()
        })
        
        return {"success": True, "message": "Alert acknowledged"}
    except Exception as e:
        logger.error(f"Error acknowledging alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to acknowledge alert")

@router.get("/reports/inventory")
async def get_inventory_report(
    current_user: dict = Depends(get_current_user)
):
    """Generate comprehensive inventory report"""
    try:
        # Get all inventory items
        inventory_items = []
        docs = db.collection('inventory').stream()
        
        total_value = 0
        category_stats = {}
        
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Get product info
            product_doc = db.collection('products').document(data['product_id']).get()
            if product_doc.exists:
                product_data = product_doc.to_dict()
                data['product_name'] = product_data.get('name', 'Unknown')
                data['category_id'] = product_data.get('category_id', 'unknown')
                
                # Calculate value
                item_value = data['quantity'] * (data.get('cost_per_unit', 0) or 0)
                data['total_value'] = item_value
                total_value += item_value
                
                # Category stats
                category_id = data['category_id']
                if category_id not in category_stats:
                    category_stats[category_id] = {
                        'items': 0,
                        'value': 0,
                        'quantity': 0
                    }
                category_stats[category_id]['items'] += 1
                category_stats[category_id]['value'] += item_value
                category_stats[category_id]['quantity'] += data['quantity']
            
            inventory_items.append(data)
        
        # Get low stock count
        low_stock_count = len(list(db.collection('low_stock_alerts')
                                   .where('is_acknowledged', '==', False).stream()))
        
        # Get expiring items count
        expiring_count = 0
        for item in inventory_items:
            if item.get('expiry_date'):
                expiry_date = item['expiry_date']
                if isinstance(expiry_date, str):
                    expiry_date = datetime.strptime(expiry_date, '%Y-%m-%d').date()
                days_until_expiry = (expiry_date - date.today()).days
                if days_until_expiry <= 7:
                    expiring_count += 1
        
        # Top value items
        top_value_items = sorted(inventory_items, 
                                key=lambda x: x.get('total_value', 0), 
                                reverse=True)[:10]
        
        report = InventoryReport(
            total_value=total_value,
            total_items=len(inventory_items),
            low_stock_items=low_stock_count,
            expiring_items=expiring_count,
            categories=category_stats,
            top_value_items=top_value_items
        )
        
        return {"success": True, "report": report.dict()}
    except Exception as e:
        logger.error(f"Error generating inventory report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")

@router.post("/stocktake")
async def create_stocktake(
    stocktake_data: Dict[str, float],  # product_id -> actual_quantity
    current_user: dict = Depends(get_current_user)
):
    """Perform stocktake and adjust inventory"""
    try:
        adjustments = []
        
        for product_id, actual_quantity in stocktake_data.items():
            current_stock = calculate_total_stock(product_id)
            difference = actual_quantity - current_stock
            
            if difference != 0:
                # Create adjustment
                adjustment_id = create_stock_adjustment(
                    product_id=product_id,
                    quantity_change=difference,
                    adjustment_type='stocktake',
                    reason='Stocktake adjustment',
                    user_id=current_user['uid']
                )
                
                adjustments.append({
                    'product_id': product_id,
                    'current_stock': current_stock,
                    'actual_quantity': actual_quantity,
                    'difference': difference,
                    'adjustment_id': adjustment_id
                })
                
                # Apply adjustment
                if difference < 0:
                    # Deduct using FIFO
                    remaining = abs(difference)
                    fifo_items = get_fifo_items(product_id)
                    
                    for item in fifo_items:
                        if remaining <= 0:
                            break
                        
                        item_quantity = item['quantity']
                        if item_quantity <= remaining:
                            db.collection('inventory').document(item['id']).delete()
                            remaining -= item_quantity
                        else:
                            new_quantity = item_quantity - remaining
                            db.collection('inventory').document(item['id']).update({
                                'quantity': new_quantity,
                                'updated_at': datetime.now()
                            })
                            remaining = 0
        
        # Check low stock alerts for all affected products
        for product_id in stocktake_data.keys():
            check_low_stock_alerts(product_id)
        
        return {"success": True, "adjustments": adjustments, "message": "Stocktake completed"}
    except Exception as e:
        logger.error(f"Error performing stocktake: {e}")
        raise HTTPException(status_code=500, detail="Failed to perform stocktake")

@router.get("/expiring")
async def get_expiring_items(
    days: int = Query(7),
    current_user: dict = Depends(get_current_user)
):
    """Get items expiring within specified days"""
    try:
        expiring_items = []
        docs = db.collection('inventory').stream()
        
        for doc in docs:
            data = doc.to_dict()
            
            if data.get('expiry_date'):
                expiry_date = data['expiry_date']
                if isinstance(expiry_date, str):
                    expiry_date = datetime.strptime(expiry_date, '%Y-%m-%d').date()
                
                days_until_expiry = (expiry_date - date.today()).days
                
                if days_until_expiry <= days:
                    data['id'] = doc.id
                    data['days_until_expiry'] = days_until_expiry
                    
                    # Get product info
                    product_doc = db.collection('products').document(data['product_id']).get()
                    if product_doc.exists:
                        product_data = product_doc.to_dict()
                        data['product_name'] = product_data.get('name', 'Unknown')
                    
                    expiring_items.append(data)
        
        # Sort by expiry date
        expiring_items.sort(key=lambda x: x.get('expiry_date', date.max))
        
        return {"success": True, "expiring_items": expiring_items}
    except Exception as e:
        logger.error(f"Error fetching expiring items: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch expiring items")