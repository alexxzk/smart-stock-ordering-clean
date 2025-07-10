from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import date, datetime
from enum import Enum

# Enums for standardized values
class IngredientCategory(str, Enum):
    MEAT = "meat"
    DAIRY = "dairy"
    PRODUCE = "produce"
    DRY_GOODS = "dry_goods"
    PACKAGING = "packaging"
    BEVERAGES = "beverages"
    CONDIMENTS = "condiments"

class UnitType(str, Enum):
    GRAMS = "grams"
    KILOGRAMS = "kilograms"
    MILLILITERS = "milliliters"
    LITERS = "liters"
    PIECES = "pieces"
    UNITS = "units"

class TransactionType(str, Enum):
    PURCHASE = "purchase"
    DELIVERY = "delivery"
    SALE = "sale"
    WASTAGE = "wastage"
    ADJUSTMENT = "adjustment"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class DishCategory(str, Enum):
    APPETIZER = "appetizer"
    MAIN = "main"
    DESSERT = "dessert"
    BEVERAGE = "beverage"
    SIDE = "side"

class StorageRequirement(str, Enum):
    REFRIGERATED = "refrigerated"
    FROZEN = "frozen"
    DRY = "dry"
    ROOM_TEMPERATURE = "room_temperature"

# Enhanced Ingredient Model
class Ingredient(BaseModel):
    ingredient_id: Optional[str] = None
    name: str = Field(..., description="Name of the ingredient")
    category: IngredientCategory = Field(..., description="Category of ingredient")
    unit_type: UnitType = Field(..., description="Unit of measurement")
    cost_per_unit: float = Field(..., gt=0, description="Cost per unit (gram/ml/piece)")
    current_stock: float = Field(0, ge=0, description="Current stock level")
    min_stock_threshold: float = Field(..., gt=0, description="Minimum stock before reorder")
    max_stock_capacity: float = Field(..., gt=0, description="Maximum storage capacity")
    supplier_id: str = Field(..., description="Primary supplier ID")
    package_size: float = Field(..., gt=0, description="Package size when purchased")
    package_cost: float = Field(..., gt=0, description="Cost per package")
    shelf_life_days: Optional[int] = Field(None, gt=0, description="Shelf life in days")
    storage_requirements: Optional[StorageRequirement] = None
    barcode: Optional[str] = None
    sku: Optional[str] = None
    allergen_info: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    @property
    def cost_per_package_unit(self) -> float:
        """Calculate cost per unit from package pricing"""
        return self.package_cost / self.package_size

    @property
    def days_of_stock_remaining(self) -> Optional[float]:
        """Calculate days of stock remaining based on usage"""
        # This would be calculated based on historical usage
        return None

class IngredientCreate(BaseModel):
    name: str
    category: IngredientCategory
    unit_type: UnitType
    cost_per_unit: float = Field(..., gt=0)
    current_stock: float = Field(0, ge=0)
    min_stock_threshold: float = Field(..., gt=0)
    max_stock_capacity: float = Field(..., gt=0)
    supplier_id: str
    package_size: float = Field(..., gt=0)
    package_cost: float = Field(..., gt=0)
    shelf_life_days: Optional[int] = None
    storage_requirements: Optional[StorageRequirement] = None
    barcode: Optional[str] = None
    sku: Optional[str] = None
    allergen_info: List[str] = Field(default_factory=list)

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[IngredientCategory] = None
    unit_type: Optional[UnitType] = None
    cost_per_unit: Optional[float] = Field(None, gt=0)
    current_stock: Optional[float] = Field(None, ge=0)
    min_stock_threshold: Optional[float] = Field(None, gt=0)
    max_stock_capacity: Optional[float] = Field(None, gt=0)
    supplier_id: Optional[str] = None
    package_size: Optional[float] = Field(None, gt=0)
    package_cost: Optional[float] = Field(None, gt=0)
    shelf_life_days: Optional[int] = None
    storage_requirements: Optional[StorageRequirement] = None
    barcode: Optional[str] = None
    sku: Optional[str] = None
    allergen_info: Optional[List[str]] = None

# Dish/Recipe Models
class Dish(BaseModel):
    dish_id: Optional[str] = None
    name: str = Field(..., description="Name of the dish")
    category: DishCategory = Field(..., description="Category of dish")
    selling_price: float = Field(..., gt=0, description="Selling price")
    is_active: bool = Field(True, description="Whether dish is currently available")
    prep_time_minutes: int = Field(..., gt=0, description="Preparation time in minutes")
    description: Optional[str] = None
    allergens: List[str] = Field(default_factory=list)
    image_url: Optional[str] = None
    recipe_instructions: Optional[str] = None
    serving_size: str = Field("1 portion", description="Standard serving size")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class DishCreate(BaseModel):
    name: str
    category: DishCategory
    selling_price: float = Field(..., gt=0)
    is_active: bool = True
    prep_time_minutes: int = Field(..., gt=0)
    description: Optional[str] = None
    allergens: List[str] = Field(default_factory=list)
    image_url: Optional[str] = None
    recipe_instructions: Optional[str] = None
    serving_size: str = "1 portion"

class DishUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[DishCategory] = None
    selling_price: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None
    prep_time_minutes: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None
    allergens: Optional[List[str]] = None
    image_url: Optional[str] = None
    recipe_instructions: Optional[str] = None
    serving_size: Optional[str] = None

class DishIngredient(BaseModel):
    dish_id: str
    ingredient_id: str
    quantity_needed: float = Field(..., gt=0, description="Quantity needed per serving")
    unit: UnitType = Field(..., description="Unit of measurement")
    cost_per_serving: Optional[float] = Field(None, description="Calculated cost per serving")
    is_critical: bool = Field(True, description="Whether dish can't be made without this")
    notes: Optional[str] = None

class DishIngredientCreate(BaseModel):
    ingredient_id: str
    quantity_needed: float = Field(..., gt=0)
    unit: UnitType
    is_critical: bool = True
    notes: Optional[str] = None

class DishIngredientUpdate(BaseModel):
    quantity_needed: Optional[float] = Field(None, gt=0)
    unit: Optional[UnitType] = None
    is_critical: Optional[bool] = None
    notes: Optional[str] = None

# Stock Tracking Models
class StockTransaction(BaseModel):
    transaction_id: Optional[str] = None
    ingredient_id: str
    transaction_type: TransactionType
    quantity_change: float = Field(..., description="Positive for additions, negative for deductions")
    unit_cost: Optional[float] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, ge=0)
    reference_id: Optional[str] = None
    reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    user_id: str
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None

class StockTransactionCreate(BaseModel):
    ingredient_id: str
    transaction_type: TransactionType
    quantity_change: float
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    reference_id: Optional[str] = None
    reason: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None

# Purchase Order Models
class PurchaseOrderItem(BaseModel):
    ingredient_id: str
    ingredient_name: Optional[str] = None  # For display purposes
    quantity_ordered: float = Field(..., gt=0)
    unit_cost: float = Field(..., gt=0)
    total_cost: float = Field(..., gt=0)
    received_quantity: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

class PurchaseOrder(BaseModel):
    order_id: Optional[str] = None
    supplier_id: str
    supplier_name: Optional[str] = None  # For display purposes
    status: OrderStatus = OrderStatus.PENDING
    order_date: datetime = Field(default_factory=datetime.now)
    expected_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    total_cost: float = Field(..., ge=0)
    items: List[PurchaseOrderItem]
    notes: Optional[str] = None
    created_by: str
    delivery_address: Optional[str] = None
    invoice_number: Optional[str] = None

class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    expected_delivery: Optional[datetime] = None
    items: List[PurchaseOrderItem]
    notes: Optional[str] = None
    delivery_address: Optional[str] = None

class PurchaseOrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    expected_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    notes: Optional[str] = None
    invoice_number: Optional[str] = None

# Sales Integration Models
class DishSale(BaseModel):
    sale_id: Optional[str] = None
    dish_id: str
    dish_name: Optional[str] = None  # For display purposes
    quantity_sold: int = Field(..., gt=0)
    sale_timestamp: datetime = Field(default_factory=datetime.now)
    pos_reference: Optional[str] = None
    total_revenue: float = Field(..., gt=0)
    ingredient_cost: Optional[float] = Field(None, description="Calculated total ingredient cost")
    profit_margin: Optional[float] = Field(None, description="Calculated profit margin")
    customer_id: Optional[str] = None
    table_number: Optional[str] = None

class DishSaleCreate(BaseModel):
    dish_id: str
    quantity_sold: int = Field(..., gt=0)
    pos_reference: Optional[str] = None
    customer_id: Optional[str] = None
    table_number: Optional[str] = None

class DailySalesSummary(BaseModel):
    date: date
    total_dishes_sold: int = Field(..., ge=0)
    total_revenue: float = Field(..., ge=0)
    total_ingredient_cost: float = Field(..., ge=0)
    profit_margin: float = Field(..., ge=0)
    top_selling_dishes: List[Dict[str, Any]] = Field(default_factory=list)
    ingredient_usage: Dict[str, float] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)

# Analytics Models
class DishProfitability(BaseModel):
    dish_id: str
    dish_name: str
    selling_price: float
    ingredient_cost: float
    profit_per_dish: float
    profit_margin: float
    quantity_sold_period: int
    total_profit_period: float
    popularity_rank: int
    period_days: int = 30

class IngredientUsageAnalytics(BaseModel):
    ingredient_id: str
    ingredient_name: str
    total_usage: float
    unit: UnitType
    usage_trend: str  # increasing, decreasing, stable
    avg_daily_usage: float
    cost_impact: float
    dishes_using: List[str]
    period_days: int = 30

class LowStockAlert(BaseModel):
    ingredient_id: str
    ingredient_name: str
    current_stock: float
    min_threshold: float
    days_until_stockout: Optional[float]
    urgency_level: str  # critical, high, medium, low
    recommended_order_quantity: float
    estimated_cost: float
    supplier_id: str
    supplier_name: Optional[str] = None

# Supplier Models (Enhanced)
class Supplier(BaseModel):
    supplier_id: Optional[str] = None
    name: str = Field(..., description="Supplier name")
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: int = Field(1, gt=0, description="Lead time in days")
    minimum_order_value: Optional[float] = Field(None, ge=0)
    delivery_fee: Optional[float] = Field(None, ge=0)
    rating: Optional[float] = Field(None, ge=0, le=5)
    is_active: bool = Field(True)
    specialty_categories: List[IngredientCategory] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: int = 1
    minimum_order_value: Optional[float] = None
    delivery_fee: Optional[float] = None
    specialty_categories: List[IngredientCategory] = Field(default_factory=list)

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = Field(None, gt=0)
    minimum_order_value: Optional[float] = Field(None, ge=0)
    delivery_fee: Optional[float] = Field(None, ge=0)
    rating: Optional[float] = Field(None, ge=0, le=5)
    is_active: Optional[bool] = None
    specialty_categories: Optional[List[IngredientCategory]] = None

# Request/Response Models for APIs
class StockAdjustment(BaseModel):
    ingredient_id: str
    new_stock_level: float = Field(..., ge=0)
    reason: str
    adjustment_type: str = Field("manual", description="manual, delivery, wastage")

class ReorderRecommendation(BaseModel):
    ingredient: Ingredient
    urgency: str
    recommended_quantity: float
    estimated_cost: float
    supplier: Supplier
    days_until_stockout: Optional[float]

class BatchSalesEntry(BaseModel):
    date: date
    sales: List[DishSaleCreate]
    notes: Optional[str] = None

class POSSaleData(BaseModel):
    transaction_id: str
    timestamp: datetime
    items: List[DishSaleCreate]
    total_amount: float
    payment_method: Optional[str] = None

# Response Models
class IngredientResponse(Ingredient):
    supplier_name: Optional[str] = None
    days_until_stockout: Optional[float] = None
    
class DishResponse(Dish):
    ingredients: List[DishIngredient] = Field(default_factory=list)
    total_ingredient_cost: Optional[float] = None
    profit_margin: Optional[float] = None

class PurchaseOrderResponse(PurchaseOrder):
    supplier_name: Optional[str] = None
    
class DishSaleResponse(DishSale):
    dish_name: Optional[str] = None