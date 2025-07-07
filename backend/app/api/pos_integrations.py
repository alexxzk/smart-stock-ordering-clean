from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ..config.pos_config import POSConfig
from ..services.pos_api_service import POSAPIService

router = APIRouter(prefix="/api/pos-integrations", tags=["pos_integrations"])

class SalesDataRequest(BaseModel):
    pos_id: str
    start_date: str
    end_date: str

class AnalyticsRequest(BaseModel):
    pos_id: str
    start_date: str
    end_date: str

class RecommendationsRequest(BaseModel):
    pos_id: str
    start_date: str
    end_date: str

@router.get("/pos-systems")
async def get_available_pos_systems(
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get list of available POS systems for integration"""
    try:
        pos_systems = POSConfig.get_all_pos_systems()
        
        # Transform for frontend consumption
        formatted_systems = {}
        for pos_id, pos_system in pos_systems.items():
            formatted_systems[pos_id] = {
                "id": pos_id,
                "name": pos_system["name"],
                "integration_type": pos_system["integration_type"],
                "features": pos_system.get("features", []),
                "contact": pos_system.get("contact", {}),
                "description": f"Connect to {pos_system['name']} to get real-time sales data and analytics",
                "status": "available"
            }
        
        return {
            "success": True,
            "pos_systems": formatted_systems,
            "total_count": len(formatted_systems)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching POS systems: {str(e)}"
        )

@router.post("/sales-data")
async def get_sales_data(
    request: SalesDataRequest,
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get sales data from a specific POS system"""
    try:
        # Validate date range
        if not request.start_date or not request.end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date and end date are required"
            )
        
        # Use POS API service
        pos_service = POSAPIService(request.pos_id)
        sales_data = await pos_service.get_sales_data(request.start_date, request.end_date)
        
        return {
            "success": True,
            "pos_id": request.pos_id,
            "pos_name": pos_service.config["name"],
            "date_range": {
                "start_date": request.start_date,
                "end_date": request.end_date
            },
            "sales_data": sales_data,
            "record_count": len(sales_data),
            "fetched_at": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=f"POS system not found: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sales data: {str(e)}"
        )

@router.post("/analytics")
async def get_sales_analytics(
    request: AnalyticsRequest,
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get sales analytics and insights from POS data"""
    try:
        # Validate date range
        if not request.start_date or not request.end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date and end date are required"
            )
        
        # Use POS API service
        pos_service = POSAPIService(request.pos_id)
        analytics = await pos_service.get_sales_analytics(request.start_date, request.end_date)
        
        if "error" in analytics:
            return {
                "success": False,
                "error": analytics["error"],
                "pos_id": request.pos_id
            }
        
        return {
            "success": True,
            "pos_id": request.pos_id,
            "pos_name": pos_service.config["name"],
            "analytics": analytics,
            "generated_at": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=f"POS system not found: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating analytics: {str(e)}"
        )

@router.post("/recommendations")
async def get_ordering_recommendations(
    request: RecommendationsRequest,
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get AI-powered ordering recommendations based on sales data"""
    try:
        # Validate date range
        if not request.start_date or not request.end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date and end date are required"
            )
        
        # Use POS API service
        pos_service = POSAPIService(request.pos_id)
        recommendations = await pos_service.get_ordering_recommendations(request.start_date, request.end_date)
        
        return {
            "success": True,
            "pos_id": request.pos_id,
            "pos_name": pos_service.config["name"],
            "recommendations": recommendations,
            "recommendation_count": len(recommendations),
            "generated_at": datetime.now().isoformat(),
            "analysis_period": {
                "start_date": request.start_date,
                "end_date": request.end_date
            }
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=f"POS system not found: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )

@router.get("/quick-analytics")
async def get_quick_analytics(
    pos_id: str,
    days: int = 7,
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get quick analytics for the last N days"""
    try:
        # Calculate date range
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Use POS API service
        pos_service = POSAPIService(pos_id)
        analytics = await pos_service.get_sales_analytics(start_date, end_date)
        
        if "error" in analytics:
            return {
                "success": False,
                "error": analytics["error"],
                "pos_id": pos_id
            }
        
        return {
            "success": True,
            "pos_id": pos_id,
            "pos_name": pos_service.config["name"],
            "days_analyzed": days,
            "analytics": analytics,
            "generated_at": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=f"POS system not found: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating quick analytics: {str(e)}"
        )

@router.get("/health")
async def check_pos_health(
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Check health status of all configured POS systems"""
    try:
        from ..services.pos_api_service import test_all_pos_systems
        
        # Test all POS systems
        health_results = await test_all_pos_systems()
        
        # Count healthy vs unhealthy systems
        healthy_count = sum(1 for result in health_results if result.get("success", False))
        total_count = len(health_results)
        
        return {
            "success": True,
            "overall_health": "healthy" if healthy_count == total_count else "degraded" if healthy_count > 0 else "unhealthy",
            "healthy_systems": healthy_count,
            "total_systems": total_count,
            "systems": health_results,
            "checked_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking POS health: {str(e)}"
        )

@router.get("/test-connection/{pos_id}")
async def test_pos_connection(
    pos_id: str,
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Test connection to a specific POS system"""
    try:
        from ..services.pos_api_service import test_pos_connection
        
        # Test specific POS system
        result = await test_pos_connection(pos_id)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error testing POS connection: {str(e)}"
        )

@router.get("/mock-data")
async def get_mock_pos_data(
    pos_id: str = "square",
    days: int = 30,
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get mock POS data for testing and demonstration"""
    try:
        # Calculate date range
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Create POS service and get mock data
        pos_service = POSAPIService(pos_id)
        mock_sales = pos_service._get_mock_sales_data(start_date, end_date)
        mock_analytics = await pos_service.get_sales_analytics(start_date, end_date)
        mock_recommendations = await pos_service.get_ordering_recommendations(start_date, end_date)
        
        return {
            "success": True,
            "pos_id": pos_id,
            "data_type": "mock",
            "date_range": {
                "start_date": start_date,
                "end_date": end_date,
                "days": days
            },
            "sales_data": mock_sales[:20],  # Return first 20 records
            "analytics": mock_analytics,
            "recommendations": mock_recommendations,
            "total_records": len(mock_sales),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating mock data: {str(e)}"
        )

# Integration status endpoint
@router.get("/integration-status")
async def get_integration_status(
    user: dict = Depends(lambda: {"uid": "test-user"})
):
    """Get status of POS integrations"""
    try:
        active_systems = POSConfig.get_active_pos_systems()
        all_systems = POSConfig.get_all_pos_systems()
        
        return {
            "success": True,
            "total_systems": len(all_systems),
            "active_systems": len(active_systems),
            "integration_rate": round(len(active_systems) / len(all_systems) * 100, 1) if all_systems else 0,
            "active_pos_systems": list(active_systems.keys()),
            "available_systems": list(all_systems.keys()),
            "status": "active" if active_systems else "no_integrations",
            "last_checked": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting integration status: {str(e)}"
        )