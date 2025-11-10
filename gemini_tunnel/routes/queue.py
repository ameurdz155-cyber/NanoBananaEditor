"""Queue management routes."""

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from database import get_table
from routes.auth_db import get_current_user

router = APIRouter(prefix="/api/v1/queue", tags=["Queue"])


class QueueItem(BaseModel):
    """Model for a queue item."""
    id: str
    user_id: str
    type: str = Field(..., description="Type: 'generation', 'edit', 'upscale', 'inpaint'")
    status: str = Field(..., description="Status: 'pending', 'processing', 'completed', 'failed'")
    prompt: Optional[str] = None
    preview_url: Optional[str] = None
    result_url: Optional[str] = None
    error_message: Optional[str] = None
    progress: int = Field(default=0, ge=0, le=100)
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class QueueResponse(BaseModel):
    """Response model for queue listing."""
    items: List[QueueItem]
    total: int
    pending: int
    processing: int
    completed: int
    failed: int


class CreateQueueItemRequest(BaseModel):
    """Request model for creating a queue item."""
    type: str = Field(..., description="Type: 'generation', 'edit', 'upscale', 'inpaint'")
    prompt: Optional[str] = None
    preview_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UpdateQueueItemRequest(BaseModel):
    """Request model for updating a queue item."""
    status: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    result_url: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@router.get("", response_model=QueueResponse)
async def get_queue(
    status: Optional[str] = None,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> QueueResponse:
    """
    Get queue items for the current user.
    
    Args:
        status: Filter by status (pending, processing, completed, failed)
        limit: Maximum number of items to return
        current_user: Current authenticated user
    
    Returns:
        QueueResponse with queue items and statistics
    """
    queue_table = get_table("queue")
    user_id = current_user["id"]
    
    # Get all queue items for user
    from tinydb import Query
    QueueQuery = Query()
    
    if status:
        items = queue_table.search(
            (QueueQuery.user_id == user_id) & (QueueQuery.status == status)
        )
    else:
        items = queue_table.search(QueueQuery.user_id == user_id)
    
    # Sort by created_at (newest first)
    items = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Apply limit
    items = items[:limit]
    
    # Calculate statistics
    all_items = queue_table.search(QueueQuery.user_id == user_id)
    stats = {
        "pending": len([i for i in all_items if i.get("status") == "pending"]),
        "processing": len([i for i in all_items if i.get("status") == "processing"]),
        "completed": len([i for i in all_items if i.get("status") == "completed"]),
        "failed": len([i for i in all_items if i.get("status") == "failed"]),
    }
    
    return QueueResponse(
        items=[QueueItem(**item) for item in items],
        total=len(all_items),
        **stats
    )


@router.post("", response_model=QueueItem)
async def create_queue_item(
    request: CreateQueueItemRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> QueueItem:
    """
    Create a new queue item.
    
    Args:
        request: Queue item creation request
        current_user: Current authenticated user
    
    Returns:
        Created queue item
    """
    import uuid
    
    queue_table = get_table("queue")
    now = datetime.utcnow().isoformat()
    
    queue_item = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": request.type,
        "status": "pending",
        "prompt": request.prompt,
        "preview_url": request.preview_url,
        "result_url": None,
        "error_message": None,
        "progress": 0,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "metadata": request.metadata or {}
    }
    
    queue_table.insert(queue_item)
    
    return QueueItem(**queue_item)


@router.get("/{item_id}", response_model=QueueItem)
async def get_queue_item(
    item_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> QueueItem:
    """
    Get a specific queue item.
    
    Args:
        item_id: Queue item ID
        current_user: Current authenticated user
    
    Returns:
        Queue item
    """
    queue_table = get_table("queue")
    from tinydb import Query
    QueueQuery = Query()
    
    items = queue_table.search(
        (QueueQuery.id == item_id) & (QueueQuery.user_id == current_user["id"])
    )
    
    if not items:
        raise HTTPException(status_code=404, detail="Queue item not found")
    
    return QueueItem(**items[0])


@router.patch("/{item_id}", response_model=QueueItem)
async def update_queue_item(
    item_id: str,
    request: UpdateQueueItemRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> QueueItem:
    """
    Update a queue item.
    
    Args:
        item_id: Queue item ID
        request: Update request
        current_user: Current authenticated user
    
    Returns:
        Updated queue item
    """
    queue_table = get_table("queue")
    from tinydb import Query
    QueueQuery = Query()
    
    items = queue_table.search(
        (QueueQuery.id == item_id) & (QueueQuery.user_id == current_user["id"])
    )
    
    if not items:
        raise HTTPException(status_code=404, detail="Queue item not found")
    
    now = datetime.utcnow().isoformat()
    updates = {"updated_at": now}
    
    if request.status is not None:
        updates["status"] = request.status
        if request.status in ["completed", "failed"]:
            updates["completed_at"] = now
    
    if request.progress is not None:
        updates["progress"] = request.progress
    
    if request.result_url is not None:
        updates["result_url"] = request.result_url
    
    if request.error_message is not None:
        updates["error_message"] = request.error_message
    
    if request.metadata is not None:
        updates["metadata"] = {**items[0].get("metadata", {}), **request.metadata}
    
    queue_table.update(updates, QueueQuery.id == item_id)
    
    # Get updated item
    updated_items = queue_table.search(QueueQuery.id == item_id)
    return QueueItem(**updated_items[0])


@router.delete("/{item_id}")
async def delete_queue_item(
    item_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Delete a queue item.
    
    Args:
        item_id: Queue item ID
        current_user: Current authenticated user
    
    Returns:
        Success message
    """
    queue_table = get_table("queue")
    from tinydb import Query
    QueueQuery = Query()
    
    items = queue_table.search(
        (QueueQuery.id == item_id) & (QueueQuery.user_id == current_user["id"])
    )
    
    if not items:
        raise HTTPException(status_code=404, detail="Queue item not found")
    
    queue_table.remove(QueueQuery.id == item_id)
    
    return {"message": "Queue item deleted successfully"}


@router.delete("")
async def clear_completed_queue(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Clear all completed and failed queue items for the current user.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Success message with count
    """
    queue_table = get_table("queue")
    from tinydb import Query
    QueueQuery = Query()
    
    # Remove completed and failed items
    removed = queue_table.remove(
        (QueueQuery.user_id == current_user["id"]) & 
        ((QueueQuery.status == "completed") | (QueueQuery.status == "failed"))
    )
    
    count = len(removed) if isinstance(removed, list) else (1 if removed else 0)
    
    return {"message": f"Cleared {count} completed/failed queue items"}
