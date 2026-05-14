from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid
import json
from openai import OpenAI
from app.config import settings
from app.models import ComplaintCreate, ComplaintResponse, ComplaintUpdate
from app.database import complaints_collection

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

from pymongo import ReturnDocument

# Initialize OpenAI client with OpenRouter base URL
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

@router.post("/", response_model=ComplaintResponse)
def create_complaint(complaint: ComplaintCreate):
    """
    Submit a new complaint.
    """
    new_complaint = {
        "complaint_id": str(uuid.uuid4()),
        "description": complaint.description,
        "location": complaint.location,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "photo_base64": complaint.photo_base64,
        "timestamp": datetime.now().isoformat(),
        "status": "Pending",
        "garbage_quantity": "normal",
        "confidence_score": 100.0
    }
    
    if complaint.photo_base64:
        img_data = complaint.photo_base64
        if not img_data.startswith("data:image"):
            img_data = f"data:image/jpeg;base64,{img_data}"
            
        try:
            response = client.chat.completions.create(
                model="meta-llama/llama-3.2-11b-vision-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": "Analyze this photo of a garbage dumping site. Output ONLY a valid JSON object with exactly two keys: 'garbage_quantity' (must be one of 'critical', 'moderate', or 'normal') and 'confidence_score' (a float between 0.0 and 100.0). Do not include any other text."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": img_data,
                                },
                            },
                        ],
                    }
                ],
                extra_headers={
                    "HTTP-Referer": "https://omnibin.vercel.app",
                    "X-Title": "OmniBin Backend"
                }
            )
            reply = response.choices[0].message.content
            clean_reply = reply.strip().replace("```json", "").replace("```", "")
            data = json.loads(clean_reply)
            new_complaint["garbage_quantity"] = data.get("garbage_quantity", "moderate")
            new_complaint["confidence_score"] = float(data.get("confidence_score", 85.0))
        except Exception as e:
            print("AI Vision Analysis Error:", e)
            new_complaint["garbage_quantity"] = "moderate"
            new_complaint["confidence_score"] = 50.0

    complaints_collection.insert_one(new_complaint.copy())
    return new_complaint

@router.get("/", response_model=List[ComplaintResponse])
def get_complaints():
    """
    Retrieve all complaints for admin review.
    """
    # Sorting by newest first
    complaints_cursor = complaints_collection.find({}, {"_id": 0}).sort("timestamp", -1)
    return list(complaints_cursor)

@router.put("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint_status(complaint_id: str, update_data: ComplaintUpdate):
    """
    Update the status of a specific complaint.
    """
    result = complaints_collection.find_one_and_update(
        {"complaint_id": complaint_id},
        {"$set": {"status": update_data.status}},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0}
    )
    if result:
        return result
    
    raise HTTPException(status_code=404, detail="Complaint not found")
