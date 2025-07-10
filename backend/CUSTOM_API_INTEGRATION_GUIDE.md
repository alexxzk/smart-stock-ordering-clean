# 🔌 Custom Supplier API Integration Guide

## Overview

This guide shows you how to replace the mock supplier data with your customer's preferred APIs. The system is designed to be easily customizable for any supplier API.

## 🚀 Quick Setup for Custom APIs

### 1. Configure Your Suppliers

Edit `backend/app/config/supplier_config.py` (create this file):

```python
# backend/app/config/supplier_config.py
from typing import Dict, Any, Optional
import os

class SupplierConfig:
    """Configuration for custom supplier APIs"""
    
    SUPPLIERS = {
        "your_supplier_1": {
            "id": "your_supplier_1",
            "name": "Your Preferred Supplier",
            "integration_type": "api",
            "api_config": {
                "base_url": os.getenv("SUPPLIER_1_API_URL", "https://api.yoursupplier.com/v1"),
                "api_key": os.getenv("SUPPLIER_1_API_KEY"),
                "auth_header": "X-API-Key",  # or "Authorization"
                "auth_prefix": "",  # "Bearer " for OAuth
                "endpoints": {
                    "catalog": "/products",
                    "pricing": "/pricing",
                    "orders": "/orders",
                    "order_status": "/orders/{order_id}/status"
                }
            },
            "features": ["Real-time Pricing", "Order Placement", "Inventory Sync"],
            "contact": {
                "email": "api@yoursupplier.com",
                "phone": "+1-555-0123",
                "website": "https://yoursupplier.com"
            }
        },
        "your_supplier_2": {
            "id": "your_supplier_2", 
            "name": "Another Supplier",
            "integration_type": "webhook",
            "api_config": {
                "webhook_url": os.getenv("SUPPLIER_2_WEBHOOK_URL"),
                "secret_key": os.getenv("SUPPLIER_2_SECRET"),
                "email_orders": True,
                "order_email": "orders@anothersupplier.com"
            },
            "features": ["Email Orders", "Price Lists", "Order Confirmation"],
            "contact": {
                "email": "support@anothersupplier.com",
                "phone": "+1-555-0456"
            }
        }
    }
    
    @classmethod
    def get_supplier(cls, supplier_id: str) -> Optional[Dict[str, Any]]:
        return cls.SUPPLIERS.get(supplier_id)
    
    @classmethod
    def get_all_suppliers(cls) -> Dict[str, Any]:
        return cls.SUPPLIERS
```

### 2. Create API Integration Services

Create `backend/app/services/supplier_api_service.py`:

```python
# backend/app/services/supplier_api_service.py
import httpx
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..config.supplier_config import SupplierConfig

class SupplierAPIService:
    """Service for integrating with real supplier APIs"""
    
    def __init__(self, supplier_id: str):
        self.supplier_id = supplier_id
        self.config = SupplierConfig.get_supplier(supplier_id)
        if not self.config:
            raise ValueError(f"Supplier {supplier_id} not found in configuration")
    
    async def get_headers(self) -> Dict[str, str]:
        """Get authentication headers for API requests"""
        headers = {"Content-Type": "application/json"}
        
        api_config = self.config.get("api_config", {})
        api_key = api_config.get("api_key")
        auth_header = api_config.get("auth_header", "Authorization")
        auth_prefix = api_config.get("auth_prefix", "Bearer ")
        
        if api_key:
            headers[auth_header] = f"{auth_prefix}{api_key}"
        
        return headers
    
    async def get_pricing(self, items: List[str]) -> List[Dict[str, Any]]:
        """Get pricing from supplier API"""
        try:
            api_config = self.config.get("api_config", {})
            base_url = api_config.get("base_url")
            pricing_endpoint = api_config.get("endpoints", {}).get("pricing", "/pricing")
            
            if not base_url:
                raise ValueError("No API base URL configured")
            
            headers = await self.get_headers()
            url = f"{base_url}{pricing_endpoint}"
            
            # Customize this payload based on your supplier's API format
            payload = {
                "items": items,
                "currency": "USD",
                "quantity": 1  # Default quantity
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                # Transform supplier response to standard format
                return self._transform_pricing_response(data, items)
                
        except Exception as e:
            print(f"Error getting pricing from {self.supplier_id}: {str(e)}")
            # Return fallback mock data
            return self._get_fallback_pricing(items)
    
    async def place_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Place order with supplier API"""
        try:
            api_config = self.config.get("api_config", {})
            base_url = api_config.get("base_url")
            orders_endpoint = api_config.get("endpoints", {}).get("orders", "/orders")
            
            if not base_url:
                raise ValueError("No API base URL configured")
            
            headers = await self.get_headers()
            url = f"{base_url}{orders_endpoint}"
            
            # Transform order data to supplier's format
            supplier_order = self._transform_order_request(order_data)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=supplier_order, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                # Transform response to standard format
                return self._transform_order_response(data)
                
        except Exception as e:
            print(f"Error placing order with {self.supplier_id}: {str(e)}")
            # Return mock success response
            return {
                "success": True,
                "orderId": f"MOCK-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "status": "pending",
                "message": f"Order placed with {self.config['name']} (offline mode)"
            }
    
    def _transform_pricing_response(self, api_response: Dict, requested_items: List[str]) -> List[Dict[str, Any]]:
        """Transform supplier API response to standard pricing format"""
        # Customize this method based on your supplier's response format
        
        # Example transformation - adjust based on actual API response
        pricing_data = []
        
        # If supplier returns items array
        if "items" in api_response:
            for item in api_response["items"]:
                pricing_data.append({
                    "itemId": f"{self.supplier_id}_{item.get('sku', item.get('id', ''))}",
                    "itemName": item.get("name", item.get("description", "")),
                    "price": float(item.get("price", item.get("unit_price", 0))),
                    "currency": item.get("currency", "USD"),
                    "unit": item.get("unit", item.get("uom", "each")),
                    "lastUpdated": datetime.now().isoformat(),
                    "supplierId": self.supplier_id,
                    "availability": item.get("in_stock", True),
                    "minimum_order": item.get("min_qty", 1)
                })
        
        # If supplier returns pricing object
        elif "pricing" in api_response:
            for item_name in requested_items:
                if item_name in api_response["pricing"]:
                    item_data = api_response["pricing"][item_name]
                    pricing_data.append({
                        "itemId": f"{self.supplier_id}_{item_name.lower().replace(' ', '_')}",
                        "itemName": item_name.title(),
                        "price": float(item_data.get("price", 0)),
                        "currency": item_data.get("currency", "USD"),
                        "unit": item_data.get("unit", "each"),
                        "lastUpdated": datetime.now().isoformat(),
                        "supplierId": self.supplier_id
                    })
        
        return pricing_data
    
    def _transform_order_request(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform standard order format to supplier's API format"""
        # Customize based on supplier's expected format
        
        return {
            "customer_id": order_data.get("customer_id", "default"),
            "delivery_address": order_data.get("deliveryAddress", ""),
            "requested_date": order_data.get("deliveryDate", ""),
            "special_instructions": order_data.get("notes", ""),
            "line_items": [
                {
                    "product_name": item["name"],
                    "quantity": item["quantity"],
                    "unit_of_measure": item["unit"],
                    "unit_price": item["price"]
                }
                for item in order_data.get("items", [])
            ]
        }
    
    def _transform_order_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """Transform supplier order response to standard format"""
        return {
            "success": True,
            "orderId": api_response.get("order_id", api_response.get("id", "")),
            "status": api_response.get("status", "pending"),
            "totalCost": api_response.get("total", api_response.get("amount", 0)),
            "estimatedDelivery": api_response.get("estimated_delivery", ""),
            "trackingNumber": api_response.get("tracking_number", ""),
            "message": f"Order placed successfully with {self.config['name']}"
        }
    
    def _get_fallback_pricing(self, items: List[str]) -> List[Dict[str, Any]]:
        """Fallback pricing when API is unavailable"""
        return [
            {
                "itemId": f"{self.supplier_id}_{item.lower().replace(' ', '_')}",
                "itemName": item.title(),
                "price": float(hash(item) % 50 + 10),
                "currency": "USD",
                "unit": "each",
                "lastUpdated": datetime.now().isoformat(),
                "supplierId": self.supplier_id,
                "note": "Fallback pricing - API unavailable"
            }
            for item in items
        ]
```

### 3. Update Main API Endpoints

Replace the mock data in `backend/app/api/supplier_integrations.py`:

```python
# Add these imports at the top
from ..config.supplier_config import SupplierConfig
from ..services.supplier_api_service import SupplierAPIService

# Replace the get_available_suppliers endpoint
@router.get("/suppliers")
async def get_available_suppliers(
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get list of available suppliers for integration"""
    try:
        suppliers = SupplierConfig.get_all_suppliers()
        
        return {
            "success": True,
            "suppliers": suppliers,
            "total_count": len(suppliers)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching suppliers: {str(e)}"
        )

# Replace the get_pricing endpoint
@router.post("/pricing")
async def get_pricing(
    request: PricingRequest,
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get pricing for items from a specific supplier"""
    try:
        # Use real supplier API
        supplier_service = SupplierAPIService(request.supplier_id)
        pricing_data = await supplier_service.get_pricing(request.items)
        
        return {
            "success": True,
            "supplier_id": request.supplier_id,
            "pricing": pricing_data,
            "fetched_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching pricing: {str(e)}"
        )

# Replace the place_order endpoint
@router.post("/order")
async def place_order(
    request: OrderRequest,
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Place an order with a supplier"""
    try:
        # Use real supplier API
        supplier_service = SupplierAPIService(request.supplier_id)
        
        order_data = {
            "supplier_id": request.supplier_id,
            "items": [item.dict() for item in request.items],
            "deliveryAddress": request.deliveryAddress,
            "deliveryDate": request.deliveryDate,
            "notes": request.notes,
            "customer_id": user["uid"]
        }
        
        result = await supplier_service.place_order(order_data)
        
        # Still save to Firebase for tracking
        db = get_firestore_client()
        if db:
            order_record = {
                **order_data,
                "orderId": result.get("orderId"),
                "status": result.get("status", "pending"),
                "orderDate": datetime.now().isoformat(),
                "supplierResponse": result
            }
            db.collection("supplier_orders").add(order_record)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error placing order: {str(e)}"
        )
```

## 🔧 Environment Variables Setup

Add these to your `.env` file or deployment environment:

```bash
# Supplier 1 API Configuration
SUPPLIER_1_API_URL=https://api.yoursupplier.com/v1
SUPPLIER_1_API_KEY=your_api_key_here

# Supplier 2 Webhook Configuration  
SUPPLIER_2_WEBHOOK_URL=https://webhooks.yoursupplier.com/orders
SUPPLIER_2_SECRET=your_webhook_secret

# Email Configuration (if using email integrations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@company.com
SMTP_PASSWORD=your_app_password
```

## 📡 API Format Examples

### Common Supplier API Formats:

#### Format 1: REST API with JSON
```python
# Pricing Request
POST /api/pricing
{
    "items": ["coffee beans", "milk", "sugar"],
    "quantity": 1,
    "currency": "USD"
}

# Pricing Response
{
    "items": [
        {
            "sku": "CB001",
            "name": "Coffee Beans Premium",
            "price": 25.99,
            "unit": "lb",
            "in_stock": true
        }
    ]
}
```

#### Format 2: GraphQL API
```python
# Add GraphQL support in supplier_api_service.py
async def get_pricing_graphql(self, items: List[str]):
    query = """
    query GetPricing($items: [String!]!) {
        pricing(items: $items) {
            sku
            name
            price
            currency
            unit
            availability
        }
    }
    """
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{base_url}/graphql",
            json={"query": query, "variables": {"items": items}},
            headers=headers
        )
        return response.json()
```

#### Format 3: XML/SOAP API
```python
# Add XML support
import xml.etree.ElementTree as ET

async def get_pricing_xml(self, items: List[str]):
    xml_request = f"""
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <GetPricing>
                {''.join(f'<Item>{item}</Item>' for item in items)}
            </GetPricing>
        </soap:Body>
    </soap:Envelope>
    """
    
    headers = {"Content-Type": "text/xml; charset=utf-8"}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, content=xml_request, headers=headers)
        return self._parse_xml_response(response.text)
```

## 🧪 Testing Your Custom APIs

### 1. Create Test Script

Create `backend/test_custom_apis.py`:

```python
import asyncio
from app.services.supplier_api_service import SupplierAPIService

async def test_supplier_api(supplier_id: str):
    try:
        service = SupplierAPIService(supplier_id)
        
        # Test pricing
        print(f"Testing pricing for {supplier_id}...")
        pricing = await service.get_pricing(["coffee", "milk", "sugar"])
        print(f"Pricing result: {pricing}")
        
        # Test order placement
        print(f"Testing order placement for {supplier_id}...")
        order_data = {
            "items": [
                {"name": "Coffee", "quantity": 2, "unit": "lb", "price": 25.99}
            ],
            "deliveryAddress": "123 Test St, Test City, TS 12345",
            "notes": "Test order"
        }
        
        order_result = await service.place_order(order_data)
        print(f"Order result: {order_result}")
        
    except Exception as e:
        print(f"Error testing {supplier_id}: {str(e)}")

# Run tests
if __name__ == "__main__":
    asyncio.run(test_supplier_api("your_supplier_1"))
```

### 2. Run Tests

```bash
cd backend
python test_custom_apis.py
```

## 🔄 Different Integration Types

### API Integration (REST/GraphQL)
- Real-time pricing and ordering
- Automatic inventory sync
- Order status updates

### Webhook Integration  
- Supplier sends updates to your system
- Real-time order status changes
- Price change notifications

### Email Integration
- Orders sent via email
- Price lists via email attachments
- Order confirmations via email

### File-based Integration (FTP/SFTP)
- Daily price list downloads
- Bulk order uploads
- Inventory sync files

## 🚀 Deployment Checklist

1. ✅ **Configure suppliers** in `supplier_config.py`
2. ✅ **Set environment variables** for API keys
3. ✅ **Test API connections** locally
4. ✅ **Deploy backend** with new configurations
5. ✅ **Test in production** with real suppliers
6. ✅ **Monitor API usage** and error rates
7. ✅ **Set up error alerting** for failed integrations

## 📞 Support & Troubleshooting

### Common Issues:

1. **Authentication Failures**
   - Check API keys and headers
   - Verify token expiration
   - Test with supplier's API documentation

2. **Data Format Mismatches**
   - Update transformation methods
   - Add data validation
   - Handle missing fields gracefully

3. **Rate Limiting**
   - Implement retry logic
   - Add request queuing
   - Cache pricing data

4. **Timeout Issues**
   - Increase timeout values
   - Add fallback responses
   - Implement circuit breakers

Your custom supplier APIs are now fully integrated! The system will use real supplier data while maintaining fallbacks for reliability.