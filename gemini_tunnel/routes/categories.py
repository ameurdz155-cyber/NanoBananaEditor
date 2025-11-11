"""Routes for prompt category management."""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from tinydb import Query

from database import get_table
from services.auth_service_db import get_current_user


router = APIRouter(prefix="/categories", tags=["Categories"])

DEFAULT_CATEGORIES: List[Dict[str, Any]] = [
    {
        "name": "Favorites",
        "description": "Go-to prompts and inspiration you reach for often.",
        "emoji": "⭐",
        "isDefault": True,
    },
    {
        "name": "Portraits",
        "description": "Portrait photography, character studies, and close-ups.",
        "emoji": "🧑",
        "isDefault": True,
    },
    {
        "name": "Landscapes",
        "description": "Outdoor scenery, nature shots, and wide vistas.",
        "emoji": "🌄",
        "isDefault": True,
    },
    {
        "name": "Products",
        "description": "Product renders, mockups, and marketing visuals.",
        "emoji": "📦",
        "isDefault": True,
    },
]


def _seed_default_categories(user_id: str) -> List[Dict[str, Any]]:
    """Ensure the user has a baseline set of categories for the UI."""
    categories_table = get_table("categories")
    Cat = Query()

    now = int(datetime.utcnow().timestamp() * 1000)
    seeded: List[Dict[str, Any]] = []

    for default_category in DEFAULT_CATEGORIES:
        # Avoid inserting duplicates if the category already exists for the user.
        existing = categories_table.get(
            (Cat.userId == user_id) & (Cat.name == default_category["name"])
        )
        if existing:
            seeded.append(existing)
            continue

        new_category = {
            "id": f"cat-{uuid.uuid4().hex[:12]}",
            "name": default_category["name"],
            "description": default_category.get("description"),
            "emoji": default_category.get("emoji", "📁"),
            "image": None,
            "isDefault": default_category.get("isDefault", False),
            "createdAt": now,
            "updatedAt": now,
            "userId": user_id,
        }

        categories_table.insert(new_category)
        seeded.append(new_category)

    return seeded


# Pydantic Models
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    emoji: Optional[str] = Field(None, max_length=10)
    image: Optional[str] = Field(None, description="Base64 encoded image or URL")
    isDefault: Optional[bool] = Field(default=False)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    emoji: Optional[str] = Field(None, max_length=10)
    image: Optional[str] = None
    isDefault: Optional[bool] = None


class Category(CategoryBase):
    id: str
    createdAt: int
    updatedAt: int
    userId: str


@router.get("", response_model=List[Category])
async def get_categories(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all categories for the current user."""
    categories_table = get_table("categories")
    Cat = Query()
    
    # Get user's categories
    user_categories = categories_table.search(Cat.userId == current_user["id"])

    if not user_categories:
        user_categories = _seed_default_categories(current_user["id"])
    
    return [
        {
            "id": cat["id"],
            "name": cat["name"],
            "description": cat.get("description"),
            "emoji": cat.get("emoji"),
            "image": cat.get("image"),
            "isDefault": cat.get("isDefault", False),
            "createdAt": cat["createdAt"],
            "updatedAt": cat["updatedAt"],
            "userId": cat["userId"]
        }
        for cat in user_categories
    ]


@router.post("", response_model=Category, status_code=201)
async def create_category(
    category: CategoryCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new category."""
    categories_table = get_table("categories")
    Cat = Query()
    
    # Check if category name already exists for this user
    existing = categories_table.search(
        (Cat.userId == current_user["id"]) & (Cat.name == category.name)
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    # Create new category
    now = int(datetime.utcnow().timestamp() * 1000)  # milliseconds
    new_category = {
        "id": f"cat-{uuid.uuid4().hex[:12]}",
        "name": category.name,
        "description": category.description,
        "emoji": category.emoji or "📁",
        "image": category.image,
        "isDefault": category.isDefault or False,
        "createdAt": now,
        "updatedAt": now,
        "userId": current_user["id"]
    }
    
    categories_table.insert(new_category)
    
    return new_category


@router.get("/{category_id}", response_model=Category)
async def get_category(
    category_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific category by ID."""
    categories_table = get_table("categories")
    Cat = Query()
    
    category = categories_table.get(
        (Cat.id == category_id) & (Cat.userId == current_user["id"])
    )
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category


@router.put("/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    category_update: CategoryUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update a category."""
    import logging
    logger = logging.getLogger(__name__)
    
    categories_table = get_table("categories")
    Cat = Query()
    
    # Find the category
    existing = categories_table.get(
        (Cat.id == category_id) & (Cat.userId == current_user["id"])
    )
    
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    logger.info(f"[Categories] Updating category {category_id}")
    logger.info(f"[Categories] Existing category: {existing}")
    logger.info(f"[Categories] Update data: {category_update.dict(exclude_unset=True)}")
    
    # Check if new name conflicts with another category
    if category_update.name and category_update.name != existing["name"]:
        name_conflict = categories_table.search(
            (Cat.userId == current_user["id"]) & 
            (Cat.name == category_update.name) & 
            (Cat.id != category_id)
        )
        if name_conflict:
            raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    # Update fields
    update_data = category_update.dict(exclude_unset=True)
    update_data["updatedAt"] = int(datetime.utcnow().timestamp() * 1000)
    
    # If setting image, clear emoji and vice versa
    if "image" in update_data and update_data["image"]:
        update_data["emoji"] = None
    elif "emoji" in update_data and update_data["emoji"]:
        update_data["image"] = None
    
    logger.info(f"[Categories] Final update_data to save: {update_data}")
    
    categories_table.update(
        update_data,
        (Cat.id == category_id) & (Cat.userId == current_user["id"])
    )
    
    # Get updated category
    updated = categories_table.get(Cat.id == category_id)
    logger.info(f"[Categories] Updated category from DB: {updated}")
    return updated


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a category."""
    categories_table = get_table("categories")
    Cat = Query()
    
    # Find the category
    existing = categories_table.get(
        (Cat.id == category_id) & (Cat.userId == current_user["id"])
    )
    
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Delete the category
    categories_table.remove(
        (Cat.id == category_id) & (Cat.userId == current_user["id"])
    )
    
    return None
