from fastapi import APIRouter, HTTPException, Query, Path
from typing import List, Optional
from ..models.category import (
    Category, CategoryCreate, CategoryUpdate, CategoryWithChildren, 
    CategoryTree, CategoryStats, CategoryBreadcrumb
)
from ..services.category_service import category_service

router = APIRouter()

# Default user ID for operations (since auth is handled at router level)
DEFAULT_USER_ID = "system-user"

@router.get("/categories", response_model=List[Category])
async def get_all_categories(
    include_inactive: bool = Query(False, description="Include inactive categories")
):
    """Get all categories"""
    try:
        categories = await category_service.get_all_categories(include_inactive)
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/tree", response_model=CategoryTree)
async def get_category_tree(
    include_inactive: bool = Query(False, description="Include inactive categories")
):
    """Get complete category tree structure"""
    try:
        tree = await category_service.get_category_tree(include_inactive)
        return tree
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/root", response_model=List[Category])
async def get_root_categories(
    include_inactive: bool = Query(False, description="Include inactive categories")
):
    """Get root categories (no parent)"""
    try:
        categories = await category_service.get_root_categories(include_inactive)
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{category_id}", response_model=Category)
async def get_category(
    category_id: str = Path(..., description="Category ID")
):
    """Get a specific category by ID"""
    try:
        category = await category_service.get_category_by_id(category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return category
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{category_id}/subcategories", response_model=List[Category])
async def get_subcategories(
    category_id: str = Path(..., description="Parent category ID"),
    include_inactive: bool = Query(False, description="Include inactive categories")
):
    """Get subcategories of a parent category"""
    try:
        subcategories = await category_service.get_subcategories(category_id, include_inactive)
        return subcategories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{category_id}/breadcrumb", response_model=CategoryBreadcrumb)
async def get_category_breadcrumb(
    category_id: str = Path(..., description="Category ID")
):
    """Get breadcrumb path for a category"""
    try:
        breadcrumb = await category_service.get_category_breadcrumb(category_id)
        return breadcrumb
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/stats", response_model=List[CategoryStats])
async def get_category_stats(
    category_id: Optional[str] = Query(None, description="Specific category ID for stats")
):
    """Get statistics for categories"""
    try:
        stats = await category_service.get_category_stats(category_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories", response_model=Category, status_code=201)
async def create_category(category_data: CategoryCreate):
    """Create a new category"""
    try:
        category = await category_service.create_category(category_data, DEFAULT_USER_ID)
        return category
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/categories/{category_id}", response_model=Category)
async def update_category(
    update_data: CategoryUpdate,
    category_id: str = Path(..., description="Category ID")
):
    """Update a category"""
    try:
        category = await category_service.update_category(category_id, update_data, DEFAULT_USER_ID)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return category
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(
    category_id: str = Path(..., description="Category ID"),
    move_items_to: Optional[str] = Query(None, description="Category ID to move items to")
):
    """Delete a category"""
    try:
        success = await category_service.delete_category(category_id, move_items_to)
        if not success:
            raise HTTPException(status_code=404, detail="Category not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories/bulk", response_model=List[Category])
async def create_categories_bulk(categories_data: List[CategoryCreate]):
    """Create multiple categories at once"""
    try:
        created_categories = []
        for category_data in categories_data:
            category = await category_service.create_category(category_data, DEFAULT_USER_ID)
            created_categories.append(category)
        return created_categories
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories/sample-data", response_model=List[Category])
async def create_sample_categories():
    """Create sample categories for testing"""
    try:
        sample_categories = [
            # Food categories
            CategoryCreate(name="Food & Beverages", description="All food and beverage items", icon="🍽️", color="#FF6B6B"),
            CategoryCreate(name="Fruits & Vegetables", description="Fresh produce", icon="🥕", color="#4ECDC4"),
            CategoryCreate(name="Dairy & Eggs", description="Milk, cheese, eggs", icon="🥛", color="#45B7D1"),
            CategoryCreate(name="Meat & Seafood", description="Fresh meat and seafood", icon="🥩", color="#F9CA24"),
            CategoryCreate(name="Beverages", description="Drinks and beverages", icon="🥤", color="#6C5CE7"),
            CategoryCreate(name="Snacks & Sweets", description="Snacks and confectionery", icon="🍿", color="#FD79A8"),
            CategoryCreate(name="Bakery", description="Bread, pastries, baked goods", icon="🥖", color="#FDCB6E"),
            
            # Non-food categories
            CategoryCreate(name="Cleaning Supplies", description="Cleaning and maintenance products", icon="🧽", color="#00B894"),
            CategoryCreate(name="Office Supplies", description="Office equipment and supplies", icon="📋", color="#0984E3"),
            CategoryCreate(name="Kitchen Equipment", description="Kitchen tools and equipment", icon="🍳", color="#E17055"),
        ]
        
        created_categories = []
        for category_data in sample_categories:
            category = await category_service.create_category(category_data, DEFAULT_USER_ID)
            created_categories.append(category)
        
        # Create some subcategories
        if len(created_categories) >= 2:
            # Find Food & Beverages category
            food_category = next((c for c in created_categories if c.name == "Food & Beverages"), None)
            beverages_category = next((c for c in created_categories if c.name == "Beverages"), None)
            
            if food_category:
                # Create subcategories under Food & Beverages
                subcategories = [
                    CategoryCreate(name="Organic", description="Organic food items", parent_id=food_category.id, icon="🌿", color="#00B894"),
                    CategoryCreate(name="Frozen Foods", description="Frozen food items", parent_id=food_category.id, icon="❄️", color="#74B9FF"),
                    CategoryCreate(name="Canned Goods", description="Canned and preserved foods", parent_id=food_category.id, icon="🥫", color="#FD79A8"),
                ]
                
                for sub_data in subcategories:
                    sub_category = await category_service.create_category(sub_data, DEFAULT_USER_ID)
                    created_categories.append(sub_category)
            
            if beverages_category:
                # Create subcategories under Beverages
                drink_subcategories = [
                    CategoryCreate(name="Coffee", description="Coffee and coffee products", parent_id=beverages_category.id, icon="☕", color="#6C5CE7"),
                    CategoryCreate(name="Tea", description="Tea and tea products", parent_id=beverages_category.id, icon="🍵", color="#00B894"),
                    CategoryCreate(name="Soft Drinks", description="Carbonated and soft drinks", parent_id=beverages_category.id, icon="🥤", color="#FF6B6B"),
                    CategoryCreate(name="Juices", description="Fruit and vegetable juices", parent_id=beverages_category.id, icon="🧃", color="#FDCB6E"),
                ]
                
                for sub_data in drink_subcategories:
                    sub_category = await category_service.create_category(sub_data, DEFAULT_USER_ID)
                    created_categories.append(sub_category)
        
        return created_categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{category_id}/validate-parent")
async def validate_parent_category(
    category_id: str = Path(..., description="Category ID"),
    parent_id: str = Query(..., description="Proposed parent category ID")
):
    """Validate if a category can be moved to a new parent"""
    try:
        # Check if parent exists
        parent = await category_service.get_category_by_id(parent_id)
        if not parent:
            return {"valid": False, "error": "Parent category not found"}
        
        # Check for circular reference
        would_create_circular = await category_service._would_create_circular_reference(category_id, parent_id)
        if would_create_circular:
            return {"valid": False, "error": "Would create circular reference"}
        
        return {"valid": True, "parent_name": parent.name, "parent_path": parent.path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{category_id}/children-count")
async def get_category_children_count(
    category_id: str = Path(..., description="Category ID"),
    recursive: bool = Query(False, description="Count recursively (all descendants)")
):
    """Get the count of children for a category"""
    try:
        if recursive:
            # Count all descendants
            tree = await category_service.get_category_tree()
            # Find the category in the tree and count all descendants
            total_descendants = 0
            # This would require a recursive search through the tree
            # For now, return direct children count
            subcategories = await category_service.get_subcategories(category_id)
            total_descendants = len(subcategories)
        else:
            # Count direct children only
            subcategories = await category_service.get_subcategories(category_id)
            total_descendants = len(subcategories)
        
        return {
            "category_id": category_id,
            "children_count": total_descendants,
            "recursive": recursive
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))