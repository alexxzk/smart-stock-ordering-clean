# Comprehensive Restaurant Inventory Management System
## Technical Implementation Specification

Based on your requirements for detailed ingredient tracking, recipe management, cost analysis, and automated stock deduction, here's a complete implementation plan for your Smart Stock Ordering system.

## 🎯 **Overview of Required Features**

### **Current System Status:**
✅ Basic inventory items with stock levels  
✅ Simple menu item to ingredient mapping  
✅ Basic supplier information  
✅ Sales forecasting framework  

### **Enhancements Needed:**
🔧 Detailed recipe/dish management with precise ingredient quantities  
🔧 Comprehensive ingredient database with units and costs  
🔧 Automated stock deduction based on dish sales  
🔧 Advanced stock tracking (purchases, deliveries, wastage)  
🔧 Intelligent low stock alerts and reordering  
🔧 Cost analysis and reporting dashboard  

## 📊 **Enhanced Data Models**

### **1. Ingredient Database**
```python
class Ingredient(BaseModel):
    ingredient_id: str
    name: str
    category: str  # meat, dairy, produce, dry_goods, packaging
    unit_type: str  # grams, ml, pieces, units
    cost_per_unit: float  # cost per gram/ml/piece
    current_stock: float
    min_stock_threshold: float
    max_stock_capacity: float
    supplier_id: str
    package_size: float  # how ingredients are bought (5kg bag, 1L bottle)
    package_cost: float
    shelf_life_days: Optional[int]
    storage_requirements: Optional[str]  # refrigerated, frozen, dry
    created_at: datetime
    updated_at: datetime
```

### **2. Recipe/Dish Management**
```python
class Dish(BaseModel):
    dish_id: str
    name: str
    category: str  # appetizer, main, dessert, beverage
    selling_price: float
    is_active: bool
    prep_time_minutes: int
    description: Optional[str]
    allergens: List[str]
    created_at: datetime
    updated_at: datetime

class DishIngredient(BaseModel):
    dish_id: str
    ingredient_id: str
    quantity_needed: float  # precise amount per serving
    unit: str  # grams, ml, pieces
    cost_per_serving: float  # calculated field
    is_critical: bool  # if dish can't be made without this
```

### **3. Enhanced Stock Tracking**
```python
class StockTransaction(BaseModel):
    transaction_id: str
    ingredient_id: str
    transaction_type: str  # purchase, delivery, sale, wastage, adjustment
    quantity_change: float  # positive for additions, negative for deductions
    unit_cost: Optional[float]
    total_cost: Optional[float]
    reference_id: Optional[str]  # links to purchase order, sale, etc.
    reason: Optional[str]
    timestamp: datetime
    user_id: str

class PurchaseOrder(BaseModel):
    order_id: str
    supplier_id: str
    status: str  # pending, confirmed, delivered, cancelled
    order_date: datetime
    expected_delivery: Optional[datetime]
    actual_delivery: Optional[datetime]
    total_cost: float
    items: List[PurchaseOrderItem]
    notes: Optional[str]

class PurchaseOrderItem(BaseModel):
    ingredient_id: str
    quantity_ordered: float
    unit_cost: float
    total_cost: float
    received_quantity: Optional[float]
```

### **4. Sales Integration**
```python
class DishSale(BaseModel):
    sale_id: str
    dish_id: str
    quantity_sold: int
    sale_timestamp: datetime
    pos_reference: Optional[str]  # POS system reference
    total_revenue: float
    ingredient_cost: float  # calculated total ingredient cost
    profit_margin: float  # calculated profit

class DailySalesSummary(BaseModel):
    date: date
    total_dishes_sold: int
    total_revenue: float
    total_ingredient_cost: float
    profit_margin: float
    top_selling_dishes: List[Dict[str, Any]]
    ingredient_usage: Dict[str, float]
```

## 🔧 **Enhanced API Endpoints**

### **Ingredient Management**
```python
# Enhanced ingredient CRUD with cost tracking
POST   /api/ingredients/                    # Create ingredient
GET    /api/ingredients/                    # List all ingredients
GET    /api/ingredients/{id}               # Get specific ingredient
PUT    /api/ingredients/{id}               # Update ingredient
DELETE /api/ingredients/{id}               # Delete ingredient
GET    /api/ingredients/categories         # Get ingredient categories
GET    /api/ingredients/low-stock          # Get low stock items
POST   /api/ingredients/{id}/adjust-stock  # Manual stock adjustment
GET    /api/ingredients/{id}/cost-history  # Cost history tracking
```

### **Recipe/Dish Management**
```python
POST   /api/dishes/                        # Create new dish
GET    /api/dishes/                        # List all dishes
GET    /api/dishes/{id}                    # Get dish details
PUT    /api/dishes/{id}                    # Update dish
DELETE /api/dishes/{id}                    # Delete dish
POST   /api/dishes/{id}/ingredients        # Add ingredient to dish
PUT    /api/dishes/{id}/ingredients/{ing_id} # Update ingredient quantity
DELETE /api/dishes/{id}/ingredients/{ing_id} # Remove ingredient from dish
GET    /api/dishes/{id}/cost-breakdown     # Calculate dish cost
GET    /api/dishes/profitability           # Dish profitability analysis
```

### **Sales Integration**
```python
POST   /api/sales/record-sale              # Record individual dish sale
POST   /api/sales/batch-import             # Import daily sales from POS
POST   /api/sales/manual-entry             # Manual daily sales entry
GET    /api/sales/daily-summary/{date}     # Daily sales summary
POST   /api/sales/auto-deduct-stock        # Process stock deductions
GET    /api/sales/ingredient-usage         # Ingredient usage analytics
```

### **Stock Management**
```python
GET    /api/stock/current                  # Current stock levels
POST   /api/stock/receive-delivery         # Record delivery received
POST   /api/stock/record-wastage           # Record wastage/loss
GET    /api/stock/transactions             # Stock transaction history
GET    /api/stock/low-stock-alerts         # Get low stock alerts
POST   /api/stock/manual-count             # Manual stock count/adjustment
```

### **Purchasing & Suppliers**
```python
GET    /api/suppliers/                     # List suppliers
POST   /api/suppliers/                     # Add new supplier
GET    /api/suppliers/{id}/ingredients     # Supplier's ingredient catalog
POST   /api/purchase-orders/               # Create purchase order
GET    /api/purchase-orders/               # List purchase orders
PUT    /api/purchase-orders/{id}/confirm   # Confirm order
POST   /api/purchase-orders/auto-generate  # Auto-generate orders
GET    /api/purchase-orders/pending        # Pending deliveries
```

### **Analytics & Reports**
```python
GET    /api/reports/daily-usage            # Daily ingredient usage
GET    /api/reports/weekly-summary         # Weekly inventory summary
GET    /api/reports/cost-analysis          # Dish cost analysis
GET    /api/reports/profit-margins         # Profit margin analysis
GET    /api/reports/waste-tracking         # Wastage tracking
GET    /api/reports/supplier-performance   # Supplier performance
GET    /api/reports/forecast-needs         # Forecasted inventory needs
```

## 🎯 **Core Features Implementation**

### **1. Automated Stock Deduction**
```python
async def process_dish_sale(dish_id: str, quantity: int):
    """Automatically deduct ingredients when dish is sold"""
    
    # Get dish recipe
    dish_ingredients = await get_dish_ingredients(dish_id)
    
    # Calculate total ingredient needs
    for ingredient in dish_ingredients:
        total_needed = ingredient.quantity_needed * quantity
        
        # Check if enough stock
        current_stock = await get_ingredient_stock(ingredient.ingredient_id)
        if current_stock < total_needed:
            raise InsufficientStockError(ingredient.name)
        
        # Deduct from stock
        await deduct_ingredient_stock(
            ingredient_id=ingredient.ingredient_id,
            quantity=total_needed,
            reference_type="dish_sale",
            reference_id=f"sale_{dish_id}_{timestamp}"
        )
    
    # Record the sale
    await record_dish_sale(dish_id, quantity)
```

### **2. Intelligent Reordering System**
```python
async def check_reorder_requirements():
    """Check which ingredients need reordering"""
    
    low_stock_items = await get_low_stock_ingredients()
    forecast_data = await get_sales_forecast(days=14)
    
    reorder_recommendations = []
    
    for ingredient in low_stock_items:
        # Calculate expected usage
        expected_usage = calculate_expected_usage(ingredient.id, forecast_data)
        
        # Calculate days until stockout
        days_until_stockout = ingredient.current_stock / (expected_usage / 14)
        
        # Get supplier lead time
        supplier_info = await get_supplier_info(ingredient.supplier_id)
        
        if days_until_stockout <= supplier_info.lead_time_days:
            urgency = "critical"
        elif days_until_stockout <= supplier_info.lead_time_days + 3:
            urgency = "high"
        else:
            urgency = "medium"
        
        # Calculate optimal order quantity
        optimal_quantity = calculate_optimal_order_quantity(
            ingredient, expected_usage, supplier_info
        )
        
        reorder_recommendations.append({
            "ingredient": ingredient,
            "urgency": urgency,
            "recommended_quantity": optimal_quantity,
            "estimated_cost": optimal_quantity * ingredient.cost_per_unit,
            "supplier": supplier_info
        })
    
    return reorder_recommendations
```

### **3. Cost Analysis Dashboard**
```python
async def calculate_dish_profitability():
    """Calculate profitability for all dishes"""
    
    dishes = await get_all_active_dishes()
    profitability_data = []
    
    for dish in dishes:
        # Calculate ingredient cost
        ingredients = await get_dish_ingredients(dish.id)
        total_ingredient_cost = sum(
            ing.quantity_needed * ing.cost_per_unit 
            for ing in ingredients
        )
        
        # Get sales data
        sales_data = await get_dish_sales_last_30_days(dish.id)
        
        # Calculate metrics
        profit_per_dish = dish.selling_price - total_ingredient_cost
        profit_margin = (profit_per_dish / dish.selling_price) * 100
        total_profit = profit_per_dish * sales_data.quantity_sold
        
        profitability_data.append({
            "dish_name": dish.name,
            "selling_price": dish.selling_price,
            "ingredient_cost": total_ingredient_cost,
            "profit_per_dish": profit_per_dish,
            "profit_margin": profit_margin,
            "quantity_sold_30_days": sales_data.quantity_sold,
            "total_profit_30_days": total_profit,
            "popularity_rank": sales_data.rank
        })
    
    return sorted(profitability_data, key=lambda x: x["total_profit_30_days"], reverse=True)
```

## 🔄 **Integration Points**

### **POS System Integration**
```python
# Webhook endpoint for POS systems
@router.post("/api/pos/webhook/sale")
async def handle_pos_sale(sale_data: POSSaleData):
    """Process sale from POS system"""
    
    for item in sale_data.items:
        if item.dish_id:
            await process_dish_sale(item.dish_id, item.quantity)
    
    return {"status": "processed", "timestamp": datetime.now()}

# Manual entry for non-integrated POS
@router.post("/api/sales/manual-entry")
async def manual_sales_entry(daily_sales: DailySalesEntry):
    """Manual entry of daily sales"""
    
    for dish_sale in daily_sales.dishes:
        await process_dish_sale(dish_sale.dish_id, dish_sale.quantity)
    
    return {"status": "recorded", "total_dishes": len(daily_sales.dishes)}
```

### **Supplier Integration**
```python
# Email order generation
async def generate_supplier_order_email(supplier_id: str, items: List[OrderItem]):
    """Generate formatted email for supplier orders"""
    
    supplier = await get_supplier(supplier_id)
    
    email_content = generate_order_email_template(
        supplier=supplier,
        items=items,
        delivery_date=calculate_delivery_date(),
        total_cost=sum(item.total_cost for item in items)
    )
    
    await send_email(
        to=supplier.email,
        subject=f"Purchase Order - {datetime.now().strftime('%Y-%m-%d')}",
        content=email_content,
        attachments=[generate_order_pdf(supplier, items)]
    )
```

## 📈 **Reporting Dashboard**

### **Key Metrics Display**
- **Daily Ingredient Usage**: Track which ingredients are used most
- **Cost per Dish**: Real-time calculation of dish costs
- **Profit Margins**: Track profitability by dish and overall
- **Waste Tracking**: Monitor and reduce food waste
- **Supplier Performance**: Track delivery times and quality
- **Inventory Turnover**: Optimize stock levels

### **Alert System**
- **Critical Stock Levels**: Immediate alerts for ingredients below safety stock
- **Price Changes**: Alerts when supplier prices change
- **Waste Thresholds**: Alerts when waste exceeds normal levels
- **Profit Margin Drops**: Alerts when dish profitability changes

## 🚀 **Implementation Priority**

### **Phase 1: Core Infrastructure** (Weeks 1-2)
1. Enhanced data models and database schema
2. Ingredient and dish management APIs
3. Basic stock tracking functionality

### **Phase 2: Sales Integration** (Weeks 3-4)
1. Dish sales recording and stock deduction
2. POS integration or manual entry system
3. Basic cost calculation features

### **Phase 3: Intelligence Layer** (Weeks 5-6)
1. Automated reordering system
2. Advanced analytics and reporting
3. Supplier order generation

### **Phase 4: Dashboard & Optimization** (Weeks 7-8)
1. Management dashboard with key metrics
2. Alert system implementation
3. Performance optimization and testing

## 💰 **Expected Benefits**

- **30-40% reduction** in food waste through better tracking
- **15-25% improvement** in profit margins through cost optimization
- **50-60% time savings** in inventory management tasks
- **Real-time visibility** into dish profitability and ingredient costs
- **Automated ordering** reduces human error and stockouts

This comprehensive system will transform your restaurant's inventory management from manual tracking to intelligent, automated cost optimization.