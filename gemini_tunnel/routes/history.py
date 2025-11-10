"""
History API Routes

Provides endpoints for managing user generation history.
Stores all generation information including prompts, parameters, and assets.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from tinydb import Query
from datetime import datetime

from database import get_db
from services.auth_service_db import get_current_user

router = APIRouter(prefix="/api/v1/history", tags=["History"])


# Pydantic Models
class Asset(BaseModel):
    """Asset information"""
    id: str
    type: str = Field(..., description="original, mask, or output")
    url: str
    mime: str
    width: int
    height: int
    checksum: str


class GenerationParameters(BaseModel):
    """Generation parameters"""
    aspectRatio: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    seed: Optional[int] = None
    temperature: Optional[float] = None
    iterationIndex: Optional[int] = None
    totalIterations: Optional[int] = None
    referenceCount: Optional[int] = None


class GenerationHistoryItem(BaseModel):
    """Single generation history entry"""
    id: str
    prompt: str
    negativePrompt: Optional[str] = None
    parameters: GenerationParameters
    sourceAssets: List[Asset] = []
    outputAssets: List[Asset] = []
    modelVersion: str
    timestamp: int
    costEstimate: Optional[float] = None
    tags: Optional[List[str]] = []
    user_id: str


class CreateHistoryRequest(BaseModel):
    """Request to create a history entry"""
    id: str
    prompt: str
    negativePrompt: Optional[str] = None
    parameters: GenerationParameters
    sourceAssets: List[Asset] = []
    outputAssets: List[Asset] = []
    modelVersion: str
    timestamp: int
    costEstimate: Optional[float] = None
    tags: Optional[List[str]] = []


class HistoryListResponse(BaseModel):
    """Response with list of history items"""
    items: List[GenerationHistoryItem]
    total: int


@router.post("", response_model=GenerationHistoryItem, status_code=status.HTTP_201_CREATED)
async def create_history_entry(
    data: CreateHistoryRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new history entry for the current user.
    Called automatically after successful generation.
    """
    db = get_db()
    history_table = db.table('history')
    
    user_id = current_user.get("id") or current_user.get("sub")
    
    # Check if entry with this ID already exists
    HistoryQuery = Query()
    existing = history_table.search(
        (HistoryQuery.id == data.id) & (HistoryQuery.user_id == user_id)
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="History entry with this ID already exists"
        )
    
    # Create history entry
    history_entry = {
        "id": data.id,
        "prompt": data.prompt,
        "negativePrompt": data.negativePrompt,
        "parameters": data.parameters.model_dump(),
        "sourceAssets": [asset.model_dump() for asset in data.sourceAssets],
        "outputAssets": [asset.model_dump() for asset in data.outputAssets],
        "modelVersion": data.modelVersion,
        "timestamp": data.timestamp,
        "costEstimate": data.costEstimate,
        "tags": data.tags or [],
        "user_id": user_id,
        "created_at": datetime.utcnow().timestamp(),
    }
    
    history_table.insert(history_entry)
    
    return GenerationHistoryItem(**history_entry)


@router.get("", response_model=HistoryListResponse)
async def get_history(
    limit: int = 100,
    offset: int = 0,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get generation history for the current user.
    Returns most recent generations first.
    """
    db = get_db()
    history_table = db.table('history')
    
    user_id = current_user.get("id") or current_user.get("sub")
    
    # Get all history entries for this user
    HistoryQuery = Query()
    all_entries = history_table.search(HistoryQuery.user_id == user_id)
    
    # Sort by timestamp descending (most recent first)
    sorted_entries = sorted(all_entries, key=lambda x: x.get('timestamp', 0), reverse=True)
    
    # Apply pagination
    paginated = sorted_entries[offset:offset + limit]
    
    return HistoryListResponse(
        items=[GenerationHistoryItem(**entry) for entry in paginated],
        total=len(all_entries)
    )


@router.get("/{history_id}", response_model=GenerationHistoryItem)
async def get_history_item(
    history_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific history entry by ID"""
    db = get_db()
    history_table = db.table('history')
    
    user_id = current_user.get("id") or current_user.get("sub")
    
    HistoryQuery = Query()
    entries = history_table.search(
        (HistoryQuery.id == history_id) & (HistoryQuery.user_id == user_id)
    )
    
    if not entries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History entry not found"
        )
    
    return GenerationHistoryItem(**entries[0])


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_item(
    history_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a specific history entry"""
    db = get_db()
    history_table = db.table('history')
    
    user_id = current_user.get("id") or current_user.get("sub")
    
    HistoryQuery = Query()
    removed = history_table.remove(
        (HistoryQuery.id == history_id) & (HistoryQuery.user_id == user_id)
    )
    
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History entry not found"
        )
    
    return None


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Clear all history for the current user"""
    db = get_db()
    history_table = db.table('history')
    
    user_id = current_user.get("id") or current_user.get("sub")
    
    HistoryQuery = Query()
    history_table.remove(HistoryQuery.user_id == user_id)
    
    return None
