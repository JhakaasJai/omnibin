from typing import Dict, Any
from app.database import config_collection
from app.models import FleetConfig

DEFAULT_CONFIG = {
    "van_capacity": 500.0,
    "mileage_kmpl": 5.5,
    "fuel_price": 95.0,
    "show_bin_nodes": True,
    "show_text_complaints": True,
    "show_photo_complaints": True
}

def get_fleet_config() -> Dict[str, Any]:
    doc = config_collection.find_one({"config_id": "default_fleet_config"})
    if not doc:
        # Seed defaults
        doc = {"config_id": "default_fleet_config", **DEFAULT_CONFIG}
        config_collection.insert_one(doc)
    doc.pop("_id", None)
    return doc

def update_fleet_config(config_data: FleetConfig) -> Dict[str, Any]:
    update_doc = config_data.model_dump()
    config_collection.update_one(
        {"config_id": "default_fleet_config"},
        {"$set": update_doc},
        upsert=True
    )
    return {"config_id": "default_fleet_config", **update_doc}
