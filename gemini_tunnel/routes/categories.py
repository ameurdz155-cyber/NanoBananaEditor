"""Routes for prompt category management."""

import base64
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel, Field
from tinydb import Query

from database import get_table
from services.auth_service_db import get_current_user


router = APIRouter(prefix="/categories", tags=["Categories"])

# Base path for category assets
ASSETS_DIR = Path(__file__).parent.parent / "assets" / "categories"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)


async def save_category_image(image_data: str, category_id: str) -> str:
    """
    Save category image from base64 or URL.
    Returns the URL path to the saved asset.
    """
    # If it's already a URL path, return it
    if image_data and image_data.startswith("/assets/"):
        return image_data
    
    # If it's a base64 image, save it as a file
    if image_data and image_data.startswith("data:image"):
        # Extract base64 data
        header, encoded = image_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        
        # Determine file extension from header
        if "jpeg" in header or "jpg" in header:
            ext = "jpg"
        elif "png" in header:
            ext = "png"
        elif "gif" in header:
            ext = "gif"
        elif "webp" in header:
            ext = "webp"
        else:
            ext = "jpg"  # default
        
        # Save file
        filename = f"{category_id}.{ext}"
        filepath = ASSETS_DIR / filename
        
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        return f"/assets/categories/{filename}"
    
    return None


async def save_uploaded_file(file: UploadFile, category_id: str) -> str:
    """
    Save uploaded file and return URL path.
    """
    # Determine extension from content type or filename
    content_type = file.content_type or ""
    if "jpeg" in content_type or "jpg" in content_type:
        ext = "jpg"
    elif "png" in content_type:
        ext = "png"
    elif "gif" in content_type:
        ext = "gif"
    elif "webp" in content_type:
        ext = "webp"
    elif file.filename:
        ext = file.filename.split(".")[-1]
    else:
        ext = "jpg"
    
    filename = f"{category_id}.{ext}"
    filepath = ASSETS_DIR / filename
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    return f"/assets/categories/{filename}"


def delete_category_image(category_id: str):
    """Delete all image files for a category."""
    for ext in ["jpg", "jpeg", "png", "gif", "webp"]:
        filepath = ASSETS_DIR / f"{category_id}.{ext}"
        if filepath.exists():
            filepath.unlink()


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
    
    # Convert any base64 images to asset URLs
    result = []
    for cat in user_categories:
        image = cat.get("image")
        
        # If image is base64, convert it to an asset file
        if image and image.startswith("data:image"):
            try:
                image_url = await save_category_image(image, cat["id"])
                # Update the database with the new URL
                categories_table.update(
                    {"image": image_url},
                    Cat.id == cat["id"]
                )
                cat["image"] = image_url
            except Exception as e:
                import logging
                logging.error(f"Failed to convert base64 image for category {cat['id']}: {e}")
                cat["image"] = None
        
        result.append({
            "id": cat["id"],
            "name": cat["name"],
            "description": cat.get("description"),
            "emoji": cat.get("emoji"),
            "image": cat.get("image"),
            "isDefault": cat.get("isDefault", False),
            "createdAt": cat["createdAt"],
            "updatedAt": cat["updatedAt"],
            "userId": cat["userId"]
        })
    
    return result


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
    
    # Generate category ID
    category_id = f"cat-{uuid.uuid4().hex[:12]}"
    
    # Handle image - save as asset if base64
    image_url = None
    if category.image:
        image_url = await save_category_image(category.image, category_id)
    
    # Create new category
    now = int(datetime.utcnow().timestamp() * 1000)  # milliseconds
    new_category = {
        "id": category_id,
        "name": category.name,
        "description": category.description,
        "emoji": category.emoji or "📁",
        "image": image_url,  # Save as URL path, not base64
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
    
    # Handle image update - convert base64 to asset URL
    if "image" in update_data and update_data["image"]:
        # Delete old image if exists
        if existing.get("image") and existing["image"].startswith("/assets/"):
            delete_category_image(category_id)
        # Save new image
        image_url = await save_category_image(update_data["image"], category_id)
        update_data["image"] = image_url
        update_data["emoji"] = None
    elif "emoji" in update_data and update_data["emoji"]:
        # If setting emoji, delete image file
        if existing.get("image") and existing["image"].startswith("/assets/"):
            delete_category_image(category_id)
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
    
    # Don't allow deleting default categories
    if existing.get("isDefault"):
        raise HTTPException(status_code=400, detail="Cannot delete default categories")
    
    # Delete associated image file if exists
    if existing.get("image") and existing["image"].startswith("/assets/"):
        delete_category_image(category_id)
    
    # Delete the category
    categories_table.remove(
        (Cat.id == category_id) & (Cat.userId == current_user["id"])
    )
    
    return None
