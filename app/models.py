from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SeedHistoryRequest(BaseModel):
    bin_ids: List[str] = Field(..., description="List of bin IDs to seed history for")
    hours: int = Field(48, description="Hours of history to generate")


class BinBase(BaseModel):
    location: str = Field(..., description="Descriptive location name of the dustbin")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    capacity: float = Field(100.0, description="Total volume/capacity of the bin in liters")
    priority: int = Field(1, description="Priority level: 1 (Low), 2 (Medium), 3 (High)")


class BinCreate(BinBase):
    bin_id: str = Field(..., description="Unique hardware identifier for the bin")


class BinResponse(BinBase):
    bin_id: str
    fill_percentage: float = Field(0.0, description="Current fill level percentage (0 to 100)")
    status: str = Field("OK", description="Status: 'OK', 'Needs Collection', or 'Critical'")
    last_updated: Optional[str] = None
    confidence_percent: float = Field(100.0, description="Confidence metric for the latest reading")
    recent_readings: List[Dict[str, Any]] = Field(default_factory=list, description="Last 5 readings to calculate jitter")


class BinHistoryItem(BaseModel):
    timestamp: str
    fill_percentage: float
    confidence_percent: float = Field(100.0)


class BinHistoryResponse(BaseModel):
    bin_id: str
    history: List[BinHistoryItem]


class BinPrediction(BaseModel):
    bin_id: str = Field(..., description="Unique hardware identifier for the bin")
    predicted_fill_percentage: float = Field(..., description="Predicted fill level percentage")
    hours_until_full: int = Field(..., description="Predicted hours until bin reaches 100% capacity (-1 if >168h)")
    error_rate_high: bool = Field(..., description="True if prediction has high uncertainty due to low data")
    data_points_used: int = Field(..., description="Number of historical data points used for prediction")
    target_future_timestamp: str = Field(..., description="ISO timestamp of the predicted future state")


class PredictedRouteRequest(BaseModel):
    hours_ahead: int = Field(12, description="Hours in the future to predict the route for")


class RouteStep(BaseModel):
    step_order: int
    bin_id: str
    location: str
    fill_percentage: float
    priority: int
    is_complaint: Optional[bool] = False
    capacity: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FleetRoute(BaseModel):
    van_id: int
    operator_id: Optional[str] = None
    route: List[str]
    details: List[RouteStep]
    distance_km: float
    fuel_liters: float
    cost_inr: float
    total_volume: float
    roadGeometry: Optional[List[List[float]]] = None


class FleetTotals(BaseModel):
    total_vans: int
    total_distance: float
    total_fuel: float
    total_cost: float


class RouteResponse(BaseModel):
    fleet_routes: List[FleetRoute]
    fleet_totals: FleetTotals
    message: str


class FleetConfig(BaseModel):
    van_capacity: float = Field(500.0, description="Max load capacity per van in liters")
    mileage_kmpl: float = Field(5.5, description="Average fuel consumption mileage in km/L")
    fuel_price: float = Field(95.0, description="Fuel cost per liter in INR")
    show_bin_nodes: bool = Field(True, description="Toggle for Bin Nodes on map")
    show_text_complaints: bool = Field(True, description="Toggle for Text Complaints on map")
    show_photo_complaints: bool = Field(True, description="Toggle for Photo Complaints on map")


class OperatorBase(BaseModel):
    username: str = Field(..., description="Unique username for the van operator")
    state: str = Field("offline", description="'live' or 'offline'")
    latitude: Optional[float] = Field(None, description="Current live latitude")
    longitude: Optional[float] = Field(None, description="Current live longitude")
    heading: Optional[float] = Field(None, description="Current heading/direction in degrees")


class OperatorCreate(OperatorBase):
    password: str = Field(..., description="Operator password")


class OperatorResponse(OperatorBase):
    operator_id: str


class OperatorLogin(BaseModel):
    username: str
    password: str


class OperatorLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    heading: Optional[float] = None


class ComplaintBase(BaseModel):
    description: str = Field(..., description="Detailed description of the complaint")
    location: Optional[str] = Field(None, description="Optional location related to the complaint")
    latitude: Optional[float] = Field(None, description="Optional GPS latitude")
    longitude: Optional[float] = Field(None, description="Optional GPS longitude")
    photo_base64: Optional[str] = Field(None, description="Optional base64 encoded photo")


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintResponse(ComplaintBase):
    complaint_id: str
    timestamp: str
    status: str = Field("Pending", description="Status: 'Pending', 'In Progress', 'Resolved'")
    garbage_quantity: Optional[int] = Field(None, description="AI estimated garbage quantity in liters")
    confidence_score: Optional[float] = Field(None, description="AI confidence score percentage")


class ComplaintUpdate(BaseModel):
    status: str = Field(..., description="New status for the complaint")


class ImageDetectionRequest(BaseModel):
    photo_base64: str = Field(..., description="Base64 encoded photo")


class ImageDetectionResponse(BaseModel):
    is_plastic_bottle: bool = Field(..., description="True if a plastic bottle is detected")
    confidence_score: float = Field(..., description="AI confidence score percentage")
