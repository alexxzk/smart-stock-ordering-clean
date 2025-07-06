# 🔧 Environment Setup for Custom Supplier APIs

## Required Environment Variables

Add these environment variables to your deployment environment (Render, Vercel, etc.) or `.env` file:

### Custom Supplier API Keys
```bash
# Replace with your actual supplier API configurations
CUSTOM_SUPPLIER_API_URL=https://api.youractualsupplier.com/v1
CUSTOM_SUPPLIER_API_KEY=your_actual_api_key_here

# Additional suppliers
SUPPLIER_2_API_URL=https://api.supplier2.com/v1
SUPPLIER_2_API_KEY=your_second_api_key

# GraphQL Supplier
GRAPHQL_SUPPLIER_URL=https://graphql.supplier.com/graphql
GRAPHQL_SUPPLIER_KEY=your_graphql_api_key

# SOAP Supplier
SOAP_SUPPLIER_URL=https://soap.supplier.com/services
SOAP_SUPPLIER_USER=your_soap_username
SOAP_SUPPLIER_PASS=your_soap_password

# Webhook Supplier
WEBHOOK_SUPPLIER_URL=https://webhook.supplier.com/orders
WEBHOOK_SUPPLIER_SECRET=your_webhook_secret
```

### Email Configuration (if using email orders)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@company.com
SMTP_PASSWORD=your_app_password
```

### Firebase Configuration
```bash
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PROJECT_ID=your_firebase_project_id
```

## Quick Test Command

Test your supplier configuration:

```bash
cd backend
python -c "
from app.config.supplier_config import SupplierConfig, validate_supplier_config
from app.services.supplier_api_service import test_all_suppliers
import asyncio
import os

# Check configuration
issues = validate_supplier_config()
if issues:
    print('Configuration Issues:')
    for issue in issues: print(f'  - {issue}')
else:
    print('✅ Configuration valid')

# Check environment variables
print(f'API Key configured: {\"✅\" if os.getenv(\"CUSTOM_SUPPLIER_API_KEY\") else \"❌\"}')

# Test connections
async def test():
    results = await test_all_suppliers()
    for result in results:
        status = '✅' if result['success'] else '❌'
        print(f'{status} {result[\"supplier_id\"]}: {result[\"message\"]}')

asyncio.run(test())
"
```

## Deployment Commands

### For Render
```bash
# Set environment variables in Render dashboard
# Or use render.yaml:
services:
  - type: web
    name: backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: CUSTOM_SUPPLIER_API_KEY
        value: your_actual_api_key_here
      - key: CUSTOM_SUPPLIER_API_URL  
        value: https://api.youractualsupplier.com/v1
```

### For Vercel
```bash
# Set via Vercel CLI
vercel env add CUSTOM_SUPPLIER_API_KEY
vercel env add CUSTOM_SUPPLIER_API_URL
```

### For Docker
```bash
# Add to docker-compose.yml
environment:
  - CUSTOM_SUPPLIER_API_KEY=your_actual_api_key_here
  - CUSTOM_SUPPLIER_API_URL=https://api.youractualsupplier.com/v1
```

## Testing Your Custom API

### 1. Test Configuration
```bash
cd backend
python -m app.config.supplier_config
```

### 2. Test Individual Supplier
```bash
python -c "
import asyncio
from app.services.supplier_api_service import test_supplier_connection

async def test():
    result = await test_supplier_connection('your_supplier_name')
    print(f'Test result: {result}')

asyncio.run(test())
"
```

### 3. Test Pricing API
```bash
python -c "
import asyncio
from app.services.supplier_api_service import SupplierAPIService

async def test():
    service = SupplierAPIService('your_supplier_name')
    pricing = await service.get_pricing(['coffee', 'milk'])
    print(f'Pricing data: {pricing}')

asyncio.run(test())
"
```

## Production Deployment Checklist

- [ ] **Environment variables set** for all suppliers
- [ ] **API keys validated** and working
- [ ] **Endpoints tested** with real API calls
- [ ] **Error handling verified** with invalid keys
- [ ] **Fallback responses** working when APIs are down
- [ ] **Rate limiting** configured if needed
- [ ] **Logging** enabled for API calls
- [ ] **Monitoring** set up for API health

## Common Issues & Solutions

### "Supplier not found" Error
**Fix:** Check supplier ID matches exactly in `supplier_config.py`

### "API connection failed" Error
**Fix:** 
1. Verify API URL is correct
2. Check API key is set in environment
3. Test API with curl first

### "No pricing data" Error
**Fix:** Check `_transform_pricing_response` method matches your API format

### "Authentication failed" Error
**Fix:** Check authentication header format and API key

## Support
- Check API documentation from your supplier
- Test APIs with Postman/curl first
- Compare response formats with examples in the guide
- Use mock data as fallback during development

Your custom supplier APIs are now ready for production! 🚀