from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(None, max_length=500, description="Category description")
    parent_id: Optional[str] = Field(None, description="Parent category ID for nesting")
    color: Optional[str] = Field(None, description="Category color code (hex)")
    icon: Optional[str] = Field(None, description="Category icon name")
    sort_order: int = Field(0, description="Sort order within parent category")
    is_active: bool = Field(True, description="Whether category is active")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class Category(CategoryBase):
    id: str = Field(..., description="Category unique identifier")
    created_at: datetime = Field(..., description="Category creation timestamp")
    updated_at: datetime = Field(..., description="Category last update timestamp")
    created_by: str = Field(..., description="User who created the category")
    
    # Computed fields
    level: int = Field(0, description="Nesting level (0 = root category)")
    path: str = Field("", description="Full category path (e.g., 'Food/Beverages/Coffee')")
    item_count: int = Field(0, description="Number of items in this category")
    subcategory_count: int = Field(0, description="Number of subcategories")
    
    class Config:
        from_attributes = True

class CategoryWithChildren(Category):
    children: List['CategoryWithChildren'] = Field(default=[], description="Subcategories")
    items: Optional[List[Dict[str, Any]]] = Field(default=[], description="Items in this category")

class CategoryTree(BaseModel):
    categories: List[CategoryWithChildren] = Field(..., description="Root categories with full tree")
    total_categories: int = Field(..., description="Total number of categories")
    max_depth: int = Field(..., description="Maximum nesting depth")

class CategoryStats(BaseModel):
    category_id: str
    category_name: str
    item_count: int
    total_value: float
    low_stock_items: int
    subcategories: List['CategoryStats'] = []

class CategoryPath(BaseModel):
    id: str
    name: str
    level: int

class CategoryBreadcrumb(BaseModel):
    path: List[CategoryPath] = Field(..., description="Breadcrumb path from root to current category")
    current: Category = Field(..., description="Current category details")

# Update the forward reference
CategoryWithChildren.model_rebuild()
CategoryStats.model_rebuild()