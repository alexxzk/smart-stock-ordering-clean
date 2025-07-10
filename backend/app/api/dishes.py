from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Optional
from datetime import datetime, date
import logging
import uuid

from app.models.enhanced_inventory import (
    Dish, DishCreate, DishUpdate, DishResponse,
    DishIngredient, DishIngredientCreate, DishIngredientUpdate,
    DishSale, DishSaleCreate, DishSaleResponse,
    DishProfitability, BatchSalesEntry, POSSaleData,
    TransactionType, StockTransactionCreate
)
from app.firebase_init import get_firestore_client
from app.cache_redis import cached, invalidate_cache

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# Helper function for authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In production, this would verify the JWT token
    return {"uid": "test-user", "email": "test@example.com"}

# ==================== DISH MANAGEMENT ====================

@router.post("/", response_model=DishResponse)
async def create_dish(
    dish: DishCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new dish"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Create dish document
        dish_data = {
            **dish.dict(),
            "dish_id": str(uuid.uuid4()),
            "user_id": user["uid"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        doc_ref = db.collection("dishes").document(dish_data["dish_id"])
        doc_ref.set(dish_data)
        
        # Invalidate cache
        invalidate_cache("dishes")
        
        return DishResponse(**dish_data, ingredients=[], total_ingredient_cost=0.0)
        
    except Exception as e:
        logger.error(f"Error creating dish: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating dish: {str(e)}")

@router.get("/", response_model=List[DishResponse])
@cached(ttl=300, key_prefix="dishes")
async def get_dishes(
    user: dict = Depends(get_current_user),
    category: Optional[str] = Query(None, description="Filter by dish category"),
    active_only: bool = Query(True, description="Show only active dishes")
):
    """Get all dishes for the current user"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Build query
        dishes_ref = db.collection("dishes")
        query = dishes_ref.where("user_id", "==", user["uid"])
        
        if category:
            query = query.where("category", "==", category)
        if active_only:
            query = query.where("is_active", "==", True)
        
        docs = query.stream()
        dishes = []
        
        for doc in docs:
            dish_data = doc.to_dict()
            dish_data["dish_id"] = doc.id
            
            # Get ingredients for this dish
            ingredients = await get_dish_ingredients_data(dish_data["dish_id"])
            
            # Calculate total ingredient cost
            total_cost = sum(
                ingredient.get("cost_per_serving", 0) 
                for ingredient in ingredients
            )
            
            # Calculate profit margin
            profit_margin = None
            if dish_data.get("selling_price", 0) > 0:
                profit = dish_data["selling_price"] - total_cost
                profit_margin = (profit / dish_data["selling_price"]) * 100
            
            dishes.append(DishResponse(
                **dish_data,
                ingredients=ingredients,
                total_ingredient_cost=total_cost,
                profit_margin=profit_margin
            ))
        
        return dishes
        
    except Exception as e:
        logger.error(f"Error fetching dishes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching dishes: {str(e)}")

@router.get("/{dish_id}", response_model=DishResponse)
async def get_dish(
    dish_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a specific dish with all details"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get dish
        doc_ref = db.collection("dishes").document(dish_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Dish not found")
        
        dish_data = doc.to_dict()
        if dish_data["user_id"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        dish_data["dish_id"] = doc.id
        
        # Get ingredients
        ingredients = await get_dish_ingredients_data(dish_id)
        
        # Calculate costs
        total_cost = sum(
            ingredient.get("cost_per_serving", 0) 
            for ingredient in ingredients
        )
        
        profit_margin = None
        if dish_data.get("selling_price", 0) > 0:
            profit = dish_data["selling_price"] - total_cost
            profit_margin = (profit / dish_data["selling_price"]) * 100
        
        return DishResponse(
            **dish_data,
            ingredients=ingredients,
            total_ingredient_cost=total_cost,
            profit_margin=profit_margin
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dish: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching dish: {str(e)}")

@router.put("/{dish_id}", response_model=DishResponse)
async def update_dish(
    dish_id: str,
    dish_update: DishUpdate,
    user: dict = Depends(get_current_user)
):
    """Update a dish"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Verify ownership
        doc_ref = db.collection("dishes").document(dish_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Dish not found")
        
        dish_data = doc.to_dict()
        if dish_data["user_id"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update only provided fields
        update_data = {k: v for k, v in dish_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now()
        
        doc_ref.update(update_data)
        
        # Invalidate cache
        invalidate_cache("dishes")
        
        # Return updated dish
        return await get_dish(dish_id, user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dish: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating dish: {str(e)}")

@router.delete("/{dish_id}")
async def delete_dish(
    dish_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a dish"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Verify ownership
        doc_ref = db.collection("dishes").document(dish_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Dish not found")
        
        dish_data = doc.to_dict()
        if dish_data["user_id"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete dish and all its ingredients
        batch = db.batch()
        
        # Delete dish
        batch.delete(doc_ref)
        
        # Delete dish ingredients
        ingredients_ref = db.collection("dish_ingredients").where("dish_id", "==", dish_id)
        for ingredient_doc in ingredients_ref.stream():
            batch.delete(ingredient_doc.reference)
        
        batch.commit()
        
        # Invalidate cache
        invalidate_cache("dishes")
        
        return {"message": "Dish deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting dish: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting dish: {str(e)}")

# ==================== INGREDIENT MANAGEMENT ====================

@router.post("/{dish_id}/ingredients", response_model=DishIngredient)
async def add_ingredient_to_dish(
    dish_id: str,
    ingredient: DishIngredientCreate,
    user: dict = Depends(get_current_user)
):
    """Add an ingredient to a dish recipe"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Verify dish ownership
        await verify_dish_ownership(dish_id, user["uid"])
        
        # Verify ingredient exists
        ingredient_doc = db.collection("ingredients").document(ingredient.ingredient_id).get()
        if not ingredient_doc.exists:
            raise HTTPException(status_code=404, detail="Ingredient not found")
        
        ingredient_data = ingredient_doc.to_dict()
        
        # Calculate cost per serving
        cost_per_serving = ingredient.quantity_needed * ingredient_data.get("cost_per_unit", 0)
        
        # Create dish ingredient
        dish_ingredient_data = {
            **ingredient.dict(),
            "dish_id": dish_id,
            "cost_per_serving": cost_per_serving,
            "created_at": datetime.now()
        }
        
        # Check if ingredient already exists for this dish
        existing_query = db.collection("dish_ingredients").where("dish_id", "==", dish_id).where("ingredient_id", "==", ingredient.ingredient_id)
        existing_docs = list(existing_query.stream())
        
        if existing_docs:
            # Update existing
            doc_ref = existing_docs[0].reference
            doc_ref.update({
                **ingredient.dict(),
                "cost_per_serving": cost_per_serving,
                "updated_at": datetime.now()
            })
            dish_ingredient_data.update(existing_docs[0].to_dict())
        else:
            # Create new
            doc_ref = db.collection("dish_ingredients").add(dish_ingredient_data)
        
        # Invalidate cache
        invalidate_cache("dishes")
        
        return DishIngredient(**dish_ingredient_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding ingredient to dish: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding ingredient: {str(e)}")

@router.put("/{dish_id}/ingredients/{ingredient_id}")
async def update_dish_ingredient(
    dish_id: str,
    ingredient_id: str,
    ingredient_update: DishIngredientUpdate,
    user: dict = Depends(get_current_user)
):
    """Update ingredient quantity in a dish recipe"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Verify dish ownership
        await verify_dish_ownership(dish_id, user["uid"])
        
        # Find dish ingredient
        query = db.collection("dish_ingredients").where("dish_id", "==", dish_id).where("ingredient_id", "==", ingredient_id)
        docs = list(query.stream())
        
        if not docs:
            raise HTTPException(status_code=404, detail="Dish ingredient not found")
        
        doc_ref = docs[0].reference
        current_data = docs[0].to_dict()
        
        # Get ingredient cost
        ingredient_doc = db.collection("ingredients").document(ingredient_id).get()
        ingredient_data = ingredient_doc.to_dict()
        
        # Prepare update data
        update_data = {k: v for k, v in ingredient_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now()
        
        # Recalculate cost per serving if quantity changed
        if "quantity_needed" in update_data:
            update_data["cost_per_serving"] = update_data["quantity_needed"] * ingredient_data.get("cost_per_unit", 0)
        
        doc_ref.update(update_data)
        
        # Invalidate cache
        invalidate_cache("dishes")
        
        return {"message": "Dish ingredient updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dish ingredient: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating ingredient: {str(e)}")

@router.delete("/{dish_id}/ingredients/{ingredient_id}")
async def remove_ingredient_from_dish(
    dish_id: str,
    ingredient_id: str,
    user: dict = Depends(get_current_user)
):
    """Remove an ingredient from a dish recipe"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Verify dish ownership
        await verify_dish_ownership(dish_id, user["uid"])
        
        # Find and delete dish ingredient
        query = db.collection("dish_ingredients").where("dish_id", "==", dish_id).where("ingredient_id", "==", ingredient_id)
        docs = list(query.stream())
        
        if not docs:
            raise HTTPException(status_code=404, detail="Dish ingredient not found")
        
        docs[0].reference.delete()
        
        # Invalidate cache
        invalidate_cache("dishes")
        
        return {"message": "Ingredient removed from dish successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing ingredient from dish: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error removing ingredient: {str(e)}")

# ==================== SALES INTEGRATION ====================

@router.post("/sales/record-sale", response_model=DishSaleResponse)
async def record_dish_sale(
    sale: DishSaleCreate,
    user: dict = Depends(get_current_user)
):
    """Record a dish sale and automatically deduct ingredients from stock"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get dish details
        dish_doc = db.collection("dishes").document(sale.dish_id).get()
        if not dish_doc.exists:
            raise HTTPException(status_code=404, detail="Dish not found")
        
        dish_data = dish_doc.to_dict()
        
        # Get dish ingredients
        ingredients = await get_dish_ingredients_data(sale.dish_id)
        
        # Check stock availability and calculate costs
        total_ingredient_cost = 0
        stock_deductions = []
        
        for ingredient in ingredients:
            # Get current stock
            ingredient_doc = db.collection("ingredients").document(ingredient["ingredient_id"]).get()
            if not ingredient_doc.exists:
                continue
                
            ingredient_data = ingredient_doc.to_dict()
            current_stock = ingredient_data.get("current_stock", 0)
            
            # Calculate total needed
            total_needed = ingredient["quantity_needed"] * sale.quantity_sold
            
            # Check if enough stock (only for critical ingredients)
            if ingredient.get("is_critical", True) and current_stock < total_needed:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock for {ingredient_data.get('name', 'ingredient')}: "
                           f"need {total_needed}, have {current_stock}"
                )
            
            # Calculate cost
            cost = total_needed * ingredient_data.get("cost_per_unit", 0)
            total_ingredient_cost += cost
            
            # Prepare stock deduction
            if current_stock >= total_needed:
                stock_deductions.append({
                    "ingredient_id": ingredient["ingredient_id"],
                    "quantity": total_needed,
                    "cost": cost
                })
        
        # Record the sale
        sale_data = {
            **sale.dict(),
            "sale_id": str(uuid.uuid4()),
            "dish_name": dish_data.get("name"),
            "total_revenue": dish_data.get("selling_price", 0) * sale.quantity_sold,
            "ingredient_cost": total_ingredient_cost,
            "profit_margin": 0,
            "sale_timestamp": datetime.now(),
            "user_id": user["uid"]
        }
        
        # Calculate profit margin
        if sale_data["total_revenue"] > 0:
            profit = sale_data["total_revenue"] - total_ingredient_cost
            sale_data["profit_margin"] = (profit / sale_data["total_revenue"]) * 100
        
        # Use transaction to ensure consistency
        batch = db.batch()
        
        # Record sale
        sale_ref = db.collection("dish_sales").document(sale_data["sale_id"])
        batch.set(sale_ref, sale_data)
        
        # Deduct stock and record transactions
        for deduction in stock_deductions:
            # Update ingredient stock
            ingredient_ref = db.collection("ingredients").document(deduction["ingredient_id"])
            batch.update(ingredient_ref, {
                "current_stock": db.FieldValue.increment(-deduction["quantity"]),
                "updated_at": datetime.now()
            })
            
            # Record stock transaction
            transaction_data = {
                "transaction_id": str(uuid.uuid4()),
                "ingredient_id": deduction["ingredient_id"],
                "transaction_type": TransactionType.SALE.value,
                "quantity_change": -deduction["quantity"],
                "total_cost": deduction["cost"],
                "reference_id": sale_data["sale_id"],
                "reason": f"Dish sale: {dish_data.get('name')} x{sale.quantity_sold}",
                "timestamp": datetime.now(),
                "user_id": user["uid"]
            }
            
            transaction_ref = db.collection("stock_transactions").document(transaction_data["transaction_id"])
            batch.set(transaction_ref, transaction_data)
        
        batch.commit()
        
        # Invalidate relevant caches
        invalidate_cache("ingredients")
        invalidate_cache("stock")
        
        return DishSaleResponse(**sale_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording dish sale: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error recording sale: {str(e)}")

@router.post("/sales/batch-entry")
async def batch_sales_entry(
    batch_sales: BatchSalesEntry,
    user: dict = Depends(get_current_user)
):
    """Process multiple dish sales at once (e.g., end-of-day entry)"""
    try:
        results = []
        for sale in batch_sales.sales:
            try:
                result = await record_dish_sale(sale, user)
                results.append({"status": "success", "sale_id": result.sale_id})
            except Exception as e:
                results.append({"status": "error", "dish_id": sale.dish_id, "error": str(e)})
        
        return {
            "date": batch_sales.date,
            "total_sales": len(batch_sales.sales),
            "successful": len([r for r in results if r["status"] == "success"]),
            "failed": len([r for r in results if r["status"] == "error"]),
            "results": results,
            "notes": batch_sales.notes
        }
        
    except Exception as e:
        logger.error(f"Error processing batch sales: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing batch: {str(e)}")

@router.post("/sales/pos-webhook")
async def handle_pos_webhook(
    pos_data: POSSaleData,
    user: dict = Depends(get_current_user)
):
    """Handle sales data from POS system webhook"""
    try:
        results = []
        for item in pos_data.items:
            try:
                result = await record_dish_sale(item, user)
                results.append({"status": "success", "sale_id": result.sale_id})
            except Exception as e:
                results.append({"status": "error", "dish_id": item.dish_id, "error": str(e)})
        
        return {
            "transaction_id": pos_data.transaction_id,
            "timestamp": pos_data.timestamp,
            "processed_items": len(pos_data.items),
            "successful": len([r for r in results if r["status"] == "success"]),
            "failed": len([r for r in results if r["status"] == "error"]),
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error processing POS webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing POS data: {str(e)}")

# ==================== ANALYTICS ====================

@router.get("/profitability", response_model=List[DishProfitability])
async def get_dish_profitability(
    user: dict = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """Analyze dish profitability over specified period"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get all active dishes
        dishes_query = db.collection("dishes").where("user_id", "==", user["uid"]).where("is_active", "==", True)
        dishes = {doc.id: doc.to_dict() for doc in dishes_query.stream()}
        
        # Get sales data for the period
        from_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        from_date = from_date.replace(day=from_date.day - days)
        
        sales_query = db.collection("dish_sales").where("user_id", "==", user["uid"]).where("sale_timestamp", ">=", from_date)
        sales_data = {}
        
        for sale_doc in sales_query.stream():
            sale = sale_doc.to_dict()
            dish_id = sale["dish_id"]
            
            if dish_id not in sales_data:
                sales_data[dish_id] = {
                    "quantity_sold": 0,
                    "total_revenue": 0,
                    "total_ingredient_cost": 0
                }
            
            sales_data[dish_id]["quantity_sold"] += sale["quantity_sold"]
            sales_data[dish_id]["total_revenue"] += sale.get("total_revenue", 0)
            sales_data[dish_id]["total_ingredient_cost"] += sale.get("ingredient_cost", 0)
        
        # Calculate profitability metrics
        profitability_data = []
        for dish_id, dish_data in dishes.items():
            sales = sales_data.get(dish_id, {"quantity_sold": 0, "total_revenue": 0, "total_ingredient_cost": 0})
            
            # Calculate ingredient cost per dish
            ingredients = await get_dish_ingredients_data(dish_id)
            ingredient_cost_per_dish = sum(ing.get("cost_per_serving", 0) for ing in ingredients)
            
            profit_per_dish = dish_data.get("selling_price", 0) - ingredient_cost_per_dish
            profit_margin = 0
            if dish_data.get("selling_price", 0) > 0:
                profit_margin = (profit_per_dish / dish_data["selling_price"]) * 100
            
            total_profit = profit_per_dish * sales["quantity_sold"]
            
            profitability_data.append(DishProfitability(
                dish_id=dish_id,
                dish_name=dish_data.get("name", ""),
                selling_price=dish_data.get("selling_price", 0),
                ingredient_cost=ingredient_cost_per_dish,
                profit_per_dish=profit_per_dish,
                profit_margin=profit_margin,
                quantity_sold_period=sales["quantity_sold"],
                total_profit_period=total_profit,
                popularity_rank=0,  # Would be calculated based on sales ranking
                period_days=days
            ))
        
        # Sort by total profit
        profitability_data.sort(key=lambda x: x.total_profit_period, reverse=True)
        
        # Add popularity ranking
        for i, item in enumerate(profitability_data):
            item.popularity_rank = i + 1
        
        return profitability_data
        
    except Exception as e:
        logger.error(f"Error calculating profitability: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating profitability: {str(e)}")

@router.get("/{dish_id}/cost-breakdown")
async def get_dish_cost_breakdown(
    dish_id: str,
    user: dict = Depends(get_current_user)
):
    """Get detailed cost breakdown for a specific dish"""
    try:
        # Verify dish ownership
        await verify_dish_ownership(dish_id, user["uid"])
        
        db = get_firestore_client()
        
        # Get dish data
        dish_doc = db.collection("dishes").document(dish_id).get()
        dish_data = dish_doc.to_dict()
        
        # Get ingredients with detailed cost information
        ingredients = await get_dish_ingredients_data(dish_id)
        
        cost_breakdown = []
        total_cost = 0
        
        for ingredient in ingredients:
            # Get ingredient details
            ingredient_doc = db.collection("ingredients").document(ingredient["ingredient_id"]).get()
            ingredient_data = ingredient_doc.to_dict()
            
            cost_per_serving = ingredient["quantity_needed"] * ingredient_data.get("cost_per_unit", 0)
            total_cost += cost_per_serving
            
            cost_breakdown.append({
                "ingredient_id": ingredient["ingredient_id"],
                "ingredient_name": ingredient_data.get("name", ""),
                "quantity_needed": ingredient["quantity_needed"],
                "unit": ingredient["unit"],
                "cost_per_unit": ingredient_data.get("cost_per_unit", 0),
                "cost_per_serving": cost_per_serving,
                "percentage_of_total": 0  # Will be calculated after total is known
            })
        
        # Calculate percentages
        for item in cost_breakdown:
            if total_cost > 0:
                item["percentage_of_total"] = (item["cost_per_serving"] / total_cost) * 100
        
        selling_price = dish_data.get("selling_price", 0)
        profit = selling_price - total_cost
        profit_margin = (profit / selling_price * 100) if selling_price > 0 else 0
        
        return {
            "dish_id": dish_id,
            "dish_name": dish_data.get("name", ""),
            "selling_price": selling_price,
            "total_ingredient_cost": total_cost,
            "profit_per_dish": profit,
            "profit_margin": profit_margin,
            "cost_breakdown": cost_breakdown,
            "calculation_timestamp": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cost breakdown: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting cost breakdown: {str(e)}")

# ==================== HELPER FUNCTIONS ====================

async def get_dish_ingredients_data(dish_id: str) -> List[Dict]:
    """Get ingredients data for a dish"""
    db = get_firestore_client()
    
    ingredients_query = db.collection("dish_ingredients").where("dish_id", "==", dish_id)
    ingredients = []
    
    for doc in ingredients_query.stream():
        ingredient_data = doc.to_dict()
        ingredients.append(ingredient_data)
    
    return ingredients

async def verify_dish_ownership(dish_id: str, user_id: str):
    """Verify that the user owns the dish"""
    db = get_firestore_client()
    
    dish_doc = db.collection("dishes").document(dish_id).get()
    if not dish_doc.exists:
        raise HTTPException(status_code=404, detail="Dish not found")
    
    dish_data = dish_doc.to_dict()
    if dish_data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")