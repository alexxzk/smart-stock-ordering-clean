# 📊 POS Integration Guide - Complete Setup & Configuration

## Overview

The POS Integration system connects your Point of Sale systems to get real-time sales data, generate analytics, and provide AI-powered ordering recommendations based on actual sales performance.

## 🚀 What's Included

### **Supported POS Systems**
- **Square POS** - Complete API integration with real-time data
- **Shopify POS** - Order analytics and product performance  
- **Toast POS** - Restaurant-focused analytics and menu insights
- **Lightspeed POS** - Retail analytics and customer data
- **Clover POS** - Order management and payment processing
- **Generic POS API** - Custom API integration for any POS system
- **CSV Import** - File-based integration for legacy systems

### **Key Features**
✅ **Real-time Sales Analytics** - Revenue, transactions, item performance  
✅ **AI-Powered Recommendations** - Smart ordering suggestions based on sales velocity  
✅ **Top Selling Items** - Identify your best performers  
✅ **Daily Sales Trends** - Track performance over time  
✅ **Inventory Insights** - Know what to order and when  
✅ **Multi-POS Support** - Connect multiple systems simultaneously  

## 🔧 Quick Setup

### Step 1: Configure Your POS System

Edit `backend/app/config/pos_config.py` to add your POS system:

```python
# Example: Square POS Configuration
"square": {
    "id": "square",
    "name": "Square POS",
    "integration_type": "api",
    "api_config": {
        "base_url": "https://connect.squareup.com/v2",
        "access_token": os.getenv("SQUARE_ACCESS_TOKEN"),
        "application_id": os.getenv("SQUARE_APPLICATION_ID"),
        "environment": "production",  # or "sandbox"
    }
}
```

### Step 2: Set Environment Variables

Add these to your deployment environment:

```bash
# Square POS
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_square_app_id

# Shopify POS  
SHOPIFY_ACCESS_TOKEN=your_shopify_token
SHOPIFY_SHOP_DOMAIN=your-shop-name

# Toast POS
TOAST_CLIENT_ID=your_toast_client_id
TOAST_CLIENT_SECRET=your_toast_client_secret
TOAST_RESTAURANT_GUID=your_restaurant_guid

# Generic POS
GENERIC_POS_API_URL=https://api.yourpos.com/v1
GENERIC_POS_API_KEY=your_api_key
```

### Step 3: Test Connection

```bash
cd backend
python -c "
from app.services.pos_api_service import test_pos_connection
import asyncio

async def test():
    result = await test_pos_connection('square')
    print(result)

asyncio.run(test())
"
```

### Step 4: Access the Interface

Navigate to `/pos-integrations` in your frontend to:
- View sales analytics
- Get AI recommendations  
- Track performance trends
- Monitor top-selling items

## 📡 API Integration Examples

### Square POS Integration

```python
# Configuration
"square": {
    "api_config": {
        "base_url": "https://connect.squareup.com/v2",
        "access_token": os.getenv("SQUARE_ACCESS_TOKEN"),
        "endpoints": {
            "orders": "/orders/search",
            "payments": "/payments",
            "items": "/catalog/list"
        }
    }
}

# Environment Variables
SQUARE_ACCESS_TOKEN=sq0atp-your-access-token
SQUARE_APPLICATION_ID=sq0idp-your-application-id
SQUARE_ENVIRONMENT=production
```

### Shopify POS Integration

```python
# Configuration  
"shopify_pos": {
    "api_config": {
        "base_url": "https://{shop}.myshopify.com/admin/api/2023-10",
        "shop_domain": os.getenv("SHOPIFY_SHOP_DOMAIN"),
        "access_token": os.getenv("SHOPIFY_ACCESS_TOKEN"),
        "endpoints": {
            "orders": "/orders.json",
            "products": "/products.json"
        }
    }
}

# Environment Variables
SHOPIFY_ACCESS_TOKEN=shpat_your-access-token
SHOPIFY_SHOP_DOMAIN=your-shop-name
```

### Toast POS Integration (Restaurant)

```python
# Configuration
"toast": {
    "api_config": {
        "base_url": "https://api.toasttab.com",
        "client_id": os.getenv("TOAST_CLIENT_ID"),
        "client_secret": os.getenv("TOAST_CLIENT_SECRET"),
        "endpoints": {
            "orders": "/orders/v2/orders",
            "menu": "/config/v2/menuItems"
        }
    }
}

# Environment Variables  
TOAST_CLIENT_ID=your-toast-client-id
TOAST_CLIENT_SECRET=your-toast-client-secret
TOAST_RESTAURANT_GUID=your-restaurant-guid
```

### Generic API Integration

```python
# Configuration
"generic_pos": {
    "api_config": {
        "base_url": os.getenv("GENERIC_POS_API_URL"),
        "api_key": os.getenv("GENERIC_POS_API_KEY"),
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "endpoints": {
            "sales": "/sales",
            "transactions": "/transactions"
        }
    }
}

# Environment Variables
GENERIC_POS_API_URL=https://api.yourpos.com/v1
GENERIC_POS_API_KEY=your-api-key
```

## 📊 Available Analytics

### **Revenue Analytics**
- Total revenue for any date range
- Average transaction value
- Daily/weekly/monthly trends
- Revenue by product category

### **Item Performance**  
- Top selling items by quantity
- Top selling items by revenue
- Sales velocity (items/day)
- Seasonal trends and patterns

### **AI Recommendations**
- Recommended order quantities
- Urgency levels (high/medium/low)
- Safety stock calculations
- Demand forecasting

### **Customer Insights**
- Transaction frequency
- Average customer spend
- Peak sales hours/days
- Customer behavior patterns

## 🔄 API Endpoints

### Get POS Systems
```http
GET /api/pos-integrations/pos-systems
```

### Get Sales Data
```http
POST /api/pos-integrations/sales-data
Content-Type: application/json

{
  "pos_id": "square",
  "start_date": "2024-01-01", 
  "end_date": "2024-01-31"
}
```

### Get Analytics
```http
POST /api/pos-integrations/analytics
Content-Type: application/json

{
  "pos_id": "square",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31" 
}
```

### Get Recommendations
```http
POST /api/pos-integrations/recommendations
Content-Type: application/json

{
  "pos_id": "square",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

### Quick Analytics (Last 7 Days)
```http
GET /api/pos-integrations/quick-analytics?pos_id=square&days=7
```

### Health Check
```http
GET /api/pos-integrations/health
```

## 🧪 Testing Your Integration

### 1. Test POS Connection
```bash
curl -X GET "http://localhost:8000/api/pos-integrations/test-connection/square" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Analytics
```bash
curl -X POST "http://localhost:8000/api/pos-integrations/analytics" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pos_id": "square",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }'
```

### 3. Get Mock Data (for testing)
```bash
curl -X GET "http://localhost:8000/api/pos-integrations/mock-data?pos_id=square&days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Use Cases

### **Daily Operations**
- Check yesterday's sales performance
- Identify trending items
- Get emergency restock alerts
- Monitor peak hours

### **Weekly Planning**
- Analyze weekly sales patterns
- Plan upcoming orders
- Identify slow-moving inventory
- Adjust menu/product mix

### **Monthly Analysis**
- Revenue trend analysis
- Seasonal pattern detection
- Inventory optimization
- Business performance review

### **AI-Powered Ordering**
- Automated order suggestions
- Demand forecasting
- Safety stock management
- Cost optimization

## 🔐 Security & Authentication

### API Key Management
- Store all API keys in environment variables
- Use strong, unique keys for each POS system
- Rotate keys regularly
- Monitor API usage and rate limits

### Data Privacy
- Sales data is processed in real-time
- No sensitive customer data is stored
- All API calls use HTTPS encryption
- Compliance with POS provider terms

## 📈 Performance Optimization

### **Caching Strategy**
- Analytics results cached for 1 hour
- Sales data cached for 15 minutes
- Recommendations cached for 30 minutes
- Mock data cached indefinitely

### **Rate Limiting**
- Respects POS provider rate limits
- Implements exponential backoff
- Queues requests during peak times
- Graceful degradation when limits exceeded

## 🚨 Troubleshooting

### Common Issues

**"No sales data available"**
- Check API credentials are correct
- Verify date range has sales activity
- Test API connection manually
- Check POS system is generating data

**"Authentication failed"**  
- Verify API tokens are current
- Check token format and headers
- Confirm app permissions in POS system
- Test with POS provider's API explorer

**"Rate limit exceeded"**
- Reduce request frequency
- Implement request queuing
- Use longer cache periods
- Contact POS provider for limit increase

**"Data format errors"**
- Check POS API documentation
- Update transformation methods
- Handle missing fields gracefully
- Add data validation

## 🔄 Custom POS Integration

To add a new POS system:

1. **Add Configuration**
```python
"your_pos": {
    "id": "your_pos",
    "name": "Your POS System", 
    "integration_type": "api",
    "api_config": {
        "base_url": "https://api.yourpos.com",
        "api_key": os.getenv("YOUR_POS_API_KEY"),
        "endpoints": {
            "sales": "/sales",
            "orders": "/orders"
        }
    }
}
```

2. **Add Environment Variables**
```bash
YOUR_POS_API_KEY=your-api-key
YOUR_POS_API_URL=https://api.yourpos.com
```

3. **Create Transformation Methods**
```python
def _transform_your_pos_sales_data(self, data):
    # Transform your POS data format to standard format
    return transformed_data
```

4. **Test Integration**
```bash
python -c "
from app.services.pos_api_service import test_pos_connection
import asyncio
asyncio.run(test_pos_connection('your_pos'))
"
```

## 📞 Support

### Documentation
- POS Provider API docs
- Integration examples in code
- Error handling guidelines
- Performance best practices

### Testing Resources
- Mock data endpoints
- API testing tools
- Connection validators
- Sample requests/responses

Your POS integration is now ready to provide real-time sales insights and AI-powered ordering recommendations! 🚀