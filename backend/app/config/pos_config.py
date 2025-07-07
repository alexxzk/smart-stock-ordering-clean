from typing import Dict, Any, Optional
import os

class POSConfig:
    """Configuration for POS system integrations to get sales data"""
    
    POS_SYSTEMS = {
        # Square POS Integration
        "square": {
            "id": "square",
            "name": "Square POS",
            "integration_type": "api",
            "api_config": {
                "base_url": "https://connect.squareup.com/v2",
                "access_token": os.getenv("SQUARE_ACCESS_TOKEN"),
                "application_id": os.getenv("SQUARE_APPLICATION_ID"),
                "environment": os.getenv("SQUARE_ENVIRONMENT", "production"),  # or "sandbox"
                "auth_header": "Authorization",
                "auth_prefix": "Bearer ",
                "endpoints": {
                    "orders": "/orders/search",
                    "payments": "/payments",
                    "items": "/catalog/list",
                    "locations": "/locations",
                    "inventory": "/inventory/counts"
                },
                "timeout": 30
            },
            "features": ["Sales Analytics", "Item Performance", "Inventory Tracking", "Revenue Reports"],
            "contact": {
                "website": "https://developer.squareup.com",
                "documentation": "https://developer.squareup.com/docs"
            }
        },
        
        # Shopify POS Integration
        "shopify_pos": {
            "id": "shopify_pos",
            "name": "Shopify POS",
            "integration_type": "api",
            "api_config": {
                "base_url": "https://{shop}.myshopify.com/admin/api/2023-10",
                "shop_domain": os.getenv("SHOPIFY_SHOP_DOMAIN"),
                "access_token": os.getenv("SHOPIFY_ACCESS_TOKEN"),
                "api_key": os.getenv("SHOPIFY_API_KEY"),
                "auth_header": "X-Shopify-Access-Token",
                "auth_prefix": "",
                "endpoints": {
                    "orders": "/orders.json",
                    "products": "/products.json",
                    "inventory": "/inventory_levels.json",
                    "reports": "/reports.json",
                    "analytics": "/analytics/reports"
                }
            },
            "features": ["Order Analytics", "Product Performance", "Inventory Sync", "Customer Analytics"],
            "contact": {
                "website": "https://shopify.dev",
                "documentation": "https://shopify.dev/docs/admin-api/rest/reference"
            }
        },
        
        # Toast POS Integration (Restaurant)
        "toast": {
            "id": "toast",
            "name": "Toast POS",
            "integration_type": "api",
            "api_config": {
                "base_url": "https://api.toasttab.com",
                "client_id": os.getenv("TOAST_CLIENT_ID"),
                "client_secret": os.getenv("TOAST_CLIENT_SECRET"),
                "restaurant_guid": os.getenv("TOAST_RESTAURANT_GUID"),
                "auth_header": "Authorization",
                "auth_prefix": "Bearer ",
                "endpoints": {
                    "orders": "/orders/v2/orders",
                    "menu": "/config/v2/menuItems",
                    "sales": "/reporting/v1/reports",
                    "inventory": "/stock/v1/inventory"
                }
            },
            "features": ["Order Analytics", "Menu Performance", "Sales Reports", "Inventory Management"],
            "contact": {
                "website": "https://doc.toasttab.com",
                "documentation": "https://doc.toasttab.com/openapi/orders/operation/ordersGet/"
            }
        },
        
        # Lightspeed POS Integration
        "lightspeed": {
            "id": "lightspeed",
            "name": "Lightspeed POS",
            "integration_type": "api",
            "api_config": {
                "base_url": "https://api.lightspeedapp.com/API/Account/{account_id}",
                "account_id": os.getenv("LIGHTSPEED_ACCOUNT_ID"),
                "api_key": os.getenv("LIGHTSPEED_API_KEY"),
                "api_secret": os.getenv("LIGHTSPEED_API_SECRET"),
                "auth_header": "Authorization",
                "auth_prefix": "Basic ",
                "endpoints": {
                    "sales": "/Sale.json",
                    "items": "/Item.json",
                    "inventory": "/ItemShop.json",
                    "customers": "/Customer.json",
                    "reports": "/Report.json"
                }
            },
            "features": ["Sales Analytics", "Item Tracking", "Customer Data", "Inventory Reports"],
            "contact": {
                "website": "https://developers.lightspeedhq.com",
                "documentation": "https://developers.lightspeedhq.com/retail/introduction/introduction/"
            }
        },
        
        # Clover POS Integration
        "clover": {
            "id": "clover",
            "name": "Clover POS",
            "integration_type": "api",
            "api_config": {
                "base_url": "https://api.clover.com/v3/merchants/{merchant_id}",
                "merchant_id": os.getenv("CLOVER_MERCHANT_ID"),
                "access_token": os.getenv("CLOVER_ACCESS_TOKEN"),
                "auth_header": "Authorization",
                "auth_prefix": "Bearer ",
                "endpoints": {
                    "orders": "/orders",
                    "items": "/items",
                    "inventory": "/item_stocks",
                    "payments": "/payments",
                    "reports": "/reports"
                }
            },
            "features": ["Order Management", "Item Analytics", "Payment Processing", "Inventory Sync"],
            "contact": {
                "website": "https://docs.clover.com",
                "documentation": "https://docs.clover.com/docs"
            }
        },
        
        # Generic REST API POS
        "generic_pos": {
            "id": "generic_pos",
            "name": "Generic POS API",
            "integration_type": "api",
            "api_config": {
                "base_url": os.getenv("GENERIC_POS_API_URL"),
                "api_key": os.getenv("GENERIC_POS_API_KEY"),
                "auth_header": os.getenv("GENERIC_POS_AUTH_HEADER", "Authorization"),
                "auth_prefix": os.getenv("GENERIC_POS_AUTH_PREFIX", "Bearer "),
                "endpoints": {
                    "sales": "/sales",
                    "transactions": "/transactions",
                    "products": "/products",
                    "inventory": "/inventory",
                    "analytics": "/analytics"
                }
            },
            "features": ["Custom Integration", "Sales Data", "Product Analytics", "Flexible API"],
            "contact": {
                "email": "support@yourpos.com"
            }
        },
        
        # CSV File Import (for manual data)
        "csv_import": {
            "id": "csv_import",
            "name": "CSV File Import",
            "integration_type": "file",
            "api_config": {
                "file_path": os.getenv("POS_CSV_FILE_PATH", "/data/sales_data.csv"),
                "ftp_host": os.getenv("POS_FTP_HOST"),
                "ftp_user": os.getenv("POS_FTP_USER"),
                "ftp_password": os.getenv("POS_FTP_PASSWORD"),
                "s3_bucket": os.getenv("POS_S3_BUCKET"),
                "update_frequency": "daily",  # hourly, daily, weekly
                "date_format": "%Y-%m-%d %H:%M:%S"
            },
            "features": ["File Import", "Scheduled Updates", "Custom Format", "Legacy Systems"],
            "contact": {
                "email": "support@yourcompany.com"
            }
        }
    }
    
    @classmethod
    def get_pos_system(cls, pos_id: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific POS system"""
        return cls.POS_SYSTEMS.get(pos_id)
    
    @classmethod
    def get_all_pos_systems(cls) -> Dict[str, Any]:
        """Get all POS system configurations"""
        return cls.POS_SYSTEMS
    
    @classmethod
    def get_active_pos_systems(cls) -> Dict[str, Any]:
        """Get POS systems that have valid API configurations"""
        active = {}
        for pos_id, pos_system in cls.POS_SYSTEMS.items():
            api_config = pos_system.get("api_config", {})
            
            if pos_system.get("integration_type") == "api":
                # Check if basic auth configuration exists
                if pos_id == "square":
                    if api_config.get("access_token"):
                        active[pos_id] = pos_system
                elif pos_id == "shopify_pos":
                    if api_config.get("access_token") and api_config.get("shop_domain"):
                        active[pos_id] = pos_system
                elif pos_id == "toast":
                    if api_config.get("client_id") and api_config.get("client_secret"):
                        active[pos_id] = pos_system
                elif pos_id == "lightspeed":
                    if api_config.get("api_key") and api_config.get("account_id"):
                        active[pos_id] = pos_system
                elif pos_id == "clover":
                    if api_config.get("access_token") and api_config.get("merchant_id"):
                        active[pos_id] = pos_system
                elif pos_id == "generic_pos":
                    if api_config.get("base_url") and api_config.get("api_key"):
                        active[pos_id] = pos_system
            elif pos_system.get("integration_type") == "file":
                if api_config.get("file_path") or api_config.get("ftp_host") or api_config.get("s3_bucket"):
                    active[pos_id] = pos_system
        
        return active
    
    @classmethod
    def get_pos_systems_by_type(cls, integration_type: str) -> Dict[str, Any]:
        """Get POS systems by integration type"""
        return {
            pos_id: pos_system 
            for pos_id, pos_system in cls.POS_SYSTEMS.items() 
            if pos_system.get("integration_type") == integration_type
        }

# Quick configuration validator
def validate_pos_config():
    """Validate POS configurations"""
    issues = []
    
    for pos_id, pos_system in POSConfig.POS_SYSTEMS.items():
        # Check required fields
        if not pos_system.get("name"):
            issues.append(f"{pos_id}: Missing name")
        
        if not pos_system.get("integration_type"):
            issues.append(f"{pos_id}: Missing integration_type")
        
        # Check API-specific requirements
        integration_type = pos_system.get("integration_type")
        api_config = pos_system.get("api_config", {})
        
        if integration_type == "api":
            if not api_config.get("base_url") and pos_id != "shopify_pos":
                issues.append(f"{pos_id}: Missing base_url for API integration")
        elif integration_type == "file":
            if not any([api_config.get("file_path"), api_config.get("ftp_host"), api_config.get("s3_bucket")]):
                issues.append(f"{pos_id}: Missing file source configuration")
    
    return issues

if __name__ == "__main__":
    # Test configuration
    issues = validate_pos_config()
    if issues:
        print("Configuration issues found:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ POS configuration is valid!")
        
    print(f"\nConfigured POS systems: {len(POSConfig.POS_SYSTEMS)}")
    print(f"Active POS systems: {len(POSConfig.get_active_pos_systems())}")
    
    # Show available systems
    print("\nAvailable POS Systems:")
    for pos_id, pos_system in POSConfig.POS_SYSTEMS.items():
        print(f"  - {pos_system['name']} ({pos_id})")