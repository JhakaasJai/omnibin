from typing import List
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from app.models import OperatorCreate, OperatorResponse, OperatorLogin, OperatorLocationUpdate
from app.database import operators_collection
import time

router = APIRouter(tags=["Van Operators"])

def serialize_operator(op_doc) -> dict:
    if not op_doc:
        return None
    op_doc["operator_id"] = str(op_doc["_id"])
    return op_doc

@router.post("/api/operators/seed", response_model=List[OperatorResponse])
def seed_operators():
    """Seed sample van operators."""
    sample_operators = [
        {"username": "operator1", "password": "password123", "state": "offline", "latitude": 23.2244, "longitude": 77.4027},
        {"username": "operator2", "password": "password123", "state": "offline", "latitude": 23.2244, "longitude": 77.4027},
        {"username": "operator3", "password": "password123", "state": "offline", "latitude": 23.2244, "longitude": 77.4027},
    ]
    
    seeded = []
    for op in sample_operators:
        existing = operators_collection.find_one({"username": op["username"]})
        if not existing:
            res = operators_collection.insert_one(op)
            op["_id"] = res.inserted_id
            seeded.append(serialize_operator(op))
        else:
            seeded.append(serialize_operator(existing))
            
    return seeded

@router.post("/api/operators/login", response_model=OperatorResponse)
def login_operator(creds: OperatorLogin):
    """Simple login for operator."""
    op = operators_collection.find_one({"username": creds.username, "password": creds.password})
    if not op:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return serialize_operator(op)

@router.put("/api/operators/{operator_id}/live", response_model=OperatorResponse)
def set_operator_live(operator_id: str, location: OperatorLocationUpdate):
    """Set operator to live state and update initial location."""
    from pymongo import ReturnDocument
    res = operators_collection.find_one_and_update(
        {"_id": ObjectId(operator_id)},
        {"$set": {"state": "live", "latitude": location.latitude, "longitude": location.longitude, "heading": location.heading}},
        return_document=ReturnDocument.AFTER
    )
    if not res:
        raise HTTPException(status_code=404, detail="Operator not found")
    return serialize_operator(res)

@router.put("/api/operators/{operator_id}/offline", response_model=OperatorResponse)
def set_operator_offline(operator_id: str):
    """Set operator to offline state."""
    from pymongo import ReturnDocument
    res = operators_collection.find_one_and_update(
        {"_id": ObjectId(operator_id)},
        {"$set": {"state": "offline"}},
        return_document=ReturnDocument.AFTER
    )
    if not res:
        raise HTTPException(status_code=404, detail="Operator not found")
    return serialize_operator(res)

@router.put("/api/operators/{operator_id}/location", response_model=OperatorResponse)
def update_operator_location(operator_id: str, location: OperatorLocationUpdate):
    """Update operator live location."""
    from pymongo import ReturnDocument
    res = operators_collection.find_one_and_update(
        {"_id": ObjectId(operator_id)},
        {"$set": {"latitude": location.latitude, "longitude": location.longitude, "heading": location.heading}},
        return_document=ReturnDocument.AFTER
    )
    if not res:
        raise HTTPException(status_code=404, detail="Operator not found")
    return serialize_operator(res)

@router.get("/api/operators", response_model=List[OperatorResponse])
def get_all_operators():
    """Get all operators."""
    ops = list(operators_collection.find())
    return [serialize_operator(op) for op in ops]

@router.post("/api/operators/mock_live")
def mock_live_operators():
    """Utility method to make a couple of operators live with mock locations."""
    # Bhopal coordinates for testing
    mock_positions = [
        {"username": "operator2", "lat": 23.250, "lon": 77.410},
        {"username": "operator3", "lat": 23.220, "lon": 77.470}
    ]
    
    updated_ops = []
    for pos in mock_positions:
        res = operators_collection.find_one_and_update(
            {"username": pos["username"]},
            {"$set": {"state": "live", "latitude": pos["lat"], "longitude": pos["lon"]}}
        )
        if res:
            updated_ops.append(pos["username"])
            
    return {"message": f"Successfully set operators to live: {', '.join(updated_ops)}"}

@router.post("/api/operators/emergency")
def trigger_emergency_dispatch():
    """Emergency dispatch notification to all live operators."""
    # Set emergency_dispatch flag to true for all live operators
    operators_collection.update_many({"state": "live"}, {"$set": {"emergency_dispatch": True}})
    return {"message": "Emergency dispatch signal sent to all online operators."}

@router.put("/api/operators/{operator_id}/acknowledge_emergency", response_model=OperatorResponse)
def acknowledge_emergency(operator_id: str):
    """Acknowledge emergency dispatch."""
    from pymongo import ReturnDocument
    res = operators_collection.find_one_and_update(
        {"_id": ObjectId(operator_id)},
        {"$set": {"emergency_dispatch": False}},
        return_document=ReturnDocument.AFTER
    )
    if not res:
        raise HTTPException(status_code=404, detail="Operator not found")
    return serialize_operator(res)
