"""Asset upload and management routes."""

import os
import uuid
from typing import Dict, Any
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
import shutil

from routes.auth_db import get_current_user

router = APIRouter(tags=["assets"])

# Create temp directory for uploaded assets
TEMP_ASSETS_DIR = Path("temp_assets")
TEMP_ASSETS_DIR.mkdir(exist_ok=True)

# Store asset metadata (in production, use a database)
_asset_metadata: Dict[str, Dict[str, Any]] = {}


def cleanup_old_assets():
    """Remove assets older than 24 hours."""
    now = datetime.utcnow()
    expired_assets = []
    
    for asset_id, metadata in _asset_metadata.items():
        if now - metadata["created_at"] > timedelta(hours=24):
            expired_assets.append(asset_id)
    
    for asset_id in expired_assets:
        try:
            file_path = TEMP_ASSETS_DIR / _asset_metadata[asset_id]["filename"]
            if file_path.exists():
                file_path.unlink()
            del _asset_metadata[asset_id]
        except Exception as e:
            print(f"Error cleaning up asset {asset_id}: {e}")


@router.post("/upload/asset")
async def upload_asset(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Upload an asset file and get a temporary URL.
    The asset will be available for 24 hours.
    """
    # Cleanup old assets before processing new upload
    cleanup_old_assets()
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed"
        )
    
    # Validate file size (max 10MB)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 10MB limit"
        )
    
    # Generate unique filename
    asset_id = str(uuid.uuid4())
    file_extension = Path(file.filename or "image.png").suffix
    if not file_extension:
        file_extension = ".png"
    
    filename = f"{asset_id}{file_extension}"
    file_path = TEMP_ASSETS_DIR / filename
    
    try:
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Store metadata
        _asset_metadata[asset_id] = {
            "filename": filename,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": file_size,
            "user_id": current_user["id"],
            "created_at": datetime.utcnow()
        }
        
        return {
            "asset_id": asset_id,
            "url": f"/api/v1/assets/{asset_id}",
            "filename": file.filename,
            "size": file_size,
            "content_type": file.content_type
        }
        
    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save asset: {str(e)}"
        )


@router.get("/assets/{asset_id}")
async def get_asset(asset_id: str):
    """
    Retrieve an uploaded asset by ID.
    Note: This endpoint is public to allow image loading in HTML <img> tags.
    Assets are temporary (24-hour TTL) and referenced by UUID.
    """
    # Cleanup old assets
    cleanup_old_assets()
    
    if asset_id not in _asset_metadata:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    metadata = _asset_metadata[asset_id]
    file_path = TEMP_ASSETS_DIR / metadata["filename"]
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Asset file not found")
    
    return FileResponse(
        path=str(file_path),
        media_type=metadata["content_type"],
        filename=metadata["original_filename"]
    )


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Delete an uploaded asset.
    """
    if asset_id not in _asset_metadata:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    metadata = _asset_metadata[asset_id]
    
    # Check if user owns the asset
    if metadata["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this asset")
    
    file_path = TEMP_ASSETS_DIR / metadata["filename"]
    
    try:
        if file_path.exists():
            file_path.unlink()
        del _asset_metadata[asset_id]
        
        return {"message": "Asset deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete asset: {str(e)}"
        )
