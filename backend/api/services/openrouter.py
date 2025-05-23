import httpx
import json
import logging
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

logger = logging.getLogger(__name__)

async def chat_completion(messages: list, model: str) -> Dict[str, Any]:
    """
    Make a chat completion request to OpenRouter API
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://chunkr.ai",  # Optional. Site URL for rankings
        "X-Title": "Chunkr",  # Optional. Site title for rankings
    }
    
    payload = {
        "model": model,  # The model from the request
        "messages": messages,  # The messages array
    }
    
    logger.info(f"Making request to OpenRouter with payload: {json.dumps(payload, indent=2)}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,  # httpx will automatically set Content-Type: application/json
            timeout=30.0  # Add a reasonable timeout
        )
        
        try:
            response.raise_for_status()
            response_data = response.json()
            logger.info(f"Received response from OpenRouter: {json.dumps(response_data, indent=2)}")
            return response_data
        except Exception as e:
            error_detail = f"Status code: {response.status_code}, Response text: {response.text}"
            logger.error(f"Error from OpenRouter: {error_detail}")
            raise 