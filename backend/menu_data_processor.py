"""
Restaurant Menu Data Processor

A comprehensive utility for managing restaurant menu data, including recipes,
ingredients, costs, and nutritional information.

Author: Smart Stock Ordering System
Version: 1.0
"""

import json
import csv
import sqlite3
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MenuIngredient:
    ingredient_id: str
    name: str
    quantity: float
    unit: str
    cost_per_unit: float
    total_cost: float
    category: str

@dataclass
class MenuRecipe:
    id: str
    name: str
    category: str
    description: str
    prep_time_minutes: int
    cook_time_minutes: int
    serving_size: int
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
    ingredients: List[MenuIngredient]
    instructions: List[str]
    tags: List[str]

class MenuDataProcessor:
    def __init__(self, db_path: str = "restaurant_menu.db"):
        self.db_path = db_path
        self.setup_database()
    
    def setup_database(self):
        """Initialize menu-specific database tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Menu categories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Menu recipes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_recipes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                prep_time_minutes INTEGER,
                cook_time_minutes INTEGER,
                serving_size INTEGER DEFAULT 1,
                difficulty TEXT,
                is_vegetarian BOOLEAN DEFAULT 0,
                is_vegan BOOLEAN DEFAULT 0,
                is_gluten_free BOOLEAN DEFAULT 0,
                allergens TEXT,
                price REAL NOT NULL,
                cost_to_make REAL,
                profit_margin REAL,
                calories INTEGER,
                protein_g REAL,
                carbs_g REAL,
                fat_g REAL,
                fiber_g REAL,
                instructions TEXT,
                tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        """)
        
        # Menu recipe ingredients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_recipe_ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_id TEXT NOT NULL,
                ingredient_id TEXT NOT NULL,
                ingredient_name TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                cost_per_unit REAL,
                total_cost REAL,
                category TEXT,
                FOREIGN KEY (recipe_id) REFERENCES menu_recipes (id)
            )
        """)
        
        # Menu ingredients master table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_ingredients_master (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT,
                unit TEXT,
                cost_per_unit REAL,
                supplier TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
        logger.info("Menu database tables created successfully")
    
    def load_menu_data_from_json(self, json_file_path: str) -> Dict[str, Any]:
        """Load menu data from JSON file."""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            logger.info(f"Loaded menu data from {json_file_path}")
            return data
        except Exception as e:
            logger.error(f"Error loading JSON data: {e}")
            return {}
    
    def load_menu_data_from_csv(self, csv_file_path: str) -> List[Dict[str, Any]]:
        """Load menu data from CSV file."""
        try:
            recipes = []
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Convert string values to appropriate types
                    recipe = {
                        'id': row['recipe_id'],
                        'name': row['recipe_name'],
                        'category': row['category'],
                        'description': row['description'],
                        'prep_time_minutes': int(row['prep_time_minutes']),
                        'cook_time_minutes': int(row['cook_time_minutes']),
                        'difficulty': row['difficulty'],
                        'is_vegetarian': row['is_vegetarian'].upper() == 'TRUE',
                        'is_vegan': row['is_vegan'].upper() == 'TRUE',
                        'is_gluten_free': row['is_gluten_free'].upper() == 'TRUE',
                        'allergens': row['allergens'].split(',') if row['allergens'] else [],
                        'price': float(row['price']),
                        'cost_to_make': float(row['cost_to_make']),
                        'profit_margin': float(row['profit_margin']),
                        'calories': int(row['calories']),
                        'protein_g': float(row['protein_g']),
                        'carbs_g': float(row['carbs_g']),
                        'fat_g': float(row['fat_g']),
                        'fiber_g': float(row['fiber_g']),
                        'tags': row['tags'].split(',') if row['tags'] else []
                    }
                    recipes.append(recipe)
            logger.info(f"Loaded {len(recipes)} recipes from CSV")
            return recipes
        except Exception as e:
            logger.error(f"Error loading CSV data: {e}")
            return []
    
    def import_menu_data(self, json_file_path: str) -> bool:
        """Import complete menu data from JSON file into database."""
        try:
            data = self.load_menu_data_from_json(json_file_path)
            if not data:
                return False
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Import categories
            if 'categories' in data:
                for category in data['categories']:
                    cursor.execute("""
                        INSERT OR REPLACE INTO menu_categories (id, name, description, icon)
                        VALUES (?, ?, ?, ?)
                    """, (
                        category['id'],
                        category['name'],
                        category.get('description', ''),
                        category.get('icon', '🍽️')
                    ))
                logger.info(f"Imported {len(data['categories'])} categories")
            
            # Import recipes and ingredients
            if 'recipes' in data:
                for recipe in data['recipes']:
                    # Insert recipe
                    cursor.execute("""
                        INSERT OR REPLACE INTO menu_recipes (
                            id, name, category, description, prep_time_minutes, cook_time_minutes,
                            serving_size, difficulty, is_vegetarian, is_vegan, is_gluten_free,
                            allergens, price, cost_to_make, profit_margin, calories,
                            protein_g, carbs_g, fat_g, fiber_g, instructions, tags
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        recipe['id'],
                        recipe['name'],
                        recipe['category'],
                        recipe['description'],
                        recipe['prep_time_minutes'],
                        recipe['cook_time_minutes'],
                        recipe.get('serving_size', 1),
                        recipe['difficulty'],
                        recipe['is_vegetarian'],
                        recipe['is_vegan'],
                        recipe['is_gluten_free'],
                        ','.join(recipe['allergens']),
                        recipe['price'],
                        recipe['cost_to_make'],
                        recipe['profit_margin'],
                        recipe['calories'],
                        recipe['protein_g'],
                        recipe['carbs_g'],
                        recipe['fat_g'],
                        recipe['fiber_g'],
                        '\n'.join(recipe.get('instructions', [])),
                        ','.join(recipe.get('tags', []))
                    ))
                    
                    # Clear existing ingredients for this recipe
                    cursor.execute("""
                        DELETE FROM menu_recipe_ingredients WHERE recipe_id = ?
                    """, (recipe['id'],))
                    
                    # Insert recipe ingredients
                    for ingredient in recipe.get('ingredients', []):
                        cursor.execute("""
                            INSERT INTO menu_recipe_ingredients (
                                recipe_id, ingredient_id, ingredient_name, quantity,
                                unit, cost_per_unit, total_cost, category
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            recipe['id'],
                            ingredient['ingredient_id'],
                            ingredient['name'],
                            ingredient['quantity'],
                            ingredient['unit'],
                            ingredient['cost_per_unit'],
                            ingredient['total_cost'],
                            ingredient.get('category', 'other')
                        ))
                        
                        # Insert/update ingredient master data
                        cursor.execute("""
                            INSERT OR REPLACE INTO menu_ingredients_master (
                                id, name, category, unit, cost_per_unit
                            ) VALUES (?, ?, ?, ?, ?)
                        """, (
                            ingredient['ingredient_id'],
                            ingredient['name'],
                            ingredient.get('category', 'other'),
                            ingredient['unit'],
                            ingredient['cost_per_unit']
                        ))
                
                logger.info(f"Imported {len(data['recipes'])} recipes with ingredients")
            
            conn.commit()
            conn.close()
            logger.info("Menu data import completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error importing menu data: {e}")
            return False
    
    def get_all_recipes(self) -> List[Dict[str, Any]]:
        """Get all recipes from database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM menu_recipes WHERE is_active = 1
                ORDER BY category, name
            """)
            
            recipes = []
            for row in cursor.fetchall():
                recipe = {
                    'id': row[0],
                    'name': row[1],
                    'category': row[2],
                    'description': row[3],
                    'prep_time_minutes': row[4],
                    'cook_time_minutes': row[5],
                    'serving_size': row[6],
                    'difficulty': row[7],
                    'is_vegetarian': bool(row[8]),
                    'is_vegan': bool(row[9]),
                    'is_gluten_free': bool(row[10]),
                    'allergens': row[11].split(',') if row[11] else [],
                    'price': row[12],
                    'cost_to_make': row[13],
                    'profit_margin': row[14],
                    'calories': row[15],
                    'protein_g': row[16],
                    'carbs_g': row[17],
                    'fat_g': row[18],
                    'fiber_g': row[19],
                    'instructions': row[20].split('\n') if row[20] else [],
                    'tags': row[21].split(',') if row[21] else []
                }
                
                # Get ingredients for this recipe
                cursor.execute("""
                    SELECT ingredient_id, ingredient_name, quantity, unit, 
                           cost_per_unit, total_cost, category
                    FROM menu_recipe_ingredients WHERE recipe_id = ?
                """, (recipe['id'],))
                
                ingredients = []
                for ing_row in cursor.fetchall():
                    ingredient = {
                        'ingredient_id': ing_row[0],
                        'name': ing_row[1],
                        'quantity': ing_row[2],
                        'unit': ing_row[3],
                        'cost_per_unit': ing_row[4],
                        'total_cost': ing_row[5],
                        'category': ing_row[6]
                    }
                    ingredients.append(ingredient)
                
                recipe['ingredients'] = ingredients
                recipes.append(recipe)
            
            conn.close()
            return recipes
            
        except Exception as e:
            logger.error(f"Error getting recipes: {e}")
            return []
    
    def get_recipes_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get recipes by category."""
        recipes = self.get_all_recipes()
        return [r for r in recipes if r['category'] == category]
    
    def get_recipe_by_id(self, recipe_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific recipe by ID."""
        recipes = self.get_all_recipes()
        for recipe in recipes:
            if recipe['id'] == recipe_id:
                return recipe
        return None
    
    def get_all_categories(self) -> List[Dict[str, Any]]:
        """Get all menu categories."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, name, description, icon FROM menu_categories")
            categories = []
            for row in cursor.fetchall():
                categories.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'icon': row[3]
                })
            
            conn.close()
            return categories
            
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []
    
    def get_menu_analytics(self) -> Dict[str, Any]:
        """Get menu analytics and statistics."""
        try:
            recipes = self.get_all_recipes()
            
            total_recipes = len(recipes)
            categories = {}
            total_revenue_potential = 0
            total_cost = 0
            avg_profit_margin = 0
            
            dietary_counts = {
                'vegetarian': 0,
                'vegan': 0,
                'gluten_free': 0
            }
            
            difficulty_counts = {
                'easy': 0,
                'medium': 0,
                'hard': 0
            }
            
            for recipe in recipes:
                # Category distribution
                cat = recipe['category']
                if cat not in categories:
                    categories[cat] = 0
                categories[cat] += 1
                
                # Financial calculations
                total_revenue_potential += recipe['price']
                total_cost += recipe['cost_to_make']
                avg_profit_margin += recipe['profit_margin']
                
                # Dietary restrictions
                if recipe['is_vegetarian']:
                    dietary_counts['vegetarian'] += 1
                if recipe['is_vegan']:
                    dietary_counts['vegan'] += 1
                if recipe['is_gluten_free']:
                    dietary_counts['gluten_free'] += 1
                
                # Difficulty distribution
                difficulty = recipe['difficulty']
                if difficulty in difficulty_counts:
                    difficulty_counts[difficulty] += 1
            
            avg_profit_margin = avg_profit_margin / total_recipes if total_recipes > 0 else 0
            
            analytics = {
                'total_recipes': total_recipes,
                'categories': categories,
                'total_revenue_potential': total_revenue_potential,
                'total_cost': total_cost,
                'avg_profit_margin': avg_profit_margin,
                'avg_price': total_revenue_potential / total_recipes if total_recipes > 0 else 0,
                'avg_cost': total_cost / total_recipes if total_recipes > 0 else 0,
                'dietary_distribution': dietary_counts,
                'difficulty_distribution': difficulty_counts
            }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting menu analytics: {e}")
            return {}
    
    def sync_with_restaurant_inventory(self, restaurant_db_path: str = "restaurant.db"):
        """Sync menu ingredients with restaurant inventory system."""
        try:
            # Get all unique ingredients from menu
            menu_conn = sqlite3.connect(self.db_path)
            menu_cursor = menu_conn.cursor()
            
            menu_cursor.execute("""
                SELECT DISTINCT ingredient_id, ingredient_name, category, unit, cost_per_unit
                FROM menu_recipe_ingredients
            """)
            
            menu_ingredients = menu_cursor.fetchall()
            menu_conn.close()
            
            # Insert into restaurant inventory
            restaurant_conn = sqlite3.connect(restaurant_db_path)
            restaurant_cursor = restaurant_conn.cursor()
            
            synced_count = 0
            for ingredient in menu_ingredients:
                try:
                    restaurant_cursor.execute("""
                        INSERT OR IGNORE INTO ingredients (
                            id, name, category_id, category_name, supplier, type, unit,
                            cost_per_unit, current_stock, min_stock_level, max_stock_level,
                            sku, description, created_at, updated_at, last_restocked
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        ingredient[0],  # ingredient_id
                        ingredient[1],  # ingredient_name
                        ingredient[2],  # category
                        ingredient[2].replace('-', ' ').title(),  # category_name
                        'Menu Import',  # supplier
                        'Fresh',  # type
                        ingredient[3],  # unit
                        ingredient[4],  # cost_per_unit
                        0,  # current_stock
                        5,  # min_stock_level
                        100,  # max_stock_level
                        f"MENU-{ingredient[0].upper()}",  # sku
                        f"Imported from menu dataset",  # description
                        datetime.now().isoformat(),  # created_at
                        datetime.now().isoformat(),  # updated_at
                        datetime.now().isoformat()   # last_restocked
                    ))
                    synced_count += 1
                except Exception as e:
                    logger.warning(f"Could not sync ingredient {ingredient[1]}: {e}")
            
            restaurant_conn.commit()
            restaurant_conn.close()
            
            logger.info(f"Synced {synced_count} ingredients with restaurant inventory")
            return synced_count
            
        except Exception as e:
            logger.error(f"Error syncing with restaurant inventory: {e}")
            return 0

# Initialize the processor
menu_processor = MenuDataProcessor()

# Function to import the dataset
def import_restaurant_menu_dataset():
    """Import the complete restaurant menu dataset."""
    try:
        json_path = "../sample_data/restaurant_menu_dataset.json"
        success = menu_processor.import_menu_data(json_path)
        
        if success:
            # Sync with restaurant inventory
            synced = menu_processor.sync_with_restaurant_inventory()
            logger.info(f"Menu dataset imported successfully! Synced {synced} ingredients.")
            return True
        else:
            logger.error("Failed to import menu dataset")
            return False
            
    except Exception as e:
        logger.error(f"Error in import process: {e}")
        return False

if __name__ == "__main__":
    # Import the dataset when script is run directly
    import_restaurant_menu_dataset()
    
    # Print analytics
    analytics = menu_processor.get_menu_analytics()
    print("\n🍽️ Menu Analytics:")
    print(f"📊 Total Recipes: {analytics.get('total_recipes', 0)}")
    print(f"💰 Average Price: ${analytics.get('avg_price', 0):.2f}")
    print(f"📈 Average Profit Margin: {analytics.get('avg_profit_margin', 0):.1f}%")
    print(f"🥗 Vegetarian Options: {analytics.get('dietary_distribution', {}).get('vegetarian', 0)}")
    print(f"🌱 Vegan Options: {analytics.get('dietary_distribution', {}).get('vegan', 0)}")