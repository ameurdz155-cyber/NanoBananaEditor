"""Image editing routes."""

from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends
import uuid

from models import EditRequest, EditResponse
from services.gemini_service import edit_image
from config import GEMINI_FLASH_MODEL
from database import get_table
from routes.auth_db import get_current_user

router = APIRouter(tags=["editing"])


def create_queue_item(user_id: str, type: str, prompt: str, preview_url: Optional[str] = None) -> str:
    """Create a queue item and return its ID."""
    queue_table = get_table("queue")
    now = datetime.utcnow().isoformat()
    
    queue_item = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type,
        "status": "pending",
        "prompt": prompt,
        "preview_url": preview_url,
        "result_url": None,
        "error_message": None,
        "progress": 0,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "metadata": {}
    }
    
    queue_table.insert(queue_item)
    return queue_item["id"]


def update_queue_item(item_id: str, status: str, progress: int = 0, result_url: Optional[str] = None, error_message: Optional[str] = None):
    """Update a queue item status and progress."""
    queue_table = get_table("queue")
    from tinydb import Query
    QueueQuery = Query()
    
    now = datetime.utcnow().isoformat()
    updates = {
        "status": status,
        "progress": progress,
        "updated_at": now
    }
    
    if status in ["completed", "failed"]:
        updates["completed_at"] = now
    
    if result_url:
        updates["result_url"] = result_url
    
    if error_message:
        updates["error_message"] = error_message
    
    queue_table.update(updates, QueueQuery.id == item_id)


@router.post("/edit/gemini", response_model=EditResponse)
async def edit_with_gemini(
    payload: EditRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> EditResponse:
    """Edit an image using Gemini AI."""
    # Create queue item
    queue_id = create_queue_item(
        user_id=current_user["id"],
        type="edit",
        prompt=payload.instruction,
        preview_url=payload.original_image
    )
    
    try:
        # Update status to processing
        update_queue_item(queue_id, "processing", progress=20)
        
        # Edit image
        images = edit_image(
            instruction=payload.instruction,
            original_image=payload.original_image,
            reference_images=payload.reference_images,
            mask_image=payload.mask_image,
            temperature=payload.temperature,
            seed=payload.seed
        )
        
        # Update progress
        update_queue_item(queue_id, "processing", progress=90)
        
        # Mark as completed
        result_url = images[0] if images else None
        update_queue_item(queue_id, "completed", progress=100, result_url=result_url)
        
        return EditResponse(model=GEMINI_FLASH_MODEL, images=images)
    except Exception as e:
        # Mark as failed
        update_queue_item(queue_id, "failed", progress=0, error_message=str(e))
        raise
