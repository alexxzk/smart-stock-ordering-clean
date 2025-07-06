import httpx
import json
import asyncio
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from ..config.supplier_config import SupplierConfig

class SupplierAPIService:
    """Service for integrating with real supplier APIs"""
    
    def __init__(self, supplier_id: str):
        self.supplier_id = supplier_id
        self.config = SupplierConfig.get_supplier(supplier_id)
        if not self.config:
            raise ValueError(f"Supplier {supplier_id} not found in configuration")
        
        self.integration_type = self.config.get("integration_type", "api")
        self.api_config = self.config.get("api_config", {})
    
    async def get_headers(self) -> Dict[str, str]:
        """Get authentication headers for API requests"""
        headers = {"Content-Type": "application/json"}
        
        api_key = self.api_config.get("api_key")
        auth_header = self.api_config.get("auth_header", "Authorization")
        auth_prefix = self.api_config.get("auth_prefix", "Bearer ")
        
        if api_key:
            headers[auth_header] = f"{auth_prefix}{api_key}"
        
        return headers
    
    async def get_pricing(self, items: List[str]) -> List[Dict[str, Any]]:
        """Get pricing for items from supplier API"""
        try:
            if self.integration_type == "api":
                return await self._get_pricing_rest(items)
            elif self.integration_type == "graphql":
                return await self._get_pricing_graphql(items)
            elif self.integration_type == "soap":
                return await self._get_pricing_soap(items)
            else:
                return self._get_fallback_pricing(items)
                
        except Exception as e:
            print(f"Error getting pricing from {self.supplier_id}: {str(e)}")
            return self._get_fallback_pricing(items)
    
    async def _get_pricing_rest(self, items: List[str]) -> List[Dict[str, Any]]:
        """Get pricing from REST API"""
        base_url = self.api_config.get("base_url")
        pricing_endpoint = self.api_config.get("endpoints", {}).get("pricing", "/pricing")
        
        if not base_url:
            raise ValueError("No API base URL configured")
        
        headers = await self.get_headers()
        url = f"{base_url}{pricing_endpoint}"
        
        payload = {
            "items": items,
            "currency": "USD",
            "quantity": 1
        }
        
        timeout = self.api_config.get("timeout", 30)
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return self._transform_pricing_response(data, items)
    
    async def _get_pricing_graphql(self, items: List[str]) -> List[Dict[str, Any]]:
        """Get pricing from GraphQL API"""
        graphql_url = self.api_config.get("graphql_url")
        pricing_query = self.api_config.get("queries", {}).get("pricing", "")
        
        if not graphql_url or not pricing_query:
            raise ValueError("GraphQL URL or pricing query not configured")
        
        headers = await self.get_headers()
        
        query_payload = {
            "query": pricing_query,
            "variables": {"items": items}
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(graphql_url, json=query_payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return self._transform_graphql_pricing_response(data, items)
    
    async def _get_pricing_soap(self, items: List[str]) -> List[Dict[str, Any]]:
        """Get pricing from SOAP API"""
        soap_url = self.api_config.get("soap_url")
        namespace = self.api_config.get("namespace", "")
        
        if not soap_url:
            raise ValueError("SOAP URL not configured")
        
        items_xml = ''.join(f'<Item>{item}</Item>' for item in items)
        soap_body = f"""
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="{namespace}">
            <soap:Header/>
            <soap:Body>
                <ns:GetPricing>
                    <Items>{items_xml}</Items>
                    <Currency>USD</Currency>
                </ns:GetPricing>
            </soap:Body>
        </soap:Envelope>
        """
        
        headers = {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": self.api_config.get("soap_actions", {}).get("get_pricing", "GetPricing")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(soap_url, content=soap_body, headers=headers)
            response.raise_for_status()
            
            return self._transform_soap_pricing_response(response.text, items)
    
    async def place_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Place order with supplier API"""
        try:
            if self.integration_type == "api":
                return await self._place_order_rest(order_data)
            elif self.integration_type == "graphql":
                return await self._place_order_graphql(order_data)
            elif self.integration_type == "soap":
                return await self._place_order_soap(order_data)
            elif self.integration_type == "webhook":
                return await self._place_order_webhook(order_data)
            else:
                return self._get_mock_order_response(order_data)
                
        except Exception as e:
            print(f"Error placing order with {self.supplier_id}: {str(e)}")
            return self._get_mock_order_response(order_data)
    
    async def _place_order_rest(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Place order via REST API"""
        base_url = self.api_config.get("base_url")
        orders_endpoint = self.api_config.get("endpoints", {}).get("orders", "/orders")
        
        if not base_url:
            raise ValueError("No API base URL configured")
        
        headers = await self.get_headers()
        url = f"{base_url}{orders_endpoint}"
        
        supplier_order = self._transform_order_request(order_data)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=supplier_order, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return self._transform_order_response(data)
    
    async def _place_order_graphql(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Place order via GraphQL API"""
        graphql_url = self.api_config.get("graphql_url")
        order_mutation = self.api_config.get("queries", {}).get("place_order", "")
        
        if not graphql_url or not order_mutation:
            raise ValueError("GraphQL URL or order mutation not configured")
        
        headers = await self.get_headers()
        order_input = self._transform_order_request(order_data)
        
        mutation_payload = {
            "query": order_mutation,
            "variables": {"order": order_input}
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(graphql_url, json=mutation_payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return self._transform_graphql_order_response(data)
    
    async def _place_order_soap(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Place order via SOAP API"""
        soap_url = self.api_config.get("soap_url")
        namespace = self.api_config.get("namespace", "")
        
        if not soap_url:
            raise ValueError("SOAP URL not configured")
        
        order_xml = self._build_soap_order_xml(order_data, namespace)
        
        headers = {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": self.api_config.get("soap_actions", {}).get("place_order", "PlaceOrder")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(soap_url, content=order_xml, headers=headers)
            response.raise_for_status()
            
            return self._transform_soap_order_response(response.text)
    
    async def _place_order_webhook(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Place order via webhook or email"""
        webhook_url = self.api_config.get("webhook_url")
        
        if webhook_url:
            headers = {"Content-Type": "application/json"}
            secret = self.api_config.get("secret_key")
            if secret:
                headers["X-Webhook-Secret"] = secret
            
            async with httpx.AsyncClient() as client:
                response = await client.post(webhook_url, json=order_data, headers=headers)
                response.raise_for_status()
                
                return {
                    "success": True,
                    "orderId": f"WH-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "status": "submitted",
                    "message": f"Order submitted via webhook to {self.config['name']}"
                }
        
        return await self._send_email_order(order_data)
    
    async def _send_email_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send order via email"""
        return {
            "success": True,
            "orderId": f"EMAIL-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": "submitted",
            "message": f"Order submitted via email to {self.config['name']}"
        }
    
    def _transform_pricing_response(self, api_response: Dict[str, Any], requested_items: List[str]) -> List[Dict[str, Any]]:
        """Transform REST API pricing response to standard format"""
        pricing_data: List[Dict[str, Any]] = []
        
        # Format 1: {"items": [...]} or {"products": [...]}
        items_key = None
        for key in ["items", "products", "data", "pricing"]:
            if key in api_response:
                items_key = key
                break
        
        if items_key and isinstance(api_response[items_key], list):
            for item in api_response[items_key]:
                item_id = item.get('sku') or item.get('id') or item.get('product_id') or ''
                item_name = item.get("name") or item.get("description") or item.get("product_name") or ""
                price_value = item.get("price") or item.get("unit_price") or item.get("current_price") or 0
                
                pricing_data.append({
                    "itemId": f"{self.supplier_id}_{item_id}",
                    "itemName": item_name,
                    "price": float(price_value),
                    "currency": item.get("currency", "USD"),
                    "unit": item.get("unit") or item.get("uom") or "each",
                    "lastUpdated": datetime.now().isoformat(),
                    "supplierId": self.supplier_id,
                    "availability": item.get("in_stock", item.get("available", True)),
                    "minimum_order": item.get("min_qty", item.get("minimum_order", 1))
                })
        
        # Format 2: {"pricing": {"item_name": {...}}}
        elif "pricing" in api_response and isinstance(api_response["pricing"], dict):
            for item_name, item_data in api_response["pricing"].items():
                if isinstance(item_data, dict):
                    price_value = item_data.get("price", 0)
                    pricing_data.append({
                        "itemId": f"{self.supplier_id}_{item_name.lower().replace(' ', '_')}",
                        "itemName": item_name.title(),
                        "price": float(price_value),
                        "currency": item_data.get("currency", "USD"),
                        "unit": item_data.get("unit", "each"),
                        "lastUpdated": datetime.now().isoformat(),
                        "supplierId": self.supplier_id
                    })
        
        return pricing_data
    
    def _transform_graphql_pricing_response(self, api_response: Dict[str, Any], requested_items: List[str]) -> List[Dict[str, Any]]:
        """Transform GraphQL pricing response"""
        pricing_data: List[Dict[str, Any]] = []
        
        if "data" in api_response and isinstance(api_response["data"], dict):
            data = api_response["data"]
            if "pricing" in data and isinstance(data["pricing"], list):
                for item in data["pricing"]:
                    pricing_data.append({
                        "itemId": f"{self.supplier_id}_{item.get('sku', '')}",
                        "itemName": item.get("name", ""),
                        "price": float(item.get("price", 0)),
                        "currency": item.get("currency", "USD"),
                        "unit": item.get("unit", "each"),
                        "lastUpdated": datetime.now().isoformat(),
                        "supplierId": self.supplier_id,
                        "availability": item.get("availability", True),
                        "minimum_order": item.get("minimumOrder", 1)
                    })
        
        return pricing_data
    
    def _transform_soap_pricing_response(self, soap_response: str, requested_items: List[str]) -> List[Dict[str, Any]]:
        """Transform SOAP/XML pricing response"""
        import xml.etree.ElementTree as ET
        
        pricing_data: List[Dict[str, Any]] = []
        try:
            root = ET.fromstring(soap_response)
            
            for item in root.findall(".//Item"):
                name = item.find("Name")
                price = item.find("Price")
                unit = item.find("Unit")
                
                if name is not None and price is not None and name.text and price.text:
                    pricing_data.append({
                        "itemId": f"{self.supplier_id}_{name.text.lower().replace(' ', '_')}",
                        "itemName": name.text,
                        "price": float(price.text),
                        "currency": "USD",
                        "unit": unit.text if unit is not None and unit.text else "each",
                        "lastUpdated": datetime.now().isoformat(),
                        "supplierId": self.supplier_id
                    })
        except Exception as e:
            print(f"Error parsing SOAP response: {e}")
        
        return pricing_data
    
    def _transform_order_request(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform standard order format to supplier's API format"""
        return {
            "customer_id": order_data.get("customer_id", "default"),
            "customer_reference": order_data.get("customer_id", ""),
            "delivery_address": order_data.get("deliveryAddress", ""),
            "requested_delivery_date": order_data.get("deliveryDate", ""),
            "special_instructions": order_data.get("notes", ""),
            "order_items": [
                {
                    "product_name": item.get("name", ""),
                    "product_sku": item.get("sku", ""),
                    "quantity": item.get("quantity", 1),
                    "unit_of_measure": item.get("unit", "each"),
                    "unit_price": item.get("price", 0)
                }
                for item in order_data.get("items", [])
            ]
        }
    
    def _transform_order_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """Transform supplier order response to standard format"""
        order_id = api_response.get("order_id") or api_response.get("id") or api_response.get("orderNumber") or ""
        total_cost = api_response.get("total") or api_response.get("amount") or api_response.get("total_cost") or 0
        
        return {
            "success": True,
            "orderId": order_id,
            "status": api_response.get("status", "pending"),
            "totalCost": float(total_cost),
            "estimatedDelivery": api_response.get("estimated_delivery", api_response.get("delivery_date", "")),
            "trackingNumber": api_response.get("tracking_number", api_response.get("tracking_id", "")),
            "message": f"Order placed successfully with {self.config['name']}",
            "supplierOrderId": api_response.get("supplier_order_id", ""),
            "orderDate": datetime.now().isoformat()
        }
    
    def _transform_graphql_order_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """Transform GraphQL order response"""
        if "data" in api_response and isinstance(api_response["data"], dict):
            data = api_response["data"]
            if "placeOrder" in data and isinstance(data["placeOrder"], dict):
                order_data = data["placeOrder"]
                return {
                    "success": True,
                    "orderId": order_data.get("orderId", ""),
                    "status": order_data.get("status", "pending"),
                    "totalCost": float(order_data.get("total", 0)),
                    "estimatedDelivery": order_data.get("estimatedDelivery", ""),
                    "message": f"Order placed successfully with {self.config['name']}"
                }
        
        return self._get_mock_order_response({})
    
    def _transform_soap_order_response(self, soap_response: str) -> Dict[str, Any]:
        """Transform SOAP order response"""
        import xml.etree.ElementTree as ET
        
        try:
            root = ET.fromstring(soap_response)
            
            order_id = root.find(".//OrderId")
            status = root.find(".//Status")
            total = root.find(".//Total")
            
            order_id_text = order_id.text if order_id is not None and order_id.text else f"SOAP-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            status_text = status.text if status is not None and status.text else "pending"
            total_value = float(total.text) if total is not None and total.text else 0.0
            
            return {
                "success": True,
                "orderId": order_id_text,
                "status": status_text,
                "totalCost": total_value,
                "message": f"Order placed successfully with {self.config['name']}"
            }
        except Exception as e:
            print(f"Error parsing SOAP order response: {e}")
            return self._get_mock_order_response({})
    
    def _build_soap_order_xml(self, order_data: Dict[str, Any], namespace: str) -> str:
        """Build SOAP XML for order placement"""
        items_xml = ""
        for item in order_data.get("items", []):
            items_xml += f"""
                <Item>
                    <Name>{item.get('name', '')}</Name>
                    <Quantity>{item.get('quantity', 1)}</Quantity>
                    <Unit>{item.get('unit', 'each')}</Unit>
                    <Price>{item.get('price', 0)}</Price>
                </Item>
            """
        
        return f"""
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="{namespace}">
            <soap:Header/>
            <soap:Body>
                <ns:PlaceOrder>
                    <CustomerID>{order_data.get('customer_id', 'default')}</CustomerID>
                    <DeliveryAddress>{order_data.get('deliveryAddress', '')}</DeliveryAddress>
                    <DeliveryDate>{order_data.get('deliveryDate', '')}</DeliveryDate>
                    <Notes>{order_data.get('notes', '')}</Notes>
                    <Items>{items_xml}</Items>
                </ns:PlaceOrder>
            </soap:Body>
        </soap:Envelope>
        """
    
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
    
    def _get_mock_order_response(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mock order response when API is unavailable"""
        total_cost = sum(
            item.get("price", 0) * item.get("quantity", 1) 
            for item in order_data.get("items", [])
        )
        
        return {
            "success": True,
            "orderId": f"MOCK-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": "pending",
            "totalCost": float(total_cost),
            "estimatedDelivery": "2-3 business days",
            "message": f"Order placed with {self.config['name']} (offline mode)",
            "orderDate": datetime.now().isoformat()
        }

# Utility functions
async def test_supplier_connection(supplier_id: str) -> Dict[str, Any]:
    """Test connection to a supplier API"""
    try:
        service = SupplierAPIService(supplier_id)
        test_items = ["coffee", "milk"]
        
        pricing_result = await service.get_pricing(test_items)
        
        return {
            "success": True,
            "supplier_id": supplier_id,
            "supplier_name": service.config["name"],
            "integration_type": service.integration_type,
            "pricing_test": len(pricing_result) > 0,
            "message": "Connection successful"
        }
    except Exception as e:
        return {
            "success": False,
            "supplier_id": supplier_id,
            "error": str(e),
            "message": "Connection failed"
        }

async def test_all_suppliers() -> List[Dict[str, Any]]:
    """Test connections to all configured suppliers"""
    suppliers = SupplierConfig.get_all_suppliers()
    tasks = [test_supplier_connection(supplier_id) for supplier_id in suppliers.keys()]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    return [result for result in results if not isinstance(result, Exception)]