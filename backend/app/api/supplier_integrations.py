from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.firebase_init import get_firestore_client

router = APIRouter()
security = HTTPBearer()

# Pydantic models
class IntegrationBase(BaseModel):
    supplier_id: str
    integration_type: str  # "email", "api", "webhook"
    config: Dict
    is_active: bool = True

class IntegrationCreate(IntegrationBase):
    pass

class IntegrationUpdate(BaseModel):
    integration_type: Optional[str] = None
    config: Optional[Dict] = None
    is_active: Optional[bool] = None

class IntegrationResponse(IntegrationBase):
    id: str
    userId: str
    created_at: datetime
    updated_at: datetime
    last_sync: Optional[datetime] = None

# New models for supplier operations
class PricingRequest(BaseModel):
    supplier_id: str
    items: List[str]

class PricingData(BaseModel):
    itemId: str
    itemName: str
    price: float
    currency: str = "USD"
    unit: str
    lastUpdated: str
    supplierId: str

class OrderItem(BaseModel):
    name: str
    quantity: float
    unit: str
    price: float

class OrderRequest(BaseModel):
    supplier_id: str
    items: List[OrderItem]
    deliveryAddress: str
    deliveryDate: Optional[str] = None
    notes: Optional[str] = None

@router.post("/", response_model=IntegrationResponse)
async def create_integration(
    integration: IntegrationCreate,
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Create a new supplier integration"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
            
        integration_data = {
            **integration.dict(),
            "userId": user["uid"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        doc_ref = db.collection("supplier_integrations").add(integration_data)
        
        return {
            "id": doc_ref[1].id,
            **integration_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating integration: {str(e)}"
        )

@router.get("/", response_model=List[IntegrationResponse])
async def get_integrations(
    user: dict = Depends(lambda: {"uid": "test-user"}),  # Placeholder for auth
    supplier_id: Optional[str] = None,
    integration_type: Optional[str] = None
):
    """Get all supplier integrations for the current user"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
            
        integrations_ref = db.collection("supplier_integrations")
        query = integrations_ref.where("userId", "==", user["uid"])
        
        if supplier_id:
            query = query.where("supplier_id", "==", supplier_id)
        
        if integration_type:
            query = query.where("integration_type", "==", integration_type)
        
        docs = query.stream()
        integrations = []
        
        for doc in docs:
            integration_data = doc.to_dict()
            integration_data["id"] = doc.id
            integrations.append(integration_data)
        
        return integrations
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching integrations: {str(e)}"
        )

@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(
    integration_id: str,
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Get a specific supplier integration"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
            
        doc_ref = db.collection("supplier_integrations").document(integration_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        integration_data = doc.to_dict()
        if integration_data["userId"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        integration_data["id"] = doc.id
        return integration_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching integration: {str(e)}"
        )

@router.put("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: str,
    integration_update: IntegrationUpdate,
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Update a supplier integration"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
            
        doc_ref = db.collection("supplier_integrations").document(integration_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        integration_data = doc.to_dict()
        if integration_data["userId"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update only provided fields
        update_data = {k: v for k, v in integration_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now()
        
        doc_ref.update(update_data)
        
        # Get updated document
        updated_doc = doc_ref.get()
        updated_data = updated_doc.to_dict()
        updated_data["id"] = updated_doc.id
        
        return updated_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating integration: {str(e)}"
        )

@router.delete("/{integration_id}")
async def delete_integration(
    integration_id: str,
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Delete a supplier integration"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
            
        doc_ref = db.collection("supplier_integrations").document(integration_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        integration_data = doc.to_dict()
        if integration_data["userId"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        doc_ref.delete()
        
        return {"message": "Integration deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting integration: {str(e)}"
        )

@router.post("/{integration_id}/test")
async def test_integration(
    integration_id: str,
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Test a supplier integration"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
            
        doc_ref = db.collection("supplier_integrations").document(integration_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        integration_data = doc.to_dict()
        if integration_data["userId"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Simulate integration test
        test_result = {
            "integration_id": integration_id,
            "status": "success",
            "message": "Integration test completed successfully",
            "tested_at": datetime.now(),
            "integration_type": integration_data.get("integration_type", "unknown")
        }
        
        return test_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error testing integration: {str(e)}"
        )

@router.post("/{integration_id}/sync")
async def sync_integration(
    integration_id: str,
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Sync data with supplier integration"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
            
        doc_ref = db.collection("supplier_integrations").document(integration_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        integration_data = doc.to_dict()
        if integration_data["userId"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Simulate sync operation
        sync_result = {
            "integration_id": integration_id,
            "status": "success",
            "message": "Data synchronized successfully",
            "synced_at": datetime.now(),
            "records_processed": 0,
            "integration_type": integration_data.get("integration_type", "unknown")
        }
        
        # Update last sync time
        doc_ref.update({"last_sync": datetime.now()})
        
        return sync_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error syncing integration: {str(e)}"
        )

@router.get("/analytics/summary")
async def get_integrations_summary(
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Get summary analytics for integrations"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
            
        integrations_ref = db.collection("supplier_integrations")
        query = integrations_ref.where("userId", "==", user["uid"])
        docs = query.stream()
        
        total_integrations = 0
        active_integrations = 0
        integration_types = {}
        
        for doc in docs:
            total_integrations += 1
            integration_data = doc.to_dict()
            
            if integration_data.get("is_active", False):
                active_integrations += 1
            
            integration_type = integration_data.get("integration_type", "unknown")
            integration_types[integration_type] = integration_types.get(integration_type, 0) + 1
        
        summary = {
            "total_integrations": total_integrations,
            "active_integrations": active_integrations,
            "inactive_integrations": total_integrations - active_integrations,
            "integration_types": integration_types,
            "last_updated": datetime.now()
        }
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching integration summary: {str(e)}"
        )

# NEW ENDPOINTS FOR FRONTEND FUNCTIONALITY

@router.get("/suppliers")
async def get_available_suppliers(
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Get list of available suppliers for integration"""
    try:
        # Mock supplier data - in real implementation, this would come from a database
        suppliers = {
            "sysco": {
                "id": "sysco",
                "name": "Sysco Corporation",
                "integration_type": "api",
                "api_url": "https://api.sysco.com/v1",
                "website_url": "https://www.sysco.com",
                "features": ["Real-time Pricing", "Order Placement", "Delivery Tracking", "Invoice Management"],
                "description": "Leading food service distributor in North America"
            },
            "us_foods": {
                "id": "us_foods",
                "name": "US Foods",
                "integration_type": "api",
                "api_url": "https://api.usfoods.com/v2",
                "website_url": "https://www.usfoods.com",
                "features": ["Real-time Pricing", "Order Placement", "Inventory Sync", "Analytics"],
                "description": "One of America's largest food service distributors"
            },
            "gordon_food": {
                "id": "gordon_food",
                "name": "Gordon Food Service",
                "integration_type": "web_scraping",
                "website_url": "https://www.gfs.com",
                "features": ["Price Lookup", "Product Catalog", "Order History"],
                "description": "Family-owned food service distributor"
            },
            "reinhart": {
                "id": "reinhart",
                "name": "Reinhart FoodService",
                "integration_type": "email",
                "website_url": "https://www.reinhartfoodservice.com",
                "features": ["Email Orders", "Price Lists", "Product Updates"],
                "description": "Regional food service distributor"
            },
            "performance_food": {
                "id": "performance_food",
                "name": "Performance Food Group",
                "integration_type": "api",
                "api_url": "https://api.pfgc.com/v1",
                "website_url": "https://www.pfgc.com",
                "features": ["Real-time Pricing", "Order Management", "Delivery Scheduling"],
                "description": "Food distribution company serving restaurants and healthcare"
            }
        }
        
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

@router.post("/pricing")
async def get_pricing(
    request: PricingRequest,
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Get pricing for items from a specific supplier"""
    try:
        # Mock pricing data - in real implementation, this would call supplier APIs
        pricing_data = []
        
        for item in request.items:
            # Generate mock pricing based on item name
            base_price = hash(item) % 50 + 10  # Random price between $10-$60
            
            pricing_data.append({
                "itemId": f"{request.supplier_id}_{item.lower().replace(' ', '_')}",
                "itemName": item.title(),
                "price": float(base_price + (hash(request.supplier_id) % 10)),
                "currency": "USD",
                "unit": "lb" if "meat" in item.lower() or "chicken" in item.lower() else "each",
                "lastUpdated": datetime.now().isoformat(),
                "supplierId": request.supplier_id
            })
        
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

@router.post("/order")
async def place_order(
    request: OrderRequest,
    user: dict = Depends(lambda: {"uid": "test-user"})  # Placeholder for auth
):
    """Place an order with a supplier"""
    try:
        db = get_firestore_client()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Calculate total cost
        total_cost = sum(item.quantity * item.price for item in request.items)
        
        # Generate order ID
        order_id = f"ORD-{datetime.now().strftime('%Y%m%d')}-{hash(str(request.items)) % 10000:04d}"
        
        # Save order to database
        order_data = {
            "orderId": order_id,
            "supplierId": request.supplier_id,
            "userId": user["uid"],
            "items": [item.dict() for item in request.items],
            "totalCost": total_cost,
            "deliveryAddress": request.deliveryAddress,
            "deliveryDate": request.deliveryDate or (datetime.now().date() + timedelta(days=2)).isoformat(),
            "notes": request.notes or "",
            "status": "pending",
            "orderDate": datetime.now().isoformat(),
            "estimatedDelivery": (datetime.now().date() + timedelta(days=2)).isoformat()
        }
        
        db.collection("supplier_orders").add(order_data)
        
        return {
            "success": True,
            "orderId": order_id,
            "status": "pending",
            "totalCost": total_cost,
            "estimatedDelivery": order_data["estimatedDelivery"],
            "message": f"Order {order_id} placed successfully with {request.supplier_id}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error placing order: {str(e)}"
        ) 