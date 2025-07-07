from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from ..firebase_init import get_firestore_client
from ..models.category import (
    Category, CategoryCreate, CategoryUpdate, CategoryWithChildren, 
    CategoryTree, CategoryStats, CategoryBreadcrumb, CategoryPath
)

class CategoryService:
    def __init__(self):
        self.db = get_firestore_client()
        self.collection_name = "categories"
    
    async def create_category(self, category_data: CategoryCreate, user_id: str) -> Category:
        """Create a new category"""
        try:
            # Generate unique ID
            category_id = str(uuid.uuid4())
            
            # Validate parent category exists if specified
            if category_data.parent_id:
                parent = await self.get_category_by_id(category_data.parent_id)
                if not parent:
                    raise ValueError(f"Parent category {category_data.parent_id} not found")
            
            # Calculate level and path
            level, path = await self._calculate_level_and_path(category_data.parent_id, category_data.name)
            
            # Create category document
            now = datetime.utcnow()
            category_doc = {
                "id": category_id,
                "name": category_data.name,
                "description": category_data.description,
                "parent_id": category_data.parent_id,
                "color": category_data.color,
                "icon": category_data.icon,
                "sort_order": category_data.sort_order,
                "is_active": category_data.is_active,
                "level": level,
                "path": path,
                "item_count": 0,
                "subcategory_count": 0,
                "created_at": now,
                "updated_at": now,
                "created_by": user_id
            }
            
            # Save to Firestore
            if self.db:
                doc_ref = self.db.collection(self.collection_name).document(category_id)
                doc_ref.set(category_doc)
                
                # Update parent's subcategory count
                if category_data.parent_id:
                    await self._update_subcategory_count(category_data.parent_id)
            
            return Category(**category_doc)
            
        except Exception as e:
            raise Exception(f"Error creating category: {str(e)}")
    
    async def get_category_by_id(self, category_id: str) -> Optional[Category]:
        """Get category by ID"""
        try:
            if not self.db:
                return None
            
            doc_ref = self.db.collection(self.collection_name).document(category_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                return Category(**data)
            return None
            
        except Exception as e:
            print(f"Error getting category {category_id}: {str(e)}")
            return None
    
    async def get_all_categories(self, include_inactive: bool = False) -> List[Category]:
        """Get all categories"""
        try:
            if not self.db:
                return []
            
            query = self.db.collection(self.collection_name)
            
            if not include_inactive:
                query = query.where("is_active", "==", True)
            
            query = query.order_by("level").order_by("sort_order").order_by("name")
            docs = query.stream()
            
            categories = []
            for doc in docs:
                data = doc.to_dict()
                categories.append(Category(**data))
            
            return categories
            
        except Exception as e:
            print(f"Error getting categories: {str(e)}")
            return []
    
    async def get_root_categories(self, include_inactive: bool = False) -> List[Category]:
        """Get root categories (no parent)"""
        try:
            if not self.db:
                return []
            
            query = self.db.collection(self.collection_name).where("parent_id", "==", None)
            
            if not include_inactive:
                query = query.where("is_active", "==", True)
            
            query = query.order_by("sort_order").order_by("name")
            docs = query.stream()
            
            categories = []
            for doc in docs:
                data = doc.to_dict()
                categories.append(Category(**data))
            
            return categories
            
        except Exception as e:
            print(f"Error getting root categories: {str(e)}")
            return []
    
    async def get_subcategories(self, parent_id: str, include_inactive: bool = False) -> List[Category]:
        """Get subcategories of a parent category"""
        try:
            if not self.db:
                return []
            
            query = self.db.collection(self.collection_name).where("parent_id", "==", parent_id)
            
            if not include_inactive:
                query = query.where("is_active", "==", True)
            
            query = query.order_by("sort_order").order_by("name")
            docs = query.stream()
            
            categories = []
            for doc in docs:
                data = doc.to_dict()
                categories.append(Category(**data))
            
            return categories
            
        except Exception as e:
            print(f"Error getting subcategories for {parent_id}: {str(e)}")
            return []
    
    async def get_category_tree(self, include_inactive: bool = False) -> CategoryTree:
        """Get complete category tree structure"""
        try:
            # Get all categories
            all_categories = await self.get_all_categories(include_inactive)
            
            # Build category lookup
            category_lookup = {cat.id: cat for cat in all_categories}
            
            # Build tree structure
            root_categories = []
            max_depth = 0
            
            for category in all_categories:
                if category.parent_id is None:
                    # Root category
                    category_with_children = await self._build_category_tree(category, category_lookup)
                    root_categories.append(category_with_children)
                    max_depth = max(max_depth, self._calculate_tree_depth(category_with_children))
            
            return CategoryTree(
                categories=root_categories,
                total_categories=len(all_categories),
                max_depth=max_depth
            )
            
        except Exception as e:
            print(f"Error building category tree: {str(e)}")
            return CategoryTree(categories=[], total_categories=0, max_depth=0)
    
    async def update_category(self, category_id: str, update_data: CategoryUpdate, user_id: str) -> Optional[Category]:
        """Update a category"""
        try:
            if not self.db:
                return None
            
            # Get existing category
            existing = await self.get_category_by_id(category_id)
            if not existing:
                raise ValueError(f"Category {category_id} not found")
            
            # Prepare update data
            update_dict = {}
            for field, value in update_data.dict(exclude_unset=True).items():
                if value is not None:
                    update_dict[field] = value
            
            # Handle parent change
            if "parent_id" in update_dict and update_dict["parent_id"] != existing.parent_id:
                # Validate new parent
                if update_dict["parent_id"]:
                    new_parent = await self.get_category_by_id(update_dict["parent_id"])
                    if not new_parent:
                        raise ValueError(f"Parent category {update_dict['parent_id']} not found")
                    
                    # Check for circular reference
                    if await self._would_create_circular_reference(category_id, update_dict["parent_id"]):
                        raise ValueError("Cannot move category: would create circular reference")
                
                # Recalculate level and path
                new_name = update_dict.get("name", existing.name)
                level, path = await self._calculate_level_and_path(update_dict["parent_id"], new_name)
                update_dict["level"] = level
                update_dict["path"] = path
                
                # Update old and new parent subcategory counts
                if existing.parent_id:
                    await self._update_subcategory_count(existing.parent_id)
                if update_dict["parent_id"]:
                    await self._update_subcategory_count(update_dict["parent_id"])
            
            # Handle name change
            elif "name" in update_dict and update_dict["name"] != existing.name:
                level, path = await self._calculate_level_and_path(existing.parent_id, update_dict["name"])
                update_dict["path"] = path
            
            update_dict["updated_at"] = datetime.utcnow()
            
            # Update in Firestore
            doc_ref = self.db.collection(self.collection_name).document(category_id)
            doc_ref.update(update_dict)
            
            # Get updated category
            return await self.get_category_by_id(category_id)
            
        except Exception as e:
            raise Exception(f"Error updating category: {str(e)}")
    
    async def delete_category(self, category_id: str, move_items_to: Optional[str] = None) -> bool:
        """Delete a category and handle its items and subcategories"""
        try:
            if not self.db:
                return False
            
            category = await self.get_category_by_id(category_id)
            if not category:
                raise ValueError(f"Category {category_id} not found")
            
            # Check for subcategories
            subcategories = await self.get_subcategories(category_id)
            if subcategories:
                raise ValueError(f"Cannot delete category with {len(subcategories)} subcategories. Move or delete them first.")
            
            # Handle items in this category
            if category.item_count > 0:
                if move_items_to:
                    # Move items to specified category
                    await self._move_category_items(category_id, move_items_to)
                else:
                    # Move items to parent category or uncategorized
                    target_category = category.parent_id if category.parent_id else None
                    await self._move_category_items(category_id, target_category)
            
            # Delete the category
            doc_ref = self.db.collection(self.collection_name).document(category_id)
            doc_ref.delete()
            
            # Update parent's subcategory count
            if category.parent_id:
                await self._update_subcategory_count(category.parent_id)
            
            return True
            
        except Exception as e:
            raise Exception(f"Error deleting category: {str(e)}")
    
    async def get_category_breadcrumb(self, category_id: str) -> CategoryBreadcrumb:
        """Get breadcrumb path for a category"""
        try:
            category = await self.get_category_by_id(category_id)
            if not category:
                raise ValueError(f"Category {category_id} not found")
            
            path = []
            current = category
            
            # Build path from current to root
            while current:
                path.insert(0, CategoryPath(
                    id=current.id,
                    name=current.name,
                    level=current.level
                ))
                
                if current.parent_id:
                    current = await self.get_category_by_id(current.parent_id)
                else:
                    break
            
            return CategoryBreadcrumb(path=path, current=category)
            
        except Exception as e:
            raise Exception(f"Error building breadcrumb: {str(e)}")
    
    async def get_category_stats(self, category_id: Optional[str] = None) -> List[CategoryStats]:
        """Get statistics for categories"""
        try:
            # This would typically query the items collection to get counts and values
            # For now, return mock data structure
            stats = []
            
            if category_id:
                # Get stats for specific category
                category = await self.get_category_by_id(category_id)
                if category:
                    stats.append(CategoryStats(
                        category_id=category.id,
                        category_name=category.name,
                        item_count=category.item_count,
                        total_value=0.0,  # Would calculate from items
                        low_stock_items=0,  # Would calculate from items
                        subcategories=[]
                    ))
            else:
                # Get stats for all root categories
                root_categories = await self.get_root_categories()
                for category in root_categories:
                    stats.append(CategoryStats(
                        category_id=category.id,
                        category_name=category.name,
                        item_count=category.item_count,
                        total_value=0.0,
                        low_stock_items=0,
                        subcategories=[]
                    ))
            
            return stats
            
        except Exception as e:
            print(f"Error getting category stats: {str(e)}")
            return []
    
    # Private helper methods
    
    async def _calculate_level_and_path(self, parent_id: Optional[str], name: str) -> tuple[int, str]:
        """Calculate the level and path for a category"""
        if not parent_id:
            return 0, name
        
        parent = await self.get_category_by_id(parent_id)
        if not parent:
            return 0, name
        
        return parent.level + 1, f"{parent.path}/{name}"
    
    async def _update_subcategory_count(self, category_id: str):
        """Update the subcategory count for a category"""
        try:
            if not self.db:
                return
            
            subcategories = await self.get_subcategories(category_id)
            count = len(subcategories)
            
            doc_ref = self.db.collection(self.collection_name).document(category_id)
            doc_ref.update({"subcategory_count": count, "updated_at": datetime.utcnow()})
            
        except Exception as e:
            print(f"Error updating subcategory count: {str(e)}")
    
    async def _would_create_circular_reference(self, category_id: str, new_parent_id: str) -> bool:
        """Check if moving a category would create a circular reference"""
        current_id = new_parent_id
        
        while current_id:
            if current_id == category_id:
                return True
            
            category = await self.get_category_by_id(current_id)
            if not category:
                break
            
            current_id = category.parent_id
        
        return False
    
    async def _build_category_tree(self, category: Category, category_lookup: Dict[str, Category]) -> CategoryWithChildren:
        """Recursively build category tree with children"""
        children = []
        
        # Find direct children
        for cat_id, cat in category_lookup.items():
            if cat.parent_id == category.id:
                child_with_children = await self._build_category_tree(cat, category_lookup)
                children.append(child_with_children)
        
        # Sort children by sort_order, then name
        children.sort(key=lambda x: (x.sort_order, x.name))
        
        return CategoryWithChildren(
            **category.dict(),
            children=children,
            items=[]  # Items would be loaded separately if needed
        )
    
    def _calculate_tree_depth(self, category: CategoryWithChildren) -> int:
        """Calculate the maximum depth of a category tree"""
        if not category.children:
            return category.level
        
        max_child_depth = max(self._calculate_tree_depth(child) for child in category.children)
        return max_child_depth
    
    async def _move_category_items(self, from_category_id: str, to_category_id: Optional[str]):
        """Move all items from one category to another"""
        try:
            if not self.db:
                return
            
            # This would update all items in the inventory collection
            # Update items where category_id == from_category_id to category_id = to_category_id
            items_ref = self.db.collection("inventory").where("category_id", "==", from_category_id)
            items = items_ref.stream()
            
            batch = self.db.batch()
            for item in items:
                item_ref = self.db.collection("inventory").document(item.id)
                batch.update(item_ref, {
                    "category_id": to_category_id,
                    "updated_at": datetime.utcnow()
                })
            
            batch.commit()
            
            # Update item counts
            await self._update_item_count(from_category_id)
            if to_category_id:
                await self._update_item_count(to_category_id)
            
        except Exception as e:
            print(f"Error moving category items: {str(e)}")
    
    async def _update_item_count(self, category_id: str):
        """Update the item count for a category"""
        try:
            if not self.db:
                return
            
            # Count items in this category
            items_ref = self.db.collection("inventory").where("category_id", "==", category_id)
            items = list(items_ref.stream())
            count = len(items)
            
            doc_ref = self.db.collection(self.collection_name).document(category_id)
            doc_ref.update({"item_count": count, "updated_at": datetime.utcnow()})
            
        except Exception as e:
            print(f"Error updating item count: {str(e)}")

# Global service instance
category_service = CategoryService()