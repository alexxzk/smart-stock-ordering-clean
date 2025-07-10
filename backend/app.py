from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime
import json
import sqlite3
import logging

# Load environment variables
load_dotenv()

# Import services
try:
    from ai_service import ai_service
    # Train models on startup if AI service is available
    try:
        ai_service.train_demand_forecasting_model()
        logger = logging.getLogger(__name__)
        logger.info("AI models trained successfully")
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error training AI models: {e}")
except ImportError:
    print("Warning: AI service not available - running in basic mode")
    ai_service = None

try:
    from menu_data_processor import MenuDataProcessor
    menu_processor = MenuDataProcessor()
    print("Menu data processor initialized")
except ImportError:
    print("Warning: Menu data processor not available")
    menu_processor = None
except Exception as e:
    print(f"Error initializing menu processor: {e}")
    menu_processor = None

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE = 'restaurant.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with required tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create tables as needed
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT,
            price REAL NOT NULL,
            stock_quantity INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ai_service': ai_service is not None
    })

# AI Assistant Routes
@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    """AI Chat endpoint"""
    if not ai_service:
        return jsonify({'error': 'AI service not available'}), 503
    
    try:
        data = request.get_json()
        user_input = data.get('message', '')
        
        if not user_input:
            return jsonify({'error': 'Message is required'}), 400
        
        response = ai_service.get_ai_chat_response(user_input)
        
        return jsonify({
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/ai/insights', methods=['GET'])
def get_ai_insights():
    """Get AI-generated insights"""
    if not ai_service:
        return jsonify({'error': 'AI service not available'}), 503
    
    try:
        insights = ai_service.generate_ai_insights()
        
        # Convert dataclasses to dict
        insights_dict = []
        for insight in insights:
            insights_dict.append({
                'id': insight.id,
                'type': insight.type,
                'title': insight.title,
                'description': insight.description,
                'confidence': insight.confidence,
                'impact': insight.impact,
                'action': insight.action,
                'data': insight.data,
                'timestamp': insight.timestamp
            })
        
        return jsonify({
            'insights': insights_dict,
            'count': len(insights_dict)
        })
    
    except Exception as e:
        logger.error(f"AI insights error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/ai/forecasts', methods=['GET'])
def get_demand_forecasts():
    """Get demand forecasts"""
    if not ai_service:
        return jsonify({'error': 'AI service not available'}), 503
    
    try:
        forecasts = ai_service.get_demand_forecasts()
        
        # Convert dataclasses to dict
        forecasts_dict = []
        for forecast in forecasts:
            forecasts_dict.append({
                'ingredient_id': forecast.ingredient_id,
                'ingredient_name': forecast.ingredient_name,
                'current_stock': forecast.current_stock,
                'predicted_demand_7d': forecast.predicted_demand_7d,
                'predicted_demand_30d': forecast.predicted_demand_30d,
                'reorder_recommendation': forecast.reorder_recommendation,
                'confidence': forecast.confidence,
                'trend': forecast.trend,
                'seasonal_factor': forecast.seasonal_factor
            })
        
        return jsonify({
            'forecasts': forecasts_dict,
            'count': len(forecasts_dict)
        })
    
    except Exception as e:
        logger.error(f"AI forecasts error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/ai/menu-optimization', methods=['GET'])
def get_menu_optimization():
    """Get menu optimization data"""
    if not ai_service:
        return jsonify({'error': 'AI service not available'}), 503
    
    try:
        optimizations = ai_service.get_menu_optimization_data()
        
        # Convert dataclasses to dict
        optimizations_dict = []
        for opt in optimizations:
            optimizations_dict.append({
                'recipe_id': opt.recipe_id,
                'recipe_name': opt.recipe_name,
                'profitability_score': opt.profitability_score,
                'demand_score': opt.demand_score,
                'ingredient_availability': opt.ingredient_availability,
                'recommendation': opt.recommendation,
                'suggested_price': opt.suggested_price,
                'current_price': opt.current_price
            })
        
        return jsonify({
            'optimizations': optimizations_dict,
            'count': len(optimizations_dict)
        })
    
    except Exception as e:
        logger.error(f"AI menu optimization error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/ai/train-models', methods=['POST'])
def train_ai_models():
    """Manually trigger AI model training"""
    if not ai_service:
        return jsonify({'error': 'AI service not available'}), 503
    
    try:
        scores = ai_service.train_demand_forecasting_model()
        
        return jsonify({
            'message': 'Models trained successfully',
            'scores': scores,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"AI model training error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Basic CRUD routes for compatibility
@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products ORDER BY created_at DESC")
        products = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(row) for row in products])
    
    except Exception as e:
        logger.error(f"Get products error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product"""
    try:
        data = request.get_json()
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO products (name, category, subcategory, price, stock_quantity)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data['name'],
            data['category'],
            data.get('subcategory', ''),
            data['price'],
            data['stock_quantity']
        ))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Product created successfully'}), 201
    
    except Exception as e:
        logger.error(f"Create product error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM categories ORDER BY name")
        categories = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(row) for row in categories])
    
    except Exception as e:
        logger.error(f"Get categories error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Menu Data Routes
@app.route('/api/menu/import-dataset', methods=['POST'])
def import_menu_dataset():
    """Import menu dataset from provided files"""
    if not menu_processor:
        return jsonify({'error': 'Menu processor not available'}), 503
    
    try:
        # Import from sample data files
        json_file = os.path.join('sample_data', 'restaurant_menu_dataset.json')
        csv_file = os.path.join('sample_data', 'restaurant_menu_dataset.csv')
        
        results = {}
        
        # Import JSON data
        json_file = '../sample_data/restaurant_menu_dataset.json'
        success = menu_processor.import_menu_data(json_file)
        results['import_success'] = success
        
        if not results:
            return jsonify({'error': 'Menu dataset files not found'}), 404
        
        return jsonify({
            'message': 'Menu dataset imported successfully',
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Menu import error: {e}")
        return jsonify({'error': f'Failed to import menu dataset: {str(e)}'}), 500

@app.route('/api/menu/categories', methods=['GET'])
def get_menu_categories():
    """Get all menu categories"""
    if not menu_processor:
        return jsonify({'error': 'Menu processor not available'}), 503
    
    try:
        categories = menu_processor.get_all_categories()
        return jsonify(categories)
    
    except Exception as e:
        logger.error(f"Get menu categories error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/menu/recipes', methods=['GET'])
def get_menu_recipes():
    """Get all recipes, optionally filtered by category"""
    if not menu_processor:
        return jsonify({'error': 'Menu processor not available'}), 503
    
    try:
        category = request.args.get('category')
        search_term = request.args.get('search')
        
        if category:
            recipes = menu_processor.get_recipes_by_category(category)
        else:
            recipes = menu_processor.get_all_recipes()
        
        return jsonify(recipes)
    
    except Exception as e:
        logger.error(f"Get menu recipes error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/menu/recipe/<recipe_id>', methods=['GET'])
def get_menu_recipe_details(recipe_id):
    """Get detailed recipe information including ingredients"""
    if not menu_processor:
        return jsonify({'error': 'Menu processor not available'}), 503
    
    try:
        recipe = menu_processor.get_recipe_by_id(recipe_id)
        
        if not recipe:
            return jsonify({'error': 'Recipe not found'}), 404
        
        return jsonify(recipe)
    
    except Exception as e:
        logger.error(f"Get recipe details error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/menu/analytics', methods=['GET'])
def get_menu_analytics():
    """Get menu analytics and statistics"""
    if not menu_processor:
        return jsonify({'error': 'Menu processor not available'}), 503
    
    try:
        analytics = menu_processor.get_menu_analytics()
        return jsonify(analytics)
    
    except Exception as e:
        logger.error(f"Get menu analytics error: {e}")
        return jsonify({'error': 'Internal server error'}), 500



if __name__ == '__main__':
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)