from fastapi import APIRouter
import json
from openai import OpenAI
from app.config import settings
from app.models import ImageDetectionRequest, ImageDetectionResponse

router = APIRouter(prefix="/api/detection", tags=["AI Detection"])

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

@router.post("/plastic-bottle", response_model=ImageDetectionResponse)
def detect_plastic_bottle(request: ImageDetectionRequest):
    img_data = request.photo_base64
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
                            "text": "Analyze this photo. Output ONLY a valid JSON object with exactly two keys: 'is_plastic_bottle' (boolean, true if there is a plastic bottle clearly visible) and 'confidence_score' (a float between 0.0 and 100.0). Do not include any other text or markdown formatting."
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
        return ImageDetectionResponse(
            is_plastic_bottle=bool(data.get("is_plastic_bottle", False)),
            confidence_score=float(data.get("confidence_score", 0.0))
        )
    except Exception as e:
        print("AI Vision Analysis Error:", e)
        return ImageDetectionResponse(is_plastic_bottle=False, confidence_score=0.0)
