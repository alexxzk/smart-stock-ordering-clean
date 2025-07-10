"""
Menu & Recipe Management API
Handles menu items, recipes, ingredient linking, cost calculations, and margin analysis
"""

from datetime import datetime, date
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field
import uuid
import logging
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
class MenuCategory(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class MenuItem(BaseModel):
    id: Optional[str] = None
    name: str
    category_id: Optional[str] = None
    description: Optional[str] = None
    price: float
    cost: Optional[float] = None
    margin_percentage: Optional[float] = None
    preparation_time: Optional[int] = None  # minutes
    is_active: bool = True
    allergens: Optional[List[str]] = []
    dietary_tags: Optional[List[str]] = []  # vegetarian, vegan, gluten-free, etc.
    image_url: Optional[str] = None

class RecipeIngredient(BaseModel):
    id: Optional[str] = None
    menu_item_id: str
    product_id: str
    quantity: float
    unit: str
    notes: Optional[str] = None

class MenuItemWithRecipe(BaseModel):
    menu_item: MenuItem
    ingredients: List[RecipeIngredient]
    calculated_cost: float
    calculated_margin: float
    ingredient_availability: Dict[str, bool]

class CostAnalysis(BaseModel):
    item_id: str
    item_name: str
    selling_price: float
    ingredient_cost: float
    labor_cost: float
    overhead_cost: float
    total_cost: float
    gross_margin: float
    margin_percentage: float
    profitability_score: str  # High, Medium, Low

class MenuReport(BaseModel):
    total_items: int
    active_items: int
    categories: Dict[str, int]
    average_price: float
    average_cost: float
    average_margin: float
    top_margin_items: List[Dict[str, Any]]
    low_margin_items: List[Dict[str, Any]]
    missing_cost_items: List[Dict[str, Any]]

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

def calculate_menu_item_cost(menu_item_id: str) -> float:
    """Calculate the cost of a menu item based on its ingredients"""
    try:
        if not db:
            return 0.0
            
        total_cost = 0.0
        
        # Get recipe ingredients
        recipe_ingredients = db.collection('recipe_ingredients')\
                              .where('menu_item_id', '==', menu_item_id)\
                              .stream()
        
        for ingredient in recipe_ingredients:
            ingredient_data = ingredient.to_dict()
            product_id = ingredient_data.get('product_id')
            quantity = ingredient_data.get('quantity', 0)
            
            if product_id and quantity > 0:
                # Get product cost
                product_doc = db.collection('products').document(product_id).get()
                if product_doc.exists:
                    product_data = product_doc.to_dict()
                    cost_per_unit = product_data.get('cost_per_unit', 0)
                    
                    if cost_per_unit:
                        ingredient_cost = quantity * cost_per_unit
                        total_cost += ingredient_cost
        
        return total_cost
        
    except Exception as e:
        logger.error(f"Error calculating menu item cost: {e}")
        return 0.0

def check_ingredient_availability(menu_item_id: str) -> Dict[str, bool]:
    """Check if all ingredients for a menu item are available in inventory"""
    try:
        if not db:
            return {}
            
        availability = {}
        
        # Get recipe ingredients
        recipe_ingredients = db.collection('recipe_ingredients')\
                              .where('menu_item_id', '==', menu_item_id)\
                              .stream()
        
        for ingredient in recipe_ingredients:
            ingredient_data = ingredient.to_dict()
            product_id = ingredient_data.get('product_id')
            required_quantity = ingredient_data.get('quantity', 0)
            
            if product_id:
                # Calculate total available stock
                total_stock = 0.0
                inventory_items = db.collection('inventory')\
                                  .where('product_id', '==', product_id)\
                                  .stream()
                
                for item in inventory_items:
                    item_data = item.to_dict()
                    total_stock += item_data.get('quantity', 0)
                
                availability[product_id] = total_stock >= required_quantity
        
        return availability
        
    except Exception as e:
        logger.error(f"Error checking ingredient availability: {e}")
        return {}

def update_menu_item_cost_and_margin(menu_item_id: str):
    """Update menu item cost and margin based on current ingredient costs"""
    try:
        if not db:
            return
            
        # Calculate current cost
        calculated_cost = calculate_menu_item_cost(menu_item_id)
        
        # Get current menu item
        menu_item = db.collection('menu_items').document(menu_item_id).get()
        if menu_item.exists:
            menu_data = menu_item.to_dict()
            price = menu_data.get('price', 0)
            
            # Calculate margin
            if price > 0 and calculated_cost > 0:
                margin_percentage = ((price - calculated_cost) / price) * 100
            else:
                margin_percentage = 0
            
            # Update menu item
            db.collection('menu_items').document(menu_item_id).update({
                'cost': calculated_cost,
                'margin_percentage': margin_percentage,
                'updated_at': datetime.now()
            })
            
    except Exception as e:
        logger.error(f"Error updating menu item cost and margin: {e}")

# API Endpoints

@router.get("/categories")
async def get_menu_categories(
    current_user: dict = Depends(get_current_user)
):
    """Get all menu categories"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        categories = []
        docs = db.collection('menu_categories')\
                .order_by('display_order')\
                .stream()
        
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            categories.append(data)
        
        return {"success": True, "categories": categories}
    except Exception as e:
        logger.error(f"Error fetching menu categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")

@router.post("/categories")
async def create_menu_category(
    category: MenuCategory,
    current_user: dict = Depends(get_current_user)
):
    """Create a new menu category"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        category_id = str(uuid.uuid4())
        category_data = {
            'id': category_id,
            'name': category.name,
            'description': category.description,
            'display_order': category.display_order,
            'is_active': category.is_active,
            'created_at': datetime.now()
        }
        
        db.collection('menu_categories').document(category_id).set(category_data)
        
        return {"success": True, "category_id": category_id, "message": "Category created successfully"}
    except Exception as e:
        logger.error(f"Error creating menu category: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")

@router.get("/items")
async def get_menu_items(
    category_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    include_cost: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """Get all menu items with optional filtering"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        query = db.collection('menu_items')
        
        if category_id:
            query = query.where('category_id', '==', category_id)
        
        if active_only:
            query = query.where('is_active', '==', True)
        
        docs = query.stream()
        items = []
        
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Get category name
            if data.get('category_id'):
                category = db.collection('menu_categories').document(data['category_id']).get()
                if category.exists:
                    data['category_name'] = category.to_dict().get('name', 'Unknown')
            
            # Include cost analysis if requested
            if include_cost:
                calculated_cost = calculate_menu_item_cost(doc.id)
                data['calculated_cost'] = calculated_cost
                
                # Recalculate margin
                price = data.get('price', 0)
                if price > 0 and calculated_cost > 0:
                    data['calculated_margin'] = ((price - calculated_cost) / price) * 100
                else:
                    data['calculated_margin'] = 0
                
                # Check ingredient availability
                data['ingredient_availability'] = check_ingredient_availability(doc.id)
                
                # Get ingredient count
                ingredient_count = len(list(db.collection('recipe_ingredients')
                                          .where('menu_item_id', '==', doc.id)
                                          .stream()))
                data['ingredient_count'] = ingredient_count
            
            items.append(data)
        
        return {"success": True, "items": items}
    except Exception as e:
        logger.error(f"Error fetching menu items: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch menu items")

@router.post("/items")
async def create_menu_item(
    item: MenuItem,
    current_user: dict = Depends(get_current_user)
):
    """Create a new menu item"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        item_id = str(uuid.uuid4())
        item_data = {
            'id': item_id,
            'name': item.name,
            'category_id': item.category_id,
            'description': item.description,
            'price': item.price,
            'cost': item.cost,
            'margin_percentage': item.margin_percentage,
            'preparation_time': item.preparation_time,
            'is_active': item.is_active,
            'allergens': item.allergens,
            'dietary_tags': item.dietary_tags,
            'image_url': item.image_url,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        db.collection('menu_items').document(item_id).set(item_data)
        
        return {"success": True, "item_id": item_id, "message": "Menu item created successfully"}
    except Exception as e:
        logger.error(f"Error creating menu item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create menu item")

@router.get("/items/{item_id}")
async def get_menu_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific menu item with recipe details"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        # Get menu item
        item_doc = db.collection('menu_items').document(item_id).get()
        if not item_doc.exists:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        item_data = item_doc.to_dict()
        item_data['id'] = item_doc.id
        
        # Get category name
        if item_data.get('category_id'):
            category = db.collection('menu_categories').document(item_data['category_id']).get()
            if category.exists:
                item_data['category_name'] = category.to_dict().get('name', 'Unknown')
        
        # Get recipe ingredients
        ingredients = []
        ingredient_docs = db.collection('recipe_ingredients')\
                           .where('menu_item_id', '==', item_id)\
                           .stream()
        
        for ingredient_doc in ingredient_docs:
            ingredient_data = ingredient_doc.to_dict()
            ingredient_data['id'] = ingredient_doc.id
            
            # Get product info
            product_doc = db.collection('products').document(ingredient_data['product_id']).get()
            if product_doc.exists:
                product_data = product_doc.to_dict()
                ingredient_data['product_name'] = product_data.get('name', 'Unknown')
                ingredient_data['product_unit'] = product_data.get('unit', 'unit')
                ingredient_data['product_cost_per_unit'] = product_data.get('cost_per_unit', 0)
                
                # Calculate ingredient cost
                quantity = ingredient_data.get('quantity', 0)
                cost_per_unit = product_data.get('cost_per_unit', 0)
                ingredient_data['total_cost'] = quantity * cost_per_unit
            
            ingredients.append(ingredient_data)
        
        # Calculate costs
        calculated_cost = calculate_menu_item_cost(item_id)
        item_data['calculated_cost'] = calculated_cost
        
        # Calculate margin
        price = item_data.get('price', 0)
        if price > 0 and calculated_cost > 0:
            item_data['calculated_margin'] = ((price - calculated_cost) / price) * 100
        else:
            item_data['calculated_margin'] = 0
        
        # Check ingredient availability
        item_data['ingredient_availability'] = check_ingredient_availability(item_id)
        
        # Get sales data (recent sales)
        sales_items = db.collection('sales_transaction_items')\
                       .where('menu_item_id', '==', item_id)\
                       .limit(10)\
                       .stream()
        
        recent_sales = []
        for sales_item in sales_items:
            sales_data = sales_item.to_dict()
            recent_sales.append({
                'date': sales_data.get('created_at'),
                'quantity': sales_data.get('quantity', 0),
                'total_price': sales_data.get('total_price', 0)
            })
        
        item_data['recent_sales'] = recent_sales
        item_data['ingredients'] = ingredients
        
        return {"success": True, "item": item_data}
    except Exception as e:
        logger.error(f"Error fetching menu item: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch menu item")

@router.put("/items/{item_id}")
async def update_menu_item(
    item_id: str,
    item: MenuItem,
    current_user: dict = Depends(get_current_user)
):
    """Update a menu item"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        # Check if item exists
        item_doc = db.collection('menu_items').document(item_id).get()
        if not item_doc.exists:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        item_data = {
            'name': item.name,
            'category_id': item.category_id,
            'description': item.description,
            'price': item.price,
            'preparation_time': item.preparation_time,
            'is_active': item.is_active,
            'allergens': item.allergens,
            'dietary_tags': item.dietary_tags,
            'image_url': item.image_url,
            'updated_at': datetime.now()
        }
        
        # If price changed, recalculate margin
        if item.price != item_doc.to_dict().get('price', 0):
            calculated_cost = calculate_menu_item_cost(item_id)
            if item.price > 0 and calculated_cost > 0:
                item_data['margin_percentage'] = ((item.price - calculated_cost) / item.price) * 100
            else:
                item_data['margin_percentage'] = 0
            item_data['cost'] = calculated_cost
        
        db.collection('menu_items').document(item_id).update(item_data)
        
        return {"success": True, "message": "Menu item updated successfully"}
    except Exception as e:
        logger.error(f"Error updating menu item: {e}")
        raise HTTPException(status_code=500, detail="Failed to update menu item")

@router.post("/items/{item_id}/ingredients")
async def add_recipe_ingredient(
    item_id: str,
    ingredient: RecipeIngredient,
    current_user: dict = Depends(get_current_user)
):
    """Add ingredient to recipe"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        # Check if menu item exists
        item_doc = db.collection('menu_items').document(item_id).get()
        if not item_doc.exists:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        # Check if product exists
        product_doc = db.collection('products').document(ingredient.product_id).get()
        if not product_doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        ingredient_id = str(uuid.uuid4())
        ingredient_data = {
            'id': ingredient_id,
            'menu_item_id': item_id,
            'product_id': ingredient.product_id,
            'quantity': ingredient.quantity,
            'unit': ingredient.unit,
            'notes': ingredient.notes,
            'created_at': datetime.now()
        }
        
        db.collection('recipe_ingredients').document(ingredient_id).set(ingredient_data)
        
        # Update menu item cost and margin
        update_menu_item_cost_and_margin(item_id)
        
        return {"success": True, "ingredient_id": ingredient_id, "message": "Ingredient added successfully"}
    except Exception as e:
        logger.error(f"Error adding recipe ingredient: {e}")
        raise HTTPException(status_code=500, detail="Failed to add ingredient")

@router.put("/items/{item_id}/ingredients/{ingredient_id}")
async def update_recipe_ingredient(
    item_id: str,
    ingredient_id: str,
    ingredient: RecipeIngredient,
    current_user: dict = Depends(get_current_user)
):
    """Update recipe ingredient"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        # Check if ingredient exists
        ingredient_doc = db.collection('recipe_ingredients').document(ingredient_id).get()
        if not ingredient_doc.exists:
            raise HTTPException(status_code=404, detail="Recipe ingredient not found")
        
        ingredient_data = {
            'quantity': ingredient.quantity,
            'unit': ingredient.unit,
            'notes': ingredient.notes,
            'updated_at': datetime.now()
        }
        
        db.collection('recipe_ingredients').document(ingredient_id).update(ingredient_data)
        
        # Update menu item cost and margin
        update_menu_item_cost_and_margin(item_id)
        
        return {"success": True, "message": "Ingredient updated successfully"}
    except Exception as e:
        logger.error(f"Error updating recipe ingredient: {e}")
        raise HTTPException(status_code=500, detail="Failed to update ingredient")

@router.delete("/items/{item_id}/ingredients/{ingredient_id}")
async def remove_recipe_ingredient(
    item_id: str,
    ingredient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove ingredient from recipe"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        # Check if ingredient exists
        ingredient_doc = db.collection('recipe_ingredients').document(ingredient_id).get()
        if not ingredient_doc.exists:
            raise HTTPException(status_code=404, detail="Recipe ingredient not found")
        
        db.collection('recipe_ingredients').document(ingredient_id).delete()
        
        # Update menu item cost and margin
        update_menu_item_cost_and_margin(item_id)
        
        return {"success": True, "message": "Ingredient removed successfully"}
    except Exception as e:
        logger.error(f"Error removing recipe ingredient: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove ingredient")

@router.get("/cost-analysis")
async def get_cost_analysis(
    current_user: dict = Depends(get_current_user)
):
    """Get cost analysis for all menu items"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        items = db.collection('menu_items').where('is_active', '==', True).stream()
        
        cost_analysis = []
        
        for item in items:
            item_data = item.to_dict()
            item_id = item.id
            
            # Calculate costs
            ingredient_cost = calculate_menu_item_cost(item_id)
            selling_price = item_data.get('price', 0)
            
            # Estimate labor and overhead costs (can be made configurable)
            labor_cost = ingredient_cost * 0.3  # 30% of ingredient cost
            overhead_cost = ingredient_cost * 0.2  # 20% of ingredient cost
            
            total_cost = ingredient_cost + labor_cost + overhead_cost
            gross_margin = selling_price - total_cost
            
            if selling_price > 0:
                margin_percentage = (gross_margin / selling_price) * 100
            else:
                margin_percentage = 0
            
            # Determine profitability score
            if margin_percentage >= 60:
                profitability_score = "High"
            elif margin_percentage >= 30:
                profitability_score = "Medium"
            else:
                profitability_score = "Low"
            
            analysis = CostAnalysis(
                item_id=item_id,
                item_name=item_data.get('name', 'Unknown'),
                selling_price=selling_price,
                ingredient_cost=ingredient_cost,
                labor_cost=labor_cost,
                overhead_cost=overhead_cost,
                total_cost=total_cost,
                gross_margin=gross_margin,
                margin_percentage=margin_percentage,
                profitability_score=profitability_score
            )
            
            cost_analysis.append(analysis.dict())
        
        return {"success": True, "cost_analysis": cost_analysis}
    except Exception as e:
        logger.error(f"Error generating cost analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate cost analysis")

@router.post("/recalculate-costs")
async def recalculate_all_costs(
    current_user: dict = Depends(get_current_user)
):
    """Recalculate costs and margins for all menu items"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        items = db.collection('menu_items').stream()
        updated_count = 0
        
        for item in items:
            item_id = item.id
            update_menu_item_cost_and_margin(item_id)
            updated_count += 1
        
        return {"success": True, "updated_items": updated_count, "message": "Costs recalculated successfully"}
    except Exception as e:
        logger.error(f"Error recalculating costs: {e}")
        raise HTTPException(status_code=500, detail="Failed to recalculate costs")

@router.get("/reports/menu")
async def get_menu_report(
    current_user: dict = Depends(get_current_user)
):
    """Generate comprehensive menu report"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        items = db.collection('menu_items').stream()
        
        total_items = 0
        active_items = 0
        categories = {}
        prices = []
        costs = []
        margins = []
        
        top_margin_items = []
        low_margin_items = []
        missing_cost_items = []
        
        for item in items:
            item_data = item.to_dict()
            item_id = item.id
            
            total_items += 1
            
            if item_data.get('is_active', False):
                active_items += 1
            
            # Category stats
            category_id = item_data.get('category_id', 'uncategorized')
            if category_id not in categories:
                categories[category_id] = 0
            categories[category_id] += 1
            
            # Price and cost analysis
            price = item_data.get('price', 0)
            calculated_cost = calculate_menu_item_cost(item_id)
            
            if price > 0:
                prices.append(price)
                
                if calculated_cost > 0:
                    costs.append(calculated_cost)
                    margin = ((price - calculated_cost) / price) * 100
                    margins.append(margin)
                    
                    item_analysis = {
                        'id': item_id,
                        'name': item_data.get('name', 'Unknown'),
                        'price': price,
                        'cost': calculated_cost,
                        'margin': margin
                    }
                    
                    if margin >= 60:
                        top_margin_items.append(item_analysis)
                    elif margin <= 20:
                        low_margin_items.append(item_analysis)
                else:
                    missing_cost_items.append({
                        'id': item_id,
                        'name': item_data.get('name', 'Unknown'),
                        'price': price
                    })
        
        # Get category names
        category_names = {}
        for category_id in categories.keys():
            if category_id != 'uncategorized':
                category_doc = db.collection('menu_categories').document(category_id).get()
                if category_doc.exists:
                    category_names[category_doc.to_dict().get('name', 'Unknown')] = categories[category_id]
                else:
                    category_names['Unknown'] = categories[category_id]
            else:
                category_names['Uncategorized'] = categories[category_id]
        
        # Sort items by margin
        top_margin_items.sort(key=lambda x: x['margin'], reverse=True)
        low_margin_items.sort(key=lambda x: x['margin'])
        
        report = MenuReport(
            total_items=total_items,
            active_items=active_items,
            categories=category_names,
            average_price=sum(prices) / len(prices) if prices else 0,
            average_cost=sum(costs) / len(costs) if costs else 0,
            average_margin=sum(margins) / len(margins) if margins else 0,
            top_margin_items=top_margin_items[:10],
            low_margin_items=low_margin_items[:10],
            missing_cost_items=missing_cost_items
        )
        
        return {"success": True, "report": report.dict()}
    except Exception as e:
        logger.error(f"Error generating menu report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate menu report")

@router.get("/allergens")
async def get_allergen_report(
    current_user: dict = Depends(get_current_user)
):
    """Get allergen information for all menu items"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not available")
            
        items = db.collection('menu_items').where('is_active', '==', True).stream()
        
        allergen_items = []
        allergen_summary = {}
        
        for item in items:
            item_data = item.to_dict()
            allergens = item_data.get('allergens', [])
            
            if allergens:
                allergen_items.append({
                    'id': item.id,
                    'name': item_data.get('name', 'Unknown'),
                    'allergens': allergens,
                    'category_id': item_data.get('category_id')
                })
                
                # Count allergens
                for allergen in allergens:
                    if allergen not in allergen_summary:
                        allergen_summary[allergen] = 0
                    allergen_summary[allergen] += 1
        
        return {"success": True, "allergen_items": allergen_items, "allergen_summary": allergen_summary}
    except Exception as e:
        logger.error(f"Error generating allergen report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate allergen report")