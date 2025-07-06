# 🚀 Quick API Setup - Add Your Custom Supplier in 5 Steps

## Step 1: Add Your Supplier Configuration

Edit `backend/app/config/supplier_config.py` and replace `"custom_supplier_1"` with your actual supplier:

```python
"your_supplier_name": {
    "id": "your_supplier_name",
    "name": "Your Actual Supplier Name",
    "integration_type": "api",
    "api_config": {
        "base_url": "https://api.youractualsupplier.com/v1",  # Your supplier's API URL
        "api_key": os.getenv("YOUR_SUPPLIER_API_KEY"),         # Your API key
        "auth_header": "Authorization",                        # How they want the auth header
        "auth_prefix": "Bearer ",                              # Prefix for the token
        "endpoints": {
            "pricing": "/get-prices",                          # Their pricing endpoint
            "orders": "/place-order",                          # Their order endpoint
        }
    },
    "features": ["Real-time Pricing", "Order Placement"],
}
```

## Step 2: Set Environment Variables

Add to your `.env` file or deployment environment:

```bash
YOUR_SUPPLIER_API_KEY=your_actual_api_key_here
```

## Step 3: Test Your API Connection

Create `backend/test_my_api.py`:

```python
import asyncio
import os
from app.config.supplier_config import SupplierConfig

async def test_my_supplier():
    supplier = SupplierConfig.get_supplier("your_supplier_name")
    print(f"Testing connection to: {supplier['name']}")
    print(f"API URL: {supplier['api_config']['base_url']}")
    print(f"API Key configured: {'✅' if os.getenv('YOUR_SUPPLIER_API_KEY') else '❌'}")

if __name__ == "__main__":
    asyncio.run(test_my_supplier())
```

Run: `cd backend && python test_my_api.py`

## Step 4: Customize Data Transformation

Update the transformation methods in `backend/app/services/supplier_api_service.py` to match your supplier's response format:

```python
def _transform_pricing_response(self, api_response: Dict, requested_items: List[str]) -> List[Dict[str, Any]]:
    """Transform YOUR supplier's response format"""
    pricing_data = []
    
    # Example: If your supplier returns this format:
    # {"products": [{"product_name": "Coffee", "current_price": 25.99, "unit": "lb"}]}
    
    if "products" in api_response:
        for item in api_response["products"]:
            pricing_data.append({
                "itemId": f"{self.supplier_id}_{item.get('product_id', '')}",
                "itemName": item.get("product_name", ""),
                "price": float(item.get("current_price", 0)),
                "currency": item.get("currency", "USD"),
                "unit": item.get("unit", "each"),
                "lastUpdated": datetime.now().isoformat(),
                "supplierId": self.supplier_id
            })
    
    return pricing_data
```

## Step 5: Deploy and Test

1. **Deploy your changes**:
   ```bash
   git add .
   git commit -m "Add custom supplier API integration"
   git push
   ```

2. **Test in your app**:
   - Go to `/supplier-integrations`
   - You should see your custom supplier
   - Click it and test pricing/ordering

## 🔧 Common API Formats & Examples

### Format 1: Simple REST API
```python
# Your API call looks like:
POST https://api.yoursupplier.com/pricing
Headers: {"Authorization": "Bearer YOUR_API_KEY"}
Body: {"items": ["coffee", "milk"]}

# Response:
{
    "data": [
        {"name": "coffee", "price": 25.99, "unit": "lb"},
        {"name": "milk", "price": 4.50, "unit": "gallon"}
    ]
}
```

**Transformation:**
```python
if "data" in api_response:
    for item in api_response["data"]:
        pricing_data.append({
            "itemName": item["name"],
            "price": item["price"],
            "unit": item["unit"],
            # ... other fields
        })
```

### Format 2: Nested JSON Response
```python
# Response:
{
    "status": "success",
    "pricing": {
        "coffee": {"price": 25.99, "currency": "USD", "available": true},
        "milk": {"price": 4.50, "currency": "USD", "available": true}
    }
}
```

**Transformation:**
```python
if "pricing" in api_response:
    for item_name, item_data in api_response["pricing"].items():
        pricing_data.append({
            "itemName": item_name,
            "price": item_data["price"],
            "currency": item_data["currency"],
            # ... other fields
        })
```

### Format 3: Array with SKUs
```python
# Response:
{
    "products": [
        {"sku": "COFFEE001", "description": "Premium Coffee", "unit_price": 25.99},
        {"sku": "MILK001", "description": "Whole Milk", "unit_price": 4.50}
    ]
}
```

**Transformation:**
```python
if "products" in api_response:
    for product in api_response["products"]:
        pricing_data.append({
            "itemId": product["sku"],
            "itemName": product["description"],
            "price": product["unit_price"],
            # ... other fields
        })
```

## ⚡ Quick Troubleshooting

### Issue: "Supplier not found"
**Fix:** Check your supplier ID matches exactly in the config file.

### Issue: "API connection failed"  
**Fix:** 
1. Check API URL is correct
2. Verify API key is set in environment variables
3. Test API directly with curl/Postman first

### Issue: "No pricing data returned"
**Fix:** Check the `_transform_pricing_response` method matches your API's response format.

### Issue: "Authentication failed"
**Fix:** Check:
- `auth_header` (usually "Authorization" or "X-API-Key")
- `auth_prefix` (usually "Bearer " or empty "")
- API key format

## 📞 Need Help?

1. **Check API documentation** from your supplier
2. **Test API directly** with curl or Postman first
3. **Compare response format** with transformation examples above
4. **Use mock data** as fallback while testing

## ✅ Success Checklist

- [ ] Supplier added to config file
- [ ] Environment variables set
- [ ] API connection tested
- [ ] Data transformation customized
- [ ] Deployed and working in UI
- [ ] Real orders can be placed

Your custom supplier API is now integrated! 🎉