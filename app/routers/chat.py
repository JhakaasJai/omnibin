from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings
from app.services import bin_service
from openai import OpenAI
import json

router = APIRouter(tags=["AI Assistant"])

# Initialize OpenAI client with OpenRouter base URL
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("/api/chat", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest):
    """
    AI Chat endpoint that provides smart answers based on real-time OmniBin state.
    """
    try:
        # Retrieve live bin state
        bins = bin_service.get_all_bins()
        
        # Construct system prompt
        system_prompt = (
            "You are the OmniBin AI Assistant. Your job is to answer questions "
            "about the city's smart waste management system based only on the following "
            "real-time database state:\n\n"
            f"{json.dumps(bins, indent=2)}"
        )

        # Make request to OpenRouter
        response = client.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            extra_headers={
                "HTTP-Referer": "https://omnibin.vercel.app",
                "X-Title": "OmniBin Backend"
            }
        )

        reply = response.choices[0].message.content
        return ChatResponse(response=reply)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
