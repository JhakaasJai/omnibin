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
        "garbage_quantity": 0,
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
                                "text": "Analyze this photo. First, verify if it is an appropriate photo showing a street, public area, garbage, or waste issue. If it contains NSFW, explicit, or completely unrelated inappropriate content, set 'is_appropriate' to false. Otherwise, set it to true. If true, estimate the quantity of garbage in liters. Output ONLY a valid JSON object with exactly three keys: 'is_appropriate' (boolean), 'garbage_quantity' (an integer representing the estimated volume in liters, e.g., 50, 200), and 'confidence_score' (a float between 0.0 and 100.0). Do not include any other text."
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
            
            # Check for appropriateness
            if not data.get("is_appropriate", True):
                raise HTTPException(status_code=400, detail="Inappropriate image detected. Please upload a valid photo of a garbage site.")
                
            new_complaint["garbage_quantity"] = int(data.get("garbage_quantity", 0))
            new_complaint["confidence_score"] = float(data.get("confidence_score", 85.0))
        except HTTPException as he:
            raise he # Re-raise HTTP exceptions immediately
        except Exception as e:
            print("AI Vision Analysis Error:", e)
            new_complaint["garbage_quantity"] = 0
            new_complaint["confidence_score"] = 0.0

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

@router.delete("/{complaint_id}")
def delete_complaint(complaint_id: str):
    """
    Delete a complaint from the database.
    """
    result = complaints_collection.delete_one({"complaint_id": complaint_id})
    if result.deleted_count > 0:
        return {"message": "Complaint deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Complaint not found")
