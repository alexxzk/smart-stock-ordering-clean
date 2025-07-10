from typing import Dict, Any, Optional
import os

class SupplierConfig:
    """Configuration for custom supplier APIs"""
    
    SUPPLIERS = {
        # Example 1: REST API Integration
        "custom_supplier_1": {
            "id": "custom_supplier_1",
            "name": "Your Custom Supplier",
            "integration_type": "api",
            "api_config": {
                "base_url": os.getenv("CUSTOM_SUPPLIER_API_URL", "https://api.yourcustomsupplier.com/v1"),
                "api_key": os.getenv("CUSTOM_SUPPLIER_API_KEY"),
                "auth_header": "Authorization",  # Common: "Authorization", "X-API-Key", "X-Auth-Token"
                "auth_prefix": "Bearer ",  # Common: "Bearer ", "Token ", ""
                "endpoints": {
                    "catalog": "/products",
                    "pricing": "/pricing/bulk",
                    "orders": "/orders",
                    "order_status": "/orders/{order_id}/status"
                },
                "timeout": 30,
                "retry_attempts": 3
            },
            "features": ["Real-time Pricing", "Order Placement", "Inventory Sync", "Order Tracking"],
            "contact": {
                "email": "api-support@yourcustomsupplier.com",
                "phone": "+1-555-0123",
                "website": "https://yourcustomsupplier.com",
                "documentation": "https://docs.yourcustomsupplier.com/api"
            },
            "business_info": {
                "minimum_order": 100.00,
                "currency": "USD",
                "payment_terms": "Net 30",
                "delivery_schedule": "2-3 business days"
            }
        },
        
        # Example 2: Webhook Integration  
        "webhook_supplier": {
            "id": "webhook_supplier",
            "name": "Webhook-Based Supplier",
            "integration_type": "webhook",
            "api_config": {
                "webhook_url": os.getenv("WEBHOOK_SUPPLIER_URL"),
                "secret_key": os.getenv("WEBHOOK_SUPPLIER_SECRET"),
                "email_orders": True,
                "order_email": "orders@webhooksupplier.com",
                "notification_url": "https://your-app.com/api/webhooks/webhook_supplier"
            },
            "features": ["Email Orders", "Price Lists", "Order Confirmation", "Status Updates"],
            "contact": {
                "email": "support@webhooksupplier.com",
                "phone": "+1-555-0456"
            }
        },
        
        # Example 3: GraphQL API Integration
        "graphql_supplier": {
            "id": "graphql_supplier",
            "name": "GraphQL Supplier",
            "integration_type": "graphql",
            "api_config": {
                "graphql_url": os.getenv("GRAPHQL_SUPPLIER_URL", "https://api.graphqlsupplier.com/graphql"),
                "api_key": os.getenv("GRAPHQL_SUPPLIER_KEY"),
                "auth_header": "Authorization",
                "auth_prefix": "Bearer ",
                "queries": {
                    "pricing": """
                        query GetPricing($items: [String!]!) {
                            pricing(items: $items) {
                                sku
                                name
                                price
                                currency
                                unit
                                availability
                                minimumOrder
                            }
                        }
                    """,
                    "place_order": """
                        mutation PlaceOrder($order: OrderInput!) {
                            placeOrder(input: $order) {
                                orderId
                                status
                                total
                                estimatedDelivery
                            }
                        }
                    """
                }
            },
            "features": ["GraphQL API", "Real-time Data", "Complex Queries"],
            "contact": {
                "email": "dev@graphqlsupplier.com"
            }
        },
        
        # Example 4: SOAP/XML API Integration
        "soap_supplier": {
            "id": "soap_supplier", 
            "name": "SOAP/XML Supplier",
            "integration_type": "soap",
            "api_config": {
                "soap_url": os.getenv("SOAP_SUPPLIER_URL", "https://api.soapsupplier.com/soap"),
                "username": os.getenv("SOAP_SUPPLIER_USER"),
                "password": os.getenv("SOAP_SUPPLIER_PASS"),
                "namespace": "http://schemas.soapsupplier.com/",
                "soap_actions": {
                    "get_pricing": "GetPricing",
                    "place_order": "PlaceOrder",
                    "get_order_status": "GetOrderStatus"
                }
            },
            "features": ["SOAP Integration", "XML Data", "Legacy System Support"],
            "contact": {
                "email": "integration@soapsupplier.com"
            }
        }
    }
    
    @classmethod
    def get_supplier(cls, supplier_id: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific supplier"""
        return cls.SUPPLIERS.get(supplier_id)
    
    @classmethod
    def get_all_suppliers(cls) -> Dict[str, Any]:
        """Get all supplier configurations"""
        return cls.SUPPLIERS
    
    @classmethod
    def get_api_suppliers(cls) -> Dict[str, Any]:
        """Get only API-based suppliers"""
        return {
            supplier_id: supplier 
            for supplier_id, supplier in cls.SUPPLIERS.items() 
            if supplier.get("integration_type") in ["api", "graphql", "soap"]
        }
    
    @classmethod
    def get_active_suppliers(cls) -> Dict[str, Any]:
        """Get suppliers that have valid API configurations"""
        active = {}
        for supplier_id, supplier in cls.SUPPLIERS.items():
            api_config = supplier.get("api_config", {})
            
            # Check if required configuration exists
            if supplier.get("integration_type") == "api":
                if api_config.get("base_url") and api_config.get("api_key"):
                    active[supplier_id] = supplier
            elif supplier.get("integration_type") == "webhook":
                if api_config.get("webhook_url"):
                    active[supplier_id] = supplier
            elif supplier.get("integration_type") == "graphql":
                if api_config.get("graphql_url") and api_config.get("api_key"):
                    active[supplier_id] = supplier
            elif supplier.get("integration_type") == "soap":
                if api_config.get("soap_url"):
                    active[supplier_id] = supplier
        
        return active

# Quick configuration validator
def validate_supplier_config():
    """Validate supplier configurations"""
    issues = []
    
    for supplier_id, supplier in SupplierConfig.SUPPLIERS.items():
        # Check required fields
        if not supplier.get("name"):
            issues.append(f"{supplier_id}: Missing name")
        
        if not supplier.get("integration_type"):
            issues.append(f"{supplier_id}: Missing integration_type")
        
        # Check API-specific requirements
        integration_type = supplier.get("integration_type")
        api_config = supplier.get("api_config", {})
        
        if integration_type == "api":
            if not api_config.get("base_url"):
                issues.append(f"{supplier_id}: Missing base_url for API integration")
        elif integration_type == "graphql":
            if not api_config.get("graphql_url"):
                issues.append(f"{supplier_id}: Missing graphql_url for GraphQL integration")
        elif integration_type == "soap":
            if not api_config.get("soap_url"):
                issues.append(f"{supplier_id}: Missing soap_url for SOAP integration")
    
    return issues

if __name__ == "__main__":
    # Test configuration
    issues = validate_supplier_config()
    if issues:
        print("Configuration issues found:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ Supplier configuration is valid!")
        
    print(f"\nConfigured suppliers: {len(SupplierConfig.SUPPLIERS)}")
    print(f"Active suppliers: {len(SupplierConfig.get_active_suppliers())}")