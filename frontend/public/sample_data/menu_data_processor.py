"""
Restaurant Menu Data Processor

A comprehensive utility class for processing, analyzing, and managing restaurant menu data.
Supports both JSON and CSV formats with advanced filtering and cost analysis capabilities.

Author: Smart Stock Ordering System
Version: 1.0
Date: 2024-07-09
"""

import json
import csv
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import os

# Optional pandas import with fallback
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


@dataclass
class Recipe:
    """Data class representing a restaurant recipe."""
    recipe_id: str
    recipe_name: str
    category: str
    description: str
    prep_time_minutes: int
    cook_time_minutes: int
    difficulty: str
    is_vegetarian: bool
    is_vegan: bool
    is_gluten_free: bool
    allergens: List[str]
    price: float
    cost_to_make: float
    profit_margin: float
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    tags: List[str]
    ingredients: Optional[List[Dict]] = None
    instructions: Optional[List[str]] = None


@dataclass
class Ingredient:
    """Data class representing a recipe ingredient."""
    ingredient_id: str
    name: str
    quantity: float
    unit: str
    cost_per_unit: float
    total_cost: float
    category: str


@dataclass
class MenuAnalytics:
    """Data class for menu analytics results."""
    total_recipes: int
    categories: List[str]
    average_profit_margin: float
    highest_profit_recipe: Dict[str, Any]
    lowest_cost_recipe: Dict[str, Any]
    most_expensive_recipe: Dict[str, Any]
    dietary_distribution: Dict[str, int]
    category_distribution: Dict[str, int]


class MenuDataProcessor:
    """
    Comprehensive menu data processor for restaurant management systems.
    
    Features:
    - Load data from JSON or CSV formats
    - Filter recipes by dietary requirements, categories, price ranges
    - Calculate cost analysis and profit margins
    - Generate menu analytics and reports
    - Export data in various formats
    - Integration with inventory systems
    """
    
    def __init__(self, data_source: str = None):
        """
        Initialize the menu data processor.
        
        Args:
            data_source (str): Path to JSON or CSV data file
        """
        self.recipes: List[Recipe] = []
        self.categories: List[Dict] = []
        self.metadata: Dict = {}
        
        if data_source:
            self.load_data(data_source)
    
    def load_data(self, file_path: str) -> bool:
        """
        Load menu data from JSON or CSV file.
        
        Args:
            file_path (str): Path to the data file
            
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        try:
            if file_path.endswith('.json'):
                return self._load_json(file_path)
            elif file_path.endswith('.csv'):
                return self._load_csv(file_path)
            else:
                raise ValueError("Unsupported file format. Use .json or .csv")
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def _load_json(self, file_path: str) -> bool:
        """Load data from JSON file."""
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        self.metadata = data.get('metadata', {})
        self.categories = data.get('categories', [])
        
        recipes_data = data.get('recipes', [])
        self.recipes = []
        
        for recipe_data in recipes_data:
            # Handle allergens and tags as lists
            allergens = recipe_data.get('allergens', [])
            if isinstance(allergens, str):
                allergens = [allergen.strip() for allergen in allergens.split(',')]
            
            tags = recipe_data.get('tags', [])
            if isinstance(tags, str):
                tags = [tag.strip() for tag in tags.split(',')]
            
            recipe = Recipe(
                recipe_id=recipe_data.get('id', ''),
                recipe_name=recipe_data.get('name', ''),
                category=recipe_data.get('category', ''),
                description=recipe_data.get('description', ''),
                prep_time_minutes=recipe_data.get('prep_time_minutes', 0),
                cook_time_minutes=recipe_data.get('cook_time_minutes', 0),
                difficulty=recipe_data.get('difficulty', 'medium'),
                is_vegetarian=recipe_data.get('is_vegetarian', False),
                is_vegan=recipe_data.get('is_vegan', False),
                is_gluten_free=recipe_data.get('is_gluten_free', False),
                allergens=allergens,
                price=recipe_data.get('price', 0.0),
                cost_to_make=recipe_data.get('cost_to_make', 0.0),
                profit_margin=recipe_data.get('profit_margin', 0.0),
                calories=recipe_data.get('calories', 0),
                protein_g=recipe_data.get('protein_g', 0.0),
                carbs_g=recipe_data.get('carbs_g', 0.0),
                fat_g=recipe_data.get('fat_g', 0.0),
                fiber_g=recipe_data.get('fiber_g', 0.0),
                tags=tags,
                ingredients=recipe_data.get('ingredients', []),
                instructions=recipe_data.get('instructions', [])
            )
            self.recipes.append(recipe)
        
        return True
    
    def _load_csv(self, file_path: str) -> bool:
        """Load data from CSV file."""
        if not HAS_PANDAS:
            print("Error: pandas is required for CSV loading but not installed")
            return False
            
        df = pd.read_csv(file_path)
        
        self.recipes = []
        for _, row in df.iterrows():
            # Handle allergens and tags as lists
            allergens = []
            if pd.notna(row.get('allergens', '')):
                allergens = [allergen.strip() for allergen in str(row['allergens']).split(',')]
            
            tags = []
            if pd.notna(row.get('tags', '')):
                tags = [tag.strip() for tag in str(row['tags']).split(',')]
            
            recipe = Recipe(
                recipe_id=str(row.get('recipe_id', '')),
                recipe_name=str(row.get('recipe_name', '')),
                category=str(row.get('category', '')),
                description=str(row.get('description', '')),
                prep_time_minutes=int(row.get('prep_time_minutes', 0)),
                cook_time_minutes=int(row.get('cook_time_minutes', 0)),
                difficulty=str(row.get('difficulty', 'medium')),
                is_vegetarian=bool(row.get('is_vegetarian', False)),
                is_vegan=bool(row.get('is_vegan', False)),
                is_gluten_free=bool(row.get('is_gluten_free', False)),
                allergens=allergens,
                price=float(row.get('price', 0.0)),
                cost_to_make=float(row.get('cost_to_make', 0.0)),
                profit_margin=float(row.get('profit_margin', 0.0)),
                calories=int(row.get('calories', 0)),
                protein_g=float(row.get('protein_g', 0.0)),
                carbs_g=float(row.get('carbs_g', 0.0)),
                fat_g=float(row.get('fat_g', 0.0)),
                fiber_g=float(row.get('fiber_g', 0.0)),
                tags=tags
            )
            self.recipes.append(recipe)
        
        return True
    
    def filter_recipes(self, 
                      category: str = None,
                      dietary_restrictions: List[str] = None,
                      max_price: float = None,
                      min_price: float = None,
                      difficulty: str = None,
                      max_prep_time: int = None,
                      tags: List[str] = None) -> List[Recipe]:
        """
        Filter recipes based on various criteria.
        
        Args:
            category (str): Recipe category to filter by
            dietary_restrictions (List[str]): Dietary restrictions ('vegetarian', 'vegan', 'gluten_free')
            max_price (float): Maximum price filter
            min_price (float): Minimum price filter
            difficulty (str): Difficulty level ('easy', 'medium', 'hard')
            max_prep_time (int): Maximum preparation time in minutes
            tags (List[str]): Tags to filter by
            
        Returns:
            List[Recipe]: Filtered list of recipes
        """
        filtered_recipes = self.recipes.copy()
        
        # Category filter
        if category:
            filtered_recipes = [r for r in filtered_recipes if r.category == category]
        
        # Dietary restrictions filter
        if dietary_restrictions:
            for restriction in dietary_restrictions:
                if restriction == 'vegetarian':
                    filtered_recipes = [r for r in filtered_recipes if r.is_vegetarian]
                elif restriction == 'vegan':
                    filtered_recipes = [r for r in filtered_recipes if r.is_vegan]
                elif restriction == 'gluten_free':
                    filtered_recipes = [r for r in filtered_recipes if r.is_gluten_free]
        
        # Price filters
        if max_price is not None:
            filtered_recipes = [r for r in filtered_recipes if r.price <= max_price]
        if min_price is not None:
            filtered_recipes = [r for r in filtered_recipes if r.price >= min_price]
        
        # Difficulty filter
        if difficulty:
            filtered_recipes = [r for r in filtered_recipes if r.difficulty == difficulty]
        
        # Preparation time filter
        if max_prep_time is not None:
            filtered_recipes = [r for r in filtered_recipes if r.prep_time_minutes <= max_prep_time]
        
        # Tags filter
        if tags:
            filtered_recipes = [r for r in filtered_recipes if any(tag in r.tags for tag in tags)]
        
        return filtered_recipes
    
    def get_recipe_by_id(self, recipe_id: str) -> Optional[Recipe]:
        """Get a specific recipe by ID."""
        for recipe in self.recipes:
            if recipe.recipe_id == recipe_id:
                return recipe
        return None
    
    def get_recipes_by_category(self, category: str) -> List[Recipe]:
        """Get all recipes in a specific category."""
        return [recipe for recipe in self.recipes if recipe.category == category]
    
    def calculate_menu_analytics(self) -> MenuAnalytics:
        """
        Calculate comprehensive menu analytics.
        
        Returns:
            MenuAnalytics: Analytics data object
        """
        if not self.recipes:
            return MenuAnalytics(0, [], 0.0, {}, {}, {}, {}, {})
        
        # Basic statistics
        total_recipes = len(self.recipes)
        categories = list(set(recipe.category for recipe in self.recipes))
        average_profit_margin = sum(recipe.profit_margin for recipe in self.recipes) / total_recipes
        
        # Find extremes
        highest_profit_recipe = max(self.recipes, key=lambda r: r.profit_margin)
        lowest_cost_recipe = min(self.recipes, key=lambda r: r.cost_to_make)
        most_expensive_recipe = max(self.recipes, key=lambda r: r.price)
        
        # Dietary distribution
        dietary_distribution = {
            'vegetarian': sum(1 for r in self.recipes if r.is_vegetarian),
            'vegan': sum(1 for r in self.recipes if r.is_vegan),
            'gluten_free': sum(1 for r in self.recipes if r.is_gluten_free)
        }
        
        # Category distribution
        category_distribution = {}
        for category in categories:
            category_distribution[category] = sum(1 for r in self.recipes if r.category == category)
        
        return MenuAnalytics(
            total_recipes=total_recipes,
            categories=categories,
            average_profit_margin=average_profit_margin,
            highest_profit_recipe={
                'id': highest_profit_recipe.recipe_id,
                'name': highest_profit_recipe.recipe_name,
                'margin': highest_profit_recipe.profit_margin
            },
            lowest_cost_recipe={
                'id': lowest_cost_recipe.recipe_id,
                'name': lowest_cost_recipe.recipe_name,
                'cost': lowest_cost_recipe.cost_to_make
            },
            most_expensive_recipe={
                'id': most_expensive_recipe.recipe_id,
                'name': most_expensive_recipe.recipe_name,
                'price': most_expensive_recipe.price
            },
            dietary_distribution=dietary_distribution,
            category_distribution=category_distribution
        )
    
    def export_to_csv(self, file_path: str, filtered_recipes: List[Recipe] = None) -> bool:
        """
        Export recipes to CSV format.
        
        Args:
            file_path (str): Output file path
            filtered_recipes (List[Recipe]): Specific recipes to export (default: all)
            
        Returns:
            bool: True if exported successfully
        """
        try:
            recipes_to_export = filtered_recipes or self.recipes
            
            with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = [
                    'recipe_id', 'recipe_name', 'category', 'description',
                    'prep_time_minutes', 'cook_time_minutes', 'difficulty',
                    'is_vegetarian', 'is_vegan', 'is_gluten_free', 'allergens',
                    'price', 'cost_to_make', 'profit_margin', 'calories',
                    'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'tags'
                ]
                
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                
                for recipe in recipes_to_export:
                    row = asdict(recipe)
                    # Convert lists to comma-separated strings
                    row['allergens'] = ','.join(recipe.allergens)
                    row['tags'] = ','.join(recipe.tags)
                    # Remove complex fields not suitable for CSV
                    row.pop('ingredients', None)
                    row.pop('instructions', None)
                    writer.writerow(row)
            
            return True
        except Exception as e:
            print(f"Error exporting to CSV: {e}")
            return False
    
    def export_to_json(self, file_path: str, filtered_recipes: List[Recipe] = None) -> bool:
        """
        Export recipes to JSON format.
        
        Args:
            file_path (str): Output file path
            filtered_recipes (List[Recipe]): Specific recipes to export (default: all)
            
        Returns:
            bool: True if exported successfully
        """
        try:
            recipes_to_export = filtered_recipes or self.recipes
            
            export_data = {
                'metadata': {
                    'exported_at': datetime.now().isoformat(),
                    'total_recipes': len(recipes_to_export),
                    'version': '1.0'
                },
                'categories': self.categories,
                'recipes': [asdict(recipe) for recipe in recipes_to_export]
            }
            
            with open(file_path, 'w', encoding='utf-8') as jsonfile:
                json.dump(export_data, jsonfile, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error exporting to JSON: {e}")
            return False
    
    def get_cost_analysis(self) -> Dict[str, Any]:
        """
        Get detailed cost analysis of the menu.
        
        Returns:
            Dict: Cost analysis data
        """
        if not self.recipes:
            return {}
        
        prices = [recipe.price for recipe in self.recipes]
        costs = [recipe.cost_to_make for recipe in self.recipes]
        margins = [recipe.profit_margin for recipe in self.recipes]
        
        return {
            'total_recipes': len(self.recipes),
            'price_analysis': {
                'average_price': sum(prices) / len(prices),
                'min_price': min(prices),
                'max_price': max(prices),
                'price_range': max(prices) - min(prices)
            },
            'cost_analysis': {
                'average_cost': sum(costs) / len(costs),
                'min_cost': min(costs),
                'max_cost': max(costs),
                'total_food_cost': sum(costs)
            },
            'profit_analysis': {
                'average_margin': sum(margins) / len(margins),
                'min_margin': min(margins),
                'max_margin': max(margins),
                'potential_revenue': sum(prices),
                'potential_profit': sum(prices) - sum(costs)
            }
        }
    
    def generate_report(self, output_file: str = None) -> str:
        """
        Generate a comprehensive menu analysis report.
        
        Args:
            output_file (str): Optional file path to save the report
            
        Returns:
            str: Report content
        """
        analytics = self.calculate_menu_analytics()
        cost_analysis = self.get_cost_analysis()
        
        report = f"""
RESTAURANT MENU ANALYSIS REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
================================================================

OVERVIEW
--------
Total Recipes: {analytics.total_recipes}
Categories: {len(analytics.categories)}
Average Profit Margin: {analytics.average_profit_margin:.1f}%

CATEGORIES
----------
"""
        for category, count in analytics.category_distribution.items():
            report += f"{category.replace('-', ' ').title()}: {count} recipes\n"
        
        report += f"""
DIETARY OPTIONS
---------------
Vegetarian: {analytics.dietary_distribution['vegetarian']} recipes
Vegan: {analytics.dietary_distribution['vegan']} recipes
Gluten-Free: {analytics.dietary_distribution['gluten_free']} recipes

TOP PERFORMERS
--------------
Highest Profit Margin: {analytics.highest_profit_recipe['name']} ({analytics.highest_profit_recipe['margin']:.1f}%)
Lowest Cost to Make: {analytics.lowest_cost_recipe['name']} (${analytics.lowest_cost_recipe['cost']:.2f})
Most Expensive: {analytics.most_expensive_recipe['name']} (${analytics.most_expensive_recipe['price']:.2f})

FINANCIAL ANALYSIS
------------------
Average Menu Price: ${cost_analysis['price_analysis']['average_price']:.2f}
Average Food Cost: ${cost_analysis['cost_analysis']['average_cost']:.2f}
Potential Daily Revenue: ${cost_analysis['profit_analysis']['potential_revenue']:.2f}
Potential Daily Profit: ${cost_analysis['profit_analysis']['potential_profit']:.2f}

RECOMMENDATIONS
---------------
1. Consider promoting high-margin items: {analytics.highest_profit_recipe['name']}
2. Review pricing for low-margin items
3. Optimize food costs where possible
4. Expand popular categories with high profit margins
"""
        
        if output_file:
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(report)
                print(f"Report saved to {output_file}")
            except Exception as e:
                print(f"Error saving report: {e}")
        
        return report


# Example usage and integration functions
def load_menu_data_for_restaurant_app(json_file_path: str, csv_file_path: str = None):
    """
    Convenience function to load menu data for restaurant inventory app integration.
    
    Args:
        json_file_path (str): Path to JSON menu data
        csv_file_path (str): Optional path to CSV menu data
        
    Returns:
        MenuDataProcessor: Configured processor instance
    """
    processor = MenuDataProcessor()
    
    # Try to load JSON first, then fallback to CSV
    if os.path.exists(json_file_path):
        processor.load_data(json_file_path)
        print(f"✅ Loaded menu data from {json_file_path}")
    elif csv_file_path and os.path.exists(csv_file_path):
        processor.load_data(csv_file_path)
        print(f"✅ Loaded menu data from {csv_file_path}")
    else:
        print("❌ No menu data files found")
        return None
    
    return processor


def integrate_with_restaurant_inventory(processor: MenuDataProcessor) -> Dict[str, Any]:
    """
    Generate data structure compatible with restaurant inventory system.
    
    Args:
        processor (MenuDataProcessor): Menu data processor instance
        
    Returns:
        Dict: Data structure for restaurant inventory integration
    """
    categories = []
    recipes = []
    
    # Convert categories
    for category in processor.categories:
        categories.append({
            'id': category.get('id', ''),
            'name': category.get('name', ''),
            'icon': category.get('icon', '🍽️'),
            'color': '#3b82f6'  # Default color
        })
    
    # Convert recipes
    for recipe in processor.recipes:
        recipe_data = {
            'id': recipe.recipe_id,
            'name': recipe.recipe_name,
            'description': recipe.description,
            'category': recipe.category,
            'selling_price': recipe.price,
            'preparation_time': recipe.prep_time_minutes + recipe.cook_time_minutes,
            'serving_size': 1,
            'ingredients': recipe.ingredients or [],
            'is_active': True,
            'dietary_info': {
                'is_vegetarian': recipe.is_vegetarian,
                'is_vegan': recipe.is_vegan,
                'is_gluten_free': recipe.is_gluten_free,
                'allergens': recipe.allergens
            },
            'nutrition': {
                'calories': recipe.calories,
                'protein_g': recipe.protein_g,
                'carbs_g': recipe.carbs_g,
                'fat_g': recipe.fat_g,
                'fiber_g': recipe.fiber_g
            },
            'cost_analysis': {
                'food_cost': recipe.cost_to_make,
                'profit_margin': recipe.profit_margin,
                'profit_amount': recipe.price - recipe.cost_to_make
            },
            'tags': recipe.tags,
            'difficulty': recipe.difficulty,
            'instructions': recipe.instructions or []
        }
        recipes.append(recipe_data)
    
    return {
        'categories': categories,
        'recipes': recipes,
        'metadata': {
            'total_recipes': len(recipes),
            'last_updated': datetime.now().isoformat(),
            'version': '1.0'
        }
    }


if __name__ == "__main__":
    # Example usage
    print("Restaurant Menu Data Processor")
    print("=" * 50)
    
    # Load sample data
    processor = MenuDataProcessor('restaurant_menu_dataset.json')
    
    if processor.recipes:
        print(f"Loaded {len(processor.recipes)} recipes")
        
        # Generate analytics
        analytics = processor.calculate_menu_analytics()
        print(f"Categories: {', '.join(analytics.categories)}")
        print(f"Average profit margin: {analytics.average_profit_margin:.1f}%")
        
        # Filter examples
        vegetarian_recipes = processor.filter_recipes(dietary_restrictions=['vegetarian'])
        print(f"Vegetarian options: {len(vegetarian_recipes)}")
        
        quick_recipes = processor.filter_recipes(max_prep_time=15)
        print(f"Quick recipes (≤15 min prep): {len(quick_recipes)}")
        
        # Generate report
        report = processor.generate_report()
        print("\nSample report generated!")
        
    else:
        print("No recipes loaded. Check your data file.")