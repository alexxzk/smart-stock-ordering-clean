# Restaurant Menu Dataset Documentation

## Overview

This comprehensive restaurant menu dataset provides structured data for restaurant inventory management systems. The dataset includes detailed recipe information, ingredient costs, nutritional data, and profit analysis to help restaurants optimize their menu offerings and inventory management.

## Files Included

### 1. `restaurant_menu_dataset.json`
- **Format**: JSON
- **Size**: Comprehensive menu data with 11 detailed recipes
- **Features**: Complete recipe information including ingredients, instructions, nutritional data, and cost analysis
- **Use Case**: Primary data source for restaurant management systems

### 2. `restaurant_menu_dataset.csv`
- **Format**: CSV
- **Size**: Essential recipe data in tabular format
- **Features**: Streamlined recipe information optimized for spreadsheet applications
- **Use Case**: Quick analysis, reporting, and data imports

### 3. `menu_data_processor.py`
- **Format**: Python utility class
- **Features**: Comprehensive data processing, filtering, and analysis capabilities
- **Use Case**: Backend integration and data manipulation

### 4. `RESTAURANT_MENU_README.md`
- **Format**: Markdown documentation
- **Features**: Complete usage guide and integration instructions
- **Use Case**: Developer reference and implementation guide

## Dataset Structure

### Recipe Categories
- **Appetizers** 🥗 - Starters and small plates
- **Salads** 🥬 - Fresh garden salads and healthy options
- **Soups** 🍲 - Hot and cold soups
- **Main Courses** 🍽️ - Hearty main dishes and entrees
- **Pasta & Italian** 🍝 - Traditional and modern pasta dishes
- **Seafood** 🐟 - Fresh fish and seafood specialties
- **Desserts** 🍰 - Sweet treats and desserts
- **Beverages** 🥤 - Hot and cold drinks

### Key Data Fields

#### Basic Information
- `recipe_id`: Unique identifier for each recipe
- `recipe_name`: Display name of the dish
- `category`: Recipe category classification
- `description`: Detailed description of the dish
- `prep_time_minutes`: Preparation time in minutes
- `cook_time_minutes`: Cooking time in minutes
- `difficulty`: Complexity level (easy, medium, hard)

#### Dietary Information
- `is_vegetarian`: Boolean flag for vegetarian dishes
- `is_vegan`: Boolean flag for vegan dishes
- `is_gluten_free`: Boolean flag for gluten-free dishes
- `allergens`: List of common allergens present

#### Financial Data
- `price`: Menu selling price
- `cost_to_make`: Total ingredient cost
- `profit_margin`: Profit margin percentage
- `profit_amount`: Absolute profit per dish

#### Nutritional Information
- `calories`: Total calories per serving
- `protein_g`: Protein content in grams
- `carbs_g`: Carbohydrate content in grams
- `fat_g`: Fat content in grams
- `fiber_g`: Fiber content in grams

#### Additional Data
- `tags`: Classification tags for filtering
- `ingredients`: Detailed ingredient list with costs
- `instructions`: Step-by-step cooking instructions

## Integration with Restaurant Inventory App

### Quick Start

1. **Copy the data files** to your `sample_data` directory:
   ```bash
   cp restaurant_menu_dataset.json sample_data/
   cp restaurant_menu_dataset.csv sample_data/
   cp menu_data_processor.py sample_data/
   ```

2. **Install required dependencies**:
   ```bash
   pip install pandas  # Optional, only needed for CSV processing
   ```

3. **Basic usage example**:
   ```python
   from sample_data.menu_data_processor import MenuDataProcessor
   
   # Load the menu data
   processor = MenuDataProcessor('sample_data/restaurant_menu_dataset.json')
   
   # Get all recipes
   recipes = processor.recipes
   print(f"Loaded {len(recipes)} recipes")
   
   # Filter vegetarian options
   vegetarian_recipes = processor.filter_recipes(dietary_restrictions=['vegetarian'])
   print(f"Vegetarian options: {len(vegetarian_recipes)}")
   ```

### Advanced Integration

#### 1. Recipe Management Component

```typescript
interface Recipe {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  costToMake: number;
  profitMargin: number;
  ingredients: Ingredient[];
  dietaryInfo: {
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    allergens: string[];
  };
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}
```

#### 2. Menu Analytics Dashboard

```python
# Generate comprehensive analytics
analytics = processor.calculate_menu_analytics()
print(f"Average profit margin: {analytics.average_profit_margin:.1f}%")
print(f"Highest profit recipe: {analytics.highest_profit_recipe['name']}")

# Cost analysis
cost_analysis = processor.get_cost_analysis()
print(f"Potential daily revenue: ${cost_analysis['profit_analysis']['potential_revenue']:.2f}")
```

#### 3. Inventory Optimization

```python
# Find high-margin items to promote
high_margin_recipes = processor.filter_recipes(min_price=15.0)
high_margin_recipes.sort(key=lambda x: x.profit_margin, reverse=True)

# Identify cost optimization opportunities
low_margin_recipes = [r for r in processor.recipes if r.profit_margin < 50.0]
```

### Backend Integration

#### Flask API Example

```python
from flask import Flask, jsonify
from sample_data.menu_data_processor import MenuDataProcessor

app = Flask(__name__)
processor = MenuDataProcessor('sample_data/restaurant_menu_dataset.json')

@app.route('/api/menu/recipes')
def get_recipes():
    recipes = [asdict(recipe) for recipe in processor.recipes]
    return jsonify(recipes)

@app.route('/api/menu/analytics')
def get_analytics():
    analytics = processor.calculate_menu_analytics()
    return jsonify(asdict(analytics))

@app.route('/api/menu/filter/<category>')
def filter_by_category(category):
    filtered = processor.filter_recipes(category=category)
    return jsonify([asdict(recipe) for recipe in filtered])
```

#### Database Integration

```python
# Convert to database format
def convert_to_db_format(processor):
    recipes = []
    for recipe in processor.recipes:
        recipe_data = {
            'id': recipe.recipe_id,
            'name': recipe.recipe_name,
            'category_id': recipe.category,
            'description': recipe.description,
            'selling_price': recipe.price,
            'food_cost': recipe.cost_to_make,
            'profit_margin': recipe.profit_margin,
            'prep_time': recipe.prep_time_minutes,
            'cook_time': recipe.cook_time_minutes,
            'difficulty': recipe.difficulty,
            'is_vegetarian': recipe.is_vegetarian,
            'is_vegan': recipe.is_vegan,
            'is_gluten_free': recipe.is_gluten_free,
            'allergens': json.dumps(recipe.allergens),
            'tags': json.dumps(recipe.tags),
            'calories': recipe.calories,
            'protein_g': recipe.protein_g,
            'carbs_g': recipe.carbs_g,
            'fat_g': recipe.fat_g,
            'fiber_g': recipe.fiber_g,
            'ingredients': json.dumps(recipe.ingredients),
            'instructions': json.dumps(recipe.instructions),
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        recipes.append(recipe_data)
    return recipes
```

## Data Analysis Features

### Filtering Options

```python
# Filter by multiple criteria
filtered_recipes = processor.filter_recipes(
    category='main-courses',
    dietary_restrictions=['vegetarian'],
    max_price=20.00,
    max_prep_time=30,
    difficulty='easy'
)

# Filter by tags
comfort_food = processor.filter_recipes(tags=['comfort-food'])
healthy_options = processor.filter_recipes(tags=['healthy'])
```

### Cost Analysis

```python
# Detailed cost breakdown
cost_analysis = processor.get_cost_analysis()

# Price optimization
avg_price = cost_analysis['price_analysis']['average_price']
avg_cost = cost_analysis['cost_analysis']['average_cost']
target_margin = 60.0

optimal_price = avg_cost * (1 + target_margin / 100)
```

### Report Generation

```python
# Generate comprehensive report
report = processor.generate_report('menu_analysis_report.txt')
print(report)

# Export filtered data
vegetarian_recipes = processor.filter_recipes(dietary_restrictions=['vegetarian'])
processor.export_to_csv('vegetarian_menu.csv', vegetarian_recipes)
```

## Performance Optimization

### Caching Strategy

```python
from functools import lru_cache

class CachedMenuProcessor(MenuDataProcessor):
    @lru_cache(maxsize=128)
    def get_cached_analytics(self):
        return self.calculate_menu_analytics()
    
    @lru_cache(maxsize=256)
    def get_cached_filter(self, category, dietary_restrictions=None):
        return self.filter_recipes(category=category, 
                                 dietary_restrictions=dietary_restrictions)
```

### Database Optimization

```sql
-- Recommended indexes for recipe table
CREATE INDEX idx_recipe_category ON recipes(category_id);
CREATE INDEX idx_recipe_dietary ON recipes(is_vegetarian, is_vegan, is_gluten_free);
CREATE INDEX idx_recipe_profit ON recipes(profit_margin);
CREATE INDEX idx_recipe_price ON recipes(selling_price);
```

## AI Integration Opportunities

### Demand Forecasting

```python
# Integrate with AI service for demand prediction
def get_demand_forecast(recipe_id, historical_sales):
    # Use the recipe data as features for ML model
    recipe = processor.get_recipe_by_id(recipe_id)
    features = {
        'price': recipe.price,
        'prep_time': recipe.prep_time_minutes,
        'is_vegetarian': recipe.is_vegetarian,
        'profit_margin': recipe.profit_margin,
        'calories': recipe.calories
    }
    # Send to AI service for prediction
    return ai_service.predict_demand(features, historical_sales)
```

### Menu Optimization

```python
# AI-powered menu optimization
def optimize_menu_mix(processor, sales_data):
    recipes = processor.recipes
    optimization_data = []
    
    for recipe in recipes:
        recipe_data = {
            'id': recipe.recipe_id,
            'profit_margin': recipe.profit_margin,
            'preparation_time': recipe.prep_time_minutes,
            'popularity_score': sales_data.get(recipe.recipe_id, 0),
            'dietary_appeal': sum([
                recipe.is_vegetarian,
                recipe.is_vegan,
                recipe.is_gluten_free
            ])
        }
        optimization_data.append(recipe_data)
    
    # Send to AI service for optimization
    return ai_service.optimize_menu_mix(optimization_data)
```

## Sample Data Statistics

- **Total Recipes**: 11 complete recipes
- **Categories**: 8 distinct categories
- **Average Profit Margin**: 58.7%
- **Price Range**: $4.50 - $22.00
- **Dietary Options**: 
  - Vegetarian: 5 recipes
  - Vegan: 1 recipe
  - Gluten-Free: 3 recipes

## Best Practices

### 1. Data Validation
- Always validate recipe data before processing
- Check for required fields and data types
- Implement error handling for missing data

### 2. Cost Management
- Regularly update ingredient costs
- Monitor profit margins for menu optimization
- Track food waste and adjust portions

### 3. Performance
- Cache frequently accessed data
- Use appropriate data structures for filtering
- Implement pagination for large datasets

### 4. Security
- Sanitize user inputs for filtering
- Implement proper authentication for API endpoints
- Encrypt sensitive cost data

## Troubleshooting

### Common Issues

1. **Import Error**: 
   ```
   ModuleNotFoundError: No module named 'pandas'
   ```
   **Solution**: Install pandas or use JSON format instead of CSV

2. **File Not Found**:
   ```
   FileNotFoundError: [Errno 2] No such file or directory
   ```
   **Solution**: Ensure data files are in the correct directory

3. **Type Errors**:
   ```
   TypeError: 'NoneType' object is not subscriptable
   ```
   **Solution**: Check data integrity and handle missing values

### Performance Issues

- Use filtering instead of loading all recipes
- Implement proper indexing for database operations
- Consider using data pagination for large datasets

## Future Enhancements

1. **Extended Recipe Database**: Add more international cuisines
2. **Seasonal Menus**: Include seasonal availability data
3. **Supplier Integration**: Connect with ingredient suppliers
4. **Nutritional Analysis**: Enhanced nutritional calculations
5. **Cost Tracking**: Real-time ingredient cost updates

## Support

For questions or issues with the restaurant menu dataset:

1. Check this documentation first
2. Review the example code in `menu_data_processor.py`
3. Test with the provided sample data
4. Refer to the AI integration documentation for advanced features

## License

This dataset is provided for restaurant inventory management system integration. Please ensure compliance with local food safety and labeling regulations when using this data in production systems.

---

*Last updated: 2024-07-09*
*Version: 1.0*