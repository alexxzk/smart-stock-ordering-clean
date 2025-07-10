# 🔧 POS Integration Environment Setup

## Required Environment Variables

### Square POS Integration
```bash
# Square API Configuration
SQUARE_ACCESS_TOKEN=sq0atp-your-production-access-token
SQUARE_APPLICATION_ID=sq0idp-your-application-id  
SQUARE_ENVIRONMENT=production  # or "sandbox" for testing

# Square Sandbox (for testing)
SQUARE_SANDBOX_ACCESS_TOKEN=sq0atp-your-sandbox-token
SQUARE_SANDBOX_APP_ID=sq0idp-your-sandbox-app-id
```

### Shopify POS Integration
```bash
# Shopify API Configuration
SHOPIFY_ACCESS_TOKEN=shpat_your-shopify-access-token
SHOPIFY_SHOP_DOMAIN=your-shop-name  # without .myshopify.com
SHOPIFY_API_KEY=your-shopify-api-key

# Shopify Webhook Configuration (optional)
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
```

### Toast POS Integration (Restaurant)
```bash
# Toast API Configuration
TOAST_CLIENT_ID=your-toast-client-id
TOAST_CLIENT_SECRET=your-toast-client-secret
TOAST_RESTAURANT_GUID=your-restaurant-guid

# Toast OAuth Configuration
TOAST_REDIRECT_URI=https://yourapp.com/auth/toast/callback
TOAST_ENVIRONMENT=production  # or "staging"
```

### Lightspeed POS Integration
```bash
# Lightspeed API Configuration
LIGHTSPEED_API_KEY=your-lightspeed-api-key
LIGHTSPEED_API_SECRET=your-lightspeed-api-secret
LIGHTSPEED_ACCOUNT_ID=your-account-id

# Lightspeed OAuth (if using)
LIGHTSPEED_CLIENT_ID=your-oauth-client-id
LIGHTSPEED_CLIENT_SECRET=your-oauth-client-secret
```

### Clover POS Integration
```bash
# Clover API Configuration  
CLOVER_ACCESS_TOKEN=your-clover-access-token
CLOVER_MERCHANT_ID=your-merchant-id
CLOVER_APP_ID=your-clover-app-id

# Clover Environment
CLOVER_ENVIRONMENT=production  # or "sandbox"
```

### Generic POS API
```bash
# Generic POS Configuration
GENERIC_POS_API_URL=https://api.yourpos.com/v1
GENERIC_POS_API_KEY=your-pos-api-key
GENERIC_POS_AUTH_HEADER=Authorization  # or X-API-Key, etc.
GENERIC_POS_AUTH_PREFIX=Bearer  # or Token, etc.
```

### File-Based Integration
```bash
# CSV/File Import Configuration
POS_CSV_FILE_PATH=/data/sales_data.csv

# FTP Configuration (if using FTP import)
POS_FTP_HOST=ftp.yourpos.com
POS_FTP_USER=your-ftp-username
POS_FTP_PASSWORD=your-ftp-password

# S3 Configuration (if using S3 import)
POS_S3_BUCKET=your-pos-data-bucket
POS_S3_ACCESS_KEY=your-s3-access-key
POS_S3_SECRET_KEY=your-s3-secret-key
```

## 🚀 Deployment Setup

### For Render.com
```yaml
# render.yaml
services:
  - type: web
    name: smart-stock-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      # Square POS
      - key: SQUARE_ACCESS_TOKEN
        value: sq0atp-your-access-token
      - key: SQUARE_APPLICATION_ID
        value: sq0idp-your-application-id
      
      # Shopify POS
      - key: SHOPIFY_ACCESS_TOKEN
        value: shpat_your-token
      - key: SHOPIFY_SHOP_DOMAIN
        value: your-shop-name
      
      # Toast POS
      - key: TOAST_CLIENT_ID
        value: your-toast-client-id
      - key: TOAST_CLIENT_SECRET
        value: your-toast-client-secret
```

### For Vercel
```bash
# Set environment variables via Vercel CLI
vercel env add SQUARE_ACCESS_TOKEN
vercel env add SQUARE_APPLICATION_ID
vercel env add SHOPIFY_ACCESS_TOKEN
vercel env add SHOPIFY_SHOP_DOMAIN
vercel env add TOAST_CLIENT_ID
vercel env add TOAST_CLIENT_SECRET

# Or via Vercel Dashboard
# Go to Project Settings -> Environment Variables
```

### For Docker
```dockerfile
# Dockerfile environment
ENV SQUARE_ACCESS_TOKEN=sq0atp-your-token
ENV SQUARE_APPLICATION_ID=sq0idp-your-app-id
ENV SHOPIFY_ACCESS_TOKEN=shpat_your-token
ENV SHOPIFY_SHOP_DOMAIN=your-shop-name

# Or use docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    environment:
      - SQUARE_ACCESS_TOKEN=sq0atp-your-token
      - SQUARE_APPLICATION_ID=sq0idp-your-app-id
      - SHOPIFY_ACCESS_TOKEN=shpat_your-token
      - SHOPIFY_SHOP_DOMAIN=your-shop-name
```

### For Heroku
```bash
# Set environment variables via Heroku CLI
heroku config:set SQUARE_ACCESS_TOKEN=sq0atp-your-token
heroku config:set SQUARE_APPLICATION_ID=sq0idp-your-app-id
heroku config:set SHOPIFY_ACCESS_TOKEN=shpat_your-token
heroku config:set SHOPIFY_SHOP_DOMAIN=your-shop-name
heroku config:set TOAST_CLIENT_ID=your-toast-client-id
heroku config:set TOAST_CLIENT_SECRET=your-toast-client-secret
```

## 🧪 Testing Environment Variables

### Test Script
Create `backend/test_pos_env.py`:

```python
import os
from app.config.pos_config import POSConfig, validate_pos_config

def test_environment():
    """Test POS environment configuration"""
    print("🧪 Testing POS Environment Variables\n")
    
    # Test Square configuration
    print("📊 Square POS:")
    print(f"  Access Token: {'✅ Set' if os.getenv('SQUARE_ACCESS_TOKEN') else '❌ Missing'}")
    print(f"  Application ID: {'✅ Set' if os.getenv('SQUARE_APPLICATION_ID') else '❌ Missing'}")
    print(f"  Environment: {os.getenv('SQUARE_ENVIRONMENT', 'production')}")
    
    # Test Shopify configuration  
    print("\n🛍️ Shopify POS:")
    print(f"  Access Token: {'✅ Set' if os.getenv('SHOPIFY_ACCESS_TOKEN') else '❌ Missing'}")
    print(f"  Shop Domain: {'✅ Set' if os.getenv('SHOPIFY_SHOP_DOMAIN') else '❌ Missing'}")
    
    # Test Toast configuration
    print("\n🍞 Toast POS:")
    print(f"  Client ID: {'✅ Set' if os.getenv('TOAST_CLIENT_ID') else '❌ Missing'}")
    print(f"  Client Secret: {'✅ Set' if os.getenv('TOAST_CLIENT_SECRET') else '❌ Missing'}")
    print(f"  Restaurant GUID: {'✅ Set' if os.getenv('TOAST_RESTAURANT_GUID') else '❌ Missing'}")
    
    # Test Generic POS
    print("\n🔧 Generic POS:")
    print(f"  API URL: {'✅ Set' if os.getenv('GENERIC_POS_API_URL') else '❌ Missing'}")
    print(f"  API Key: {'✅ Set' if os.getenv('GENERIC_POS_API_KEY') else '❌ Missing'}")
    
    # Validate configuration
    print("\n🔍 Configuration Validation:")
    issues = validate_pos_config()
    if issues:
        print("  Issues found:")
        for issue in issues:
            print(f"    ❌ {issue}")
    else:
        print("  ✅ All configurations valid!")
    
    # Test active systems
    print("\n⚡ Active POS Systems:")
    active_systems = POSConfig.get_active_pos_systems()
    for pos_id, system in active_systems.items():
        print(f"  ✅ {system['name']} ({pos_id})")
    
    print(f"\nTotal active systems: {len(active_systems)}")

if __name__ == "__main__":
    test_environment()
```

### Run the test:
```bash
cd backend
python test_pos_env.py
```

## 🔒 API Key Setup Instructions

### Square POS Setup
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application or select existing
3. Get your **Application ID** from app overview  
4. Generate **Access Token** from OAuth tab
5. Set webhook endpoints (optional)

### Shopify POS Setup
1. Go to your Shopify Admin
2. Navigate to Apps → Develop apps
3. Create a new app or select existing
4. Configure API access scopes: `read_orders`, `read_products`, `read_inventory`
5. Generate **Access Token**
6. Note your **Shop Domain** (without .myshopify.com)

### Toast POS Setup
1. Contact Toast support for API access
2. Create developer account on Toast platform
3. Register your application
4. Get **Client ID** and **Client Secret**
5. Configure OAuth redirect URI
6. Get **Restaurant GUID** from account settings

### Lightspeed Setup
1. Go to [Lightspeed Developer Portal](https://developers.lightspeedhq.com)
2. Create an application
3. Get **API Key** and **API Secret**
4. Find your **Account ID** in Lightspeed admin
5. Configure OAuth (if needed)

### Clover Setup
1. Go to [Clover Developer Dashboard](https://www.clover.com/developers)
2. Create a new app
3. Configure permissions: Orders, Inventory, Payments
4. Generate **Access Token**
5. Get **Merchant ID** from account

## 🔧 Local Development Setup

### .env file for local development:
```bash
# .env file in backend directory
# Square POS (Sandbox)
SQUARE_ACCESS_TOKEN=sq0atp-sandbox-token
SQUARE_APPLICATION_ID=sq0idp-sandbox-app-id
SQUARE_ENVIRONMENT=sandbox

# Shopify POS (Development)
SHOPIFY_ACCESS_TOKEN=shpat_dev-token
SHOPIFY_SHOP_DOMAIN=your-dev-shop

# Development flags
DEV_MODE=true
DEBUG=true
```

### Production Environment Checklist
- [ ] All API tokens are production tokens (not sandbox/dev)
- [ ] Environment variables are set in deployment platform
- [ ] API rate limits are configured appropriately
- [ ] Webhook endpoints are configured (if applicable)
- [ ] SSL certificates are valid for webhook URLs
- [ ] Firewall allows outbound connections to POS APIs
- [ ] Database connections are configured
- [ ] Monitoring and logging are enabled

## 🚨 Security Best Practices

### API Key Security
- Never commit API keys to version control
- Use environment variables for all secrets
- Rotate API keys regularly (quarterly recommended)
- Use least-privilege access (minimum required permissions)
- Monitor API usage for unusual activity

### Network Security
- Use HTTPS for all API communications
- Implement rate limiting and request throttling
- Validate all incoming webhook payloads
- Use IP allowlisting where supported
- Implement proper error handling (don't expose sensitive info)

### Data Privacy
- Only request necessary data scopes
- Implement data retention policies
- Follow PCI DSS guidelines for payment data
- Comply with GDPR/CCPA for customer data
- Audit data access and usage regularly

## 📊 Monitoring & Alerts

### Key Metrics to Monitor
- API response times
- Error rates by POS system
- Data freshness (last successful sync)
- Rate limit usage
- Failed authentication attempts

### Recommended Alerts
- POS API connection failures
- High error rates (>5%)
- Rate limit approaching (>80%)
- Data sync delays (>1 hour)
- Authentication failures

### Monitoring Tools
```python
# Example monitoring configuration
MONITORING_CONFIG = {
    "api_timeout": 30,  # seconds
    "max_retries": 3,
    "alert_error_rate": 0.05,  # 5%
    "alert_response_time": 5000,  # 5 seconds
    "data_freshness_threshold": 3600  # 1 hour
}
```

Your POS integration environment is now properly configured for production use! 🚀