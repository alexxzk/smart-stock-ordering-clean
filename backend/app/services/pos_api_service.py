import httpx
import json
import asyncio
import pandas as pd
import base64
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
from ..config.pos_config import POSConfig

class POSAPIService:
    """Service for integrating with POS systems to get sales data"""
    
    def __init__(self, pos_id: str):
        self.pos_id = pos_id
        self.config = POSConfig.get_pos_system(pos_id)
        if not self.config:
            raise ValueError(f"POS system {pos_id} not found in configuration")
        
        self.integration_type = self.config.get("integration_type", "api")
        self.api_config = self.config.get("api_config", {})
    
    async def get_headers(self) -> Dict[str, str]:
        """Get authentication headers for API requests"""
        headers = {"Content-Type": "application/json"}
        
        if self.pos_id == "square":
            access_token = self.api_config.get("access_token")
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
                headers["Square-Version"] = "2023-10-18"
        
        elif self.pos_id == "shopify_pos":
            access_token = self.api_config.get("access_token")
            if access_token:
                headers["X-Shopify-Access-Token"] = access_token
        
        elif self.pos_id == "toast":
            # Toast uses OAuth2, might need token refresh
            access_token = await self._get_toast_access_token()
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
        
        elif self.pos_id == "lightspeed":
            api_key = self.api_config.get("api_key")
            api_secret = self.api_config.get("api_secret")
            if api_key and api_secret:
                credentials = base64.b64encode(f"{api_key}:{api_secret}".encode()).decode()
                headers["Authorization"] = f"Basic {credentials}"
        
        elif self.pos_id == "clover":
            access_token = self.api_config.get("access_token")
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
        
        elif self.pos_id == "generic_pos":
            api_key = self.api_config.get("api_key")
            auth_header = self.api_config.get("auth_header", "Authorization")
            auth_prefix = self.api_config.get("auth_prefix", "Bearer ")
            if api_key:
                headers[auth_header] = f"{auth_prefix}{api_key}"
        
        return headers
    
    async def get_sales_data(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data for a date range"""
        try:
            if self.integration_type == "api":
                return await self._get_sales_data_api(start_date, end_date)
            elif self.integration_type == "file":
                return await self._get_sales_data_file(start_date, end_date)
            else:
                return self._get_mock_sales_data(start_date, end_date)
                
        except Exception as e:
            print(f"Error getting sales data from {self.pos_id}: {str(e)}")
            return self._get_mock_sales_data(start_date, end_date)
    
    async def _get_sales_data_api(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data from API"""
        if self.pos_id == "square":
            return await self._get_square_sales_data(start_date, end_date)
        elif self.pos_id == "shopify_pos":
            return await self._get_shopify_sales_data(start_date, end_date)
        elif self.pos_id == "toast":
            return await self._get_toast_sales_data(start_date, end_date)
        elif self.pos_id == "lightspeed":
            return await self._get_lightspeed_sales_data(start_date, end_date)
        elif self.pos_id == "clover":
            return await self._get_clover_sales_data(start_date, end_date)
        elif self.pos_id == "generic_pos":
            return await self._get_generic_sales_data(start_date, end_date)
        else:
            return []
    
    async def _get_square_sales_data(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data from Square POS"""
        base_url = self.api_config.get("base_url")
        headers = await self.get_headers()
        
        # Square Orders Search API
        search_query = {
            "filter": {
                "date_time_filter": {
                    "created_at": {
                        "start_at": f"{start_date}T00:00:00Z",
                        "end_at": f"{end_date}T23:59:59Z"
                    }
                },
                "state_filter": {
                    "states": ["COMPLETED"]
                }
            },
            "sort": {
                "sort_field": "CREATED_AT",
                "sort_order": "DESC"
            },
            "limit": 1000
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/orders/search",
                json={"query": search_query},
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            return self._transform_square_sales_data(data.get("orders", []))
    
    async def _get_shopify_sales_data(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data from Shopify POS"""
        shop_domain = self.api_config.get("shop_domain")
        base_url = f"https://{shop_domain}.myshopify.com/admin/api/2023-10"
        headers = await self.get_headers()
        
        params = {
            "created_at_min": f"{start_date}T00:00:00Z",
            "created_at_max": f"{end_date}T23:59:59Z",
            "status": "any",
            "limit": 250
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/orders.json",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            return self._transform_shopify_sales_data(data.get("orders", []))
    
    async def _get_toast_sales_data(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data from Toast POS"""
        base_url = self.api_config.get("base_url")
        restaurant_guid = self.api_config.get("restaurant_guid")
        headers = await self.get_headers()
        
        params = {
            "startDate": start_date,
            "endDate": end_date,
            "pageSize": 100
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/orders/v2/orders",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            return self._transform_toast_sales_data(data)
    
    async def _get_lightspeed_sales_data(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data from Lightspeed POS"""
        account_id = self.api_config.get("account_id")
        base_url = f"https://api.lightspeedapp.com/API/Account/{account_id}"
        headers = await self.get_headers()
        
        params = {
            "timeStamp": f">{start_date}T00:00:00+00:00,<{end_date}T23:59:59+00:00",
            "load_relations": "SaleLines.Item"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/Sale.json",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            return self._transform_lightspeed_sales_data(data.get("Sale", []))
    
    async def _get_clover_sales_data(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data from Clover POS"""
        merchant_id = self.api_config.get("merchant_id")
        base_url = f"https://api.clover.com/v3/merchants/{merchant_id}"
        headers = await self.get_headers()
        
        # Convert dates to milliseconds
        start_timestamp = int(datetime.fromisoformat(start_date).timestamp() * 1000)
        end_timestamp = int(datetime.fromisoformat(end_date).timestamp() * 1000)
        
        params = {
            "filter": f"createdTime>={start_timestamp} AND createdTime<={end_timestamp}",
            "expand": "lineItems"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/orders",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            return self._transform_clover_sales_data(data.get("elements", []))
    
    async def _get_generic_sales_data(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data from generic POS API"""
        base_url = self.api_config.get("base_url")
        headers = await self.get_headers()
        
        params = {
            "start_date": start_date,
            "end_date": end_date,
            "include_details": "true"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/sales",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            return self._transform_generic_sales_data(data)
    
    async def _get_sales_data_file(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get sales data from file import"""
        # This would implement CSV/file reading logic
        # For now, return mock data
        return self._get_mock_sales_data(start_date, end_date)
    
    async def _get_toast_access_token(self) -> Optional[str]:
        """Get OAuth2 access token for Toast"""
        client_id = self.api_config.get("client_id")
        client_secret = self.api_config.get("client_secret")
        
        if not client_id or not client_secret:
            return None
        
        # Implement OAuth2 token refresh logic here
        # For now, return a placeholder
        return "toast_access_token_placeholder"
    
    def _transform_square_sales_data(self, orders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Square sales data to standard format"""
        sales_data = []
        for order in orders:
            for line_item in order.get("line_items", []):
                sales_data.append({
                    "transaction_id": order.get("id"),
                    "item_name": line_item.get("name", "Unknown Item"),
                    "item_id": line_item.get("catalog_object_id", ""),
                    "quantity": float(line_item.get("quantity", 1)),
                    "unit_price": float(line_item.get("base_price_money", {}).get("amount", 0)) / 100,
                    "total_price": float(line_item.get("total_money", {}).get("amount", 0)) / 100,
                    "currency": line_item.get("total_money", {}).get("currency", "USD"),
                    "sale_date": order.get("created_at", ""),
                    "pos_system": "square",
                    "location_id": order.get("location_id", ""),
                    "customer_id": order.get("customer_id", "")
                })
        return sales_data
    
    def _transform_shopify_sales_data(self, orders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Shopify sales data to standard format"""
        sales_data = []
        for order in orders:
            for line_item in order.get("line_items", []):
                sales_data.append({
                    "transaction_id": order.get("id"),
                    "item_name": line_item.get("name", "Unknown Item"),
                    "item_id": str(line_item.get("product_id", "")),
                    "quantity": float(line_item.get("quantity", 1)),
                    "unit_price": float(line_item.get("price", 0)),
                    "total_price": float(line_item.get("quantity", 1)) * float(line_item.get("price", 0)),
                    "currency": order.get("currency", "USD"),
                    "sale_date": order.get("created_at", ""),
                    "pos_system": "shopify_pos",
                    "location_id": order.get("location_id", ""),
                    "customer_id": str(order.get("customer", {}).get("id", ""))
                })
        return sales_data
    
    def _transform_toast_sales_data(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Transform Toast sales data to standard format"""
        sales_data = []
        for order in data.get("data", []):
            for selection in order.get("selections", []):
                sales_data.append({
                    "transaction_id": order.get("guid"),
                    "item_name": selection.get("item", {}).get("name", "Unknown Item"),
                    "item_id": selection.get("item", {}).get("guid", ""),
                    "quantity": float(selection.get("quantity", 1)),
                    "unit_price": float(selection.get("price", 0)),
                    "total_price": float(selection.get("price", 0)) * float(selection.get("quantity", 1)),
                    "currency": "USD",
                    "sale_date": order.get("date", ""),
                    "pos_system": "toast",
                    "location_id": order.get("restaurantGuid", ""),
                    "customer_id": ""
                })
        return sales_data
    
    def _transform_lightspeed_sales_data(self, sales: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Lightspeed sales data to standard format"""
        sales_data = []
        for sale in sales:
            for line in sale.get("SaleLines", {}).get("SaleLine", []):
                item = line.get("Item", {})
                sales_data.append({
                    "transaction_id": sale.get("saleID"),
                    "item_name": item.get("description", "Unknown Item"),
                    "item_id": str(item.get("itemID", "")),
                    "quantity": float(line.get("unitQuantity", 1)),
                    "unit_price": float(line.get("unitPrice", 0)),
                    "total_price": float(line.get("calcTotal", 0)),
                    "currency": "USD",
                    "sale_date": sale.get("timeStamp", ""),
                    "pos_system": "lightspeed",
                    "location_id": sale.get("shopID", ""),
                    "customer_id": str(sale.get("customerID", ""))
                })
        return sales_data
    
    def _transform_clover_sales_data(self, orders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Clover sales data to standard format"""
        sales_data = []
        for order in orders:
            for line_item in order.get("lineItems", {}).get("elements", []):
                sales_data.append({
                    "transaction_id": order.get("id"),
                    "item_name": line_item.get("name", "Unknown Item"),
                    "item_id": line_item.get("item", {}).get("id", ""),
                    "quantity": float(line_item.get("unitQty", 1)) / 1000,  # Clover uses thousandths
                    "unit_price": float(line_item.get("price", 0)) / 100,  # Clover uses cents
                    "total_price": float(line_item.get("price", 0)) * float(line_item.get("unitQty", 1000)) / 1000 / 100,
                    "currency": "USD",
                    "sale_date": datetime.fromtimestamp(order.get("createdTime", 0) / 1000).isoformat(),
                    "pos_system": "clover",
                    "location_id": order.get("device", {}).get("id", ""),
                    "customer_id": order.get("customer", {}).get("id", "")
                })
        return sales_data
    
    def _transform_generic_sales_data(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Transform generic POS sales data to standard format"""
        sales_data = []
        for sale in data.get("sales", []):
            sales_data.append({
                "transaction_id": sale.get("id", sale.get("transaction_id", "")),
                "item_name": sale.get("item_name", sale.get("product_name", "Unknown Item")),
                "item_id": str(sale.get("item_id", sale.get("product_id", ""))),
                "quantity": float(sale.get("quantity", 1)),
                "unit_price": float(sale.get("unit_price", sale.get("price", 0))),
                "total_price": float(sale.get("total", sale.get("amount", 0))),
                "currency": sale.get("currency", "USD"),
                "sale_date": sale.get("date", sale.get("timestamp", "")),
                "pos_system": "generic_pos",
                "location_id": sale.get("location", ""),
                "customer_id": sale.get("customer_id", "")
            })
        return sales_data
    
    def _get_mock_sales_data(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Generate mock sales data for testing"""
        import random
        from datetime import datetime, timedelta
        
        mock_items = [
            "Coffee Beans", "Milk", "Sugar", "Bread", "Cheese", "Tomatoes",
            "Lettuce", "Chicken Breast", "Ground Beef", "Eggs", "Butter", "Rice"
        ]
        
        sales_data = []
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        # Generate 50-200 mock transactions
        num_transactions = random.randint(50, 200)
        
        for i in range(num_transactions):
            # Random date between start and end
            days_diff = (end - start).days
            random_days = random.randint(0, days_diff)
            sale_date = start + timedelta(days=random_days)
            
            # Random item
            item_name = random.choice(mock_items)
            quantity = random.randint(1, 5)
            unit_price = round(random.uniform(2.99, 29.99), 2)
            
            sales_data.append({
                "transaction_id": f"MOCK-{i:06d}",
                "item_name": item_name,
                "item_id": f"item_{item_name.lower().replace(' ', '_')}",
                "quantity": float(quantity),
                "unit_price": unit_price,
                "total_price": round(quantity * unit_price, 2),
                "currency": "USD",
                "sale_date": sale_date.isoformat(),
                "pos_system": self.pos_id,
                "location_id": "mock_location",
                "customer_id": f"customer_{random.randint(1, 100)}"
            })
        
        return sales_data
    
    async def get_sales_analytics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get sales analytics and insights"""
        sales_data = await self.get_sales_data(start_date, end_date)
        
        if not sales_data:
            return {"error": "No sales data available"}
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(sales_data)
        
        # Basic analytics
        total_revenue = df['total_price'].sum()
        total_transactions = len(df['transaction_id'].unique())
        total_items_sold = df['quantity'].sum()
        
        # Top selling items
        top_items = df.groupby('item_name').agg({
            'quantity': 'sum',
            'total_price': 'sum'
        }).sort_values('quantity', ascending=False).head(10)
        
        # Sales by day
        df['date'] = pd.to_datetime(df['sale_date']).dt.date
        daily_sales = df.groupby('date').agg({
            'total_price': 'sum',
            'quantity': 'sum'
        }).to_dict('index')
        
        # Average transaction value
        transaction_values = df.groupby('transaction_id')['total_price'].sum()
        avg_transaction_value = transaction_values.mean()
        
        return {
            "summary": {
                "total_revenue": round(total_revenue, 2),
                "total_transactions": total_transactions,
                "total_items_sold": int(total_items_sold),
                "average_transaction_value": round(avg_transaction_value, 2),
                "date_range": f"{start_date} to {end_date}"
            },
            "top_selling_items": [
                {
                    "item_name": item,
                    "quantity_sold": int(data['quantity']),
                    "revenue": round(data['total_price'], 2)
                }
                for item, data in top_items.iterrows()
            ],
            "daily_sales": {
                str(date): {
                    "revenue": round(data['total_price'], 2),
                    "items_sold": int(data['quantity'])
                }
                for date, data in daily_sales.items()
            },
            "pos_system": self.pos_id
        }
    
    async def get_ordering_recommendations(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get ordering recommendations based on sales data"""
        sales_data = await self.get_sales_data(start_date, end_date)
        
        if not sales_data:
            return []
        
        df = pd.DataFrame(sales_data)
        
        # Calculate recommendations
        item_stats = df.groupby('item_name').agg({
            'quantity': ['sum', 'mean', 'std'],
            'total_price': 'sum'
        }).round(2)
        
        recommendations = []
        for item_name, stats in item_stats.iterrows():
            total_sold = stats[('quantity', 'sum')]
            avg_daily = stats[('quantity', 'mean')]
            std_dev = stats[('quantity', 'std')] or 0
            
            # Calculate recommended order quantity (safety stock + expected demand)
            days_in_period = (pd.to_datetime(end_date) - pd.to_datetime(start_date)).days + 1
            daily_avg = total_sold / days_in_period
            
            # Recommend for next 7 days with safety stock
            recommended_qty = int((daily_avg * 7) + (std_dev * 2))
            
            recommendations.append({
                "item_name": item_name,
                "current_sales_velocity": round(daily_avg, 2),
                "total_sold_in_period": int(total_sold),
                "recommended_order_qty": recommended_qty,
                "urgency": "high" if daily_avg > (avg_daily * 1.5) else "medium" if daily_avg > avg_daily else "low",
                "revenue_impact": round(stats[('total_price', 'sum')], 2)
            })
        
        # Sort by revenue impact descending
        recommendations.sort(key=lambda x: x['revenue_impact'], reverse=True)
        
        return recommendations

# Utility functions
async def test_pos_connection(pos_id: str) -> Dict[str, Any]:
    """Test connection to a POS system"""
    try:
        service = POSAPIService(pos_id)
        
        # Test with last 7 days
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        sales_data = await service.get_sales_data(start_date, end_date)
        
        return {
            "success": True,
            "pos_id": pos_id,
            "pos_name": service.config["name"],
            "integration_type": service.integration_type,
            "sales_records": len(sales_data),
            "message": "Connection successful"
        }
    except Exception as e:
        return {
            "success": False,
            "pos_id": pos_id,
            "error": str(e),
            "message": "Connection failed"
        }

async def test_all_pos_systems() -> List[Dict[str, Any]]:
    """Test connections to all configured POS systems"""
    pos_systems = POSConfig.get_all_pos_systems()
    tasks = [test_pos_connection(pos_id) for pos_id in pos_systems.keys()]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    return [result for result in results if not isinstance(result, Exception)]