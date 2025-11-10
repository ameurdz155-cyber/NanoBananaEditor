"""
Boards management API endpoints.
Handles gallery boards/folders for user organization.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from tinydb import Query

from database import get_db
from services.auth_service_db import get_current_user

router = APIRouter(prefix="/api/v1/boards", tags=["boards"])


class BoardCreate(BaseModel):
    """Model for creating a new board"""
    name: str = Field(..., min_length=1, max_length=100)
    emoji: Optional[str] = None
    description: Optional[str] = None


class BoardUpdate(BaseModel):
    """Model for updating a board"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    emoji: Optional[str] = None
    description: Optional[str] = None


class BoardImageAdd(BaseModel):
    """Model for adding images to a board"""
    image_ids: List[str]


class BoardResponse(BaseModel):
    """Response model for board"""
    id: str
    name: str
    emoji: Optional[str] = None
    description: Optional[str] = None
    created_at: int
    updated_at: int
    image_ids: List[str]
    user_id: str


@router.post("", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(
    board_data: BoardCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Create a new board/folder for the current user.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    # Check for duplicate board name for this user
    boards_table = db.table("boards")
    BoardQuery = Query()
    existing = boards_table.search(
        (BoardQuery.user_id == user_id) & 
        (BoardQuery.name == board_data.name)
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A board with this name already exists"
        )
    
    # Generate unique board ID
    import uuid
    board_id = f"board-{uuid.uuid4()}"
    
    now = int(datetime.now().timestamp() * 1000)
    
    board = {
        "id": board_id,
        "name": board_data.name,
        "emoji": board_data.emoji,
        "description": board_data.description or "",
        "created_at": now,
        "updated_at": now,
        "image_ids": [],
        "user_id": user_id
    }
    
    boards_table.insert(board)
    
    return BoardResponse(**board)


@router.get("", response_model=List[BoardResponse])
async def get_boards(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get all boards for the current user.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    boards_table = db.table("boards")
    BoardQuery = Query()
    user_boards = boards_table.search(BoardQuery.user_id == user_id)
    
    # Sort boards: "My Creations" first, then alphabetically by name
    def sort_key(board):
        name = board.get("name", "")
        # "My Creations" gets priority (empty string sorts first)
        if name == "My Creations":
            return ("", name.lower())
        # All others sorted alphabetically
        return ("z", name.lower())
    
    user_boards.sort(key=sort_key)
    
    return [BoardResponse(**board) for board in user_boards]


@router.get("/{board_id}", response_model=BoardResponse)
async def get_board(
    board_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get a specific board by ID.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    boards_table = db.table("boards")
    BoardQuery = Query()
    board = boards_table.get(
        (BoardQuery.id == board_id) & (BoardQuery.user_id == user_id)
    )
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    return BoardResponse(**board)


@router.put("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: str,
    board_data: BoardUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Update a board's information.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    boards_table = db.table("boards")
    BoardQuery = Query()
    existing_board = boards_table.get(
        (BoardQuery.id == board_id) & (BoardQuery.user_id == user_id)
    )
    
    if not existing_board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    # Check for duplicate name if name is being updated
    if board_data.name and board_data.name != existing_board["name"]:
        DupQuery = Query()
        duplicate = boards_table.search(
            (DupQuery.user_id == user_id) & 
            (DupQuery.name == board_data.name) &
            (DupQuery.id != board_id)
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A board with this name already exists"
            )
    
    # Update fields
    update_data = {}
    if board_data.name is not None:
        update_data["name"] = board_data.name
    if board_data.emoji is not None:
        update_data["emoji"] = board_data.emoji
    if board_data.description is not None:
        update_data["description"] = board_data.description
    
    update_data["updated_at"] = int(datetime.now().timestamp() * 1000)
    
    UpdateQuery = Query()
    boards_table.update(
        update_data,
        (UpdateQuery.id == board_id) & (UpdateQuery.user_id == user_id)
    )
    
    # Fetch and return updated board
    FetchQuery = Query()
    updated_board = boards_table.get(
        (FetchQuery.id == board_id) & (FetchQuery.user_id == user_id)
    )
    
    return BoardResponse(**updated_board)


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Delete a board.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    boards_table = db.table("boards")
    BoardQuery = Query()
    board = boards_table.get(
        (BoardQuery.id == board_id) & (BoardQuery.user_id == user_id)
    )
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    DeleteQuery = Query()
    boards_table.remove(
        (DeleteQuery.id == board_id) & (DeleteQuery.user_id == user_id)
    )
    
    return None


class SaveImageToBoard(BaseModel):
    """Model for saving image with data to a board"""
    image_id: str
    image_data: str = Field(..., description="Base64 encoded image data")
    board_name: Optional[str] = None
    path: Optional[str] = None


@router.post("/{board_id}/images", response_model=BoardResponse)
async def add_images_to_board(
    board_id: str,
    data: BoardImageAdd,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Add images to a board.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    boards_table = db.table("boards")
    BoardQuery = Query()
    board = boards_table.get(
        (BoardQuery.id == board_id) & (BoardQuery.user_id == user_id)
    )
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    # Add new image IDs (avoid duplicates)
    current_images = set(board.get("image_ids", []))
    new_images = set(data.image_ids)
    updated_images = list(current_images | new_images)
    
    UpdateQuery = Query()
    boards_table.update(
        {
            "image_ids": updated_images,
            "updated_at": int(datetime.now().timestamp() * 1000)
        },
        (UpdateQuery.id == board_id) & (UpdateQuery.user_id == user_id)
    )
    
    # Fetch and return updated board
    FetchQuery = Query()
    updated_board = boards_table.get(
        (FetchQuery.id == board_id) & (FetchQuery.user_id == user_id)
    )
    
    return BoardResponse(**updated_board)


@router.post("/{board_id}/save-image", response_model=dict)
async def save_image_to_board(
    board_id: str,
    data: SaveImageToBoard,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Save an image with its data to a specific board.
    This endpoint handles both storing the image ID in the board and persisting image data.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    boards_table = db.table("boards")
    BoardQuery = Query()
    board = boards_table.get(
        (BoardQuery.id == board_id) & (BoardQuery.user_id == user_id)
    )
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    # Store image data in gallery table
    gallery_table = db.table("gallery")
    
    gallery_entry = {
        "id": data.image_id,
        "user_id": user_id,
        "board_id": board_id,
        "board_name": data.board_name or board["name"],
        "image_data": data.image_data,  # Base64 encoded image
        "path": data.path,
        "timestamp": int(datetime.now().timestamp() * 1000),
        "created_at": datetime.now().isoformat()
    }
    
    # Check if image already exists
    GalleryQuery = Query()
    existing = gallery_table.get(
        (GalleryQuery.id == data.image_id) & (GalleryQuery.user_id == user_id)
    )
    
    if existing:
        # Update existing entry
        gallery_table.update(gallery_entry, 
            (GalleryQuery.id == data.image_id) & (GalleryQuery.user_id == user_id)
        )
    else:
        # Insert new entry
        gallery_table.insert(gallery_entry)
    
    # Add image ID to board
    current_images = set(board.get("image_ids", []))
    current_images.add(data.image_id)
    
    UpdateQuery = Query()
    boards_table.update(
        {
            "image_ids": list(current_images),
            "updated_at": int(datetime.now().timestamp() * 1000)
        },
        (UpdateQuery.id == board_id) & (UpdateQuery.user_id == user_id)
    )
    
    return {
        "success": True,
        "image_id": data.image_id,
        "board_id": board_id,
        "message": f"Image saved to {board['name']}"
    }


@router.get("/{board_id}/images", response_model=List[dict])
async def get_board_images(
    board_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get all images from a specific board with their data.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    boards_table = db.table("boards")
    BoardQuery = Query()
    board = boards_table.get(
        (BoardQuery.id == board_id) & (BoardQuery.user_id == user_id)
    )
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    # Get all images for this board from gallery table
    gallery_table = db.table("gallery")
    GalleryQuery = Query()
    images = gallery_table.search(
        (GalleryQuery.board_id == board_id) & (GalleryQuery.user_id == user_id)
    )
    
    # Sort by timestamp descending (newest first)
    images.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    
    return images


@router.delete("/{board_id}/images/{image_id}", response_model=BoardResponse)
async def remove_image_from_board(
    board_id: str,
    image_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Remove an image from a board and delete its data.
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    boards_table = db.table("boards")
    BoardQuery = Query()
    board = boards_table.get(
        (BoardQuery.id == board_id) & (BoardQuery.user_id == user_id)
    )
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    # Remove image ID from board
    current_images = board.get("image_ids", [])
    updated_images = [img_id for img_id in current_images if img_id != image_id]
    
    UpdateQuery = Query()
    boards_table.update(
        {
            "image_ids": updated_images,
            "updated_at": int(datetime.now().timestamp() * 1000)
        },
        (UpdateQuery.id == board_id) & (UpdateQuery.user_id == user_id)
    )
    
    # Also delete image data from gallery table
    gallery_table = db.table("gallery")
    GalleryQuery = Query()
    gallery_table.remove(
        (GalleryQuery.id == image_id) & 
        (GalleryQuery.user_id == user_id) & 
        (GalleryQuery.board_id == board_id)
    )
    
    # Fetch and return updated board
    FetchQuery = Query()
    updated_board = boards_table.get(
        (FetchQuery.id == board_id) & (FetchQuery.user_id == user_id)
    )
    
    return BoardResponse(**updated_board)
