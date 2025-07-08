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

# Import AI service
try:
    from ai_service import ai_service
except ImportError:
    print("Warning: AI service not available")
    ai_service = None

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

if __name__ == '__main__':
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)