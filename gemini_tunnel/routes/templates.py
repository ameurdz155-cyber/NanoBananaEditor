"""Routes for prompt template management."""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from tinydb import Query

from database import get_table
from services.auth_service_db import get_current_user

router = APIRouter(prefix="/templates", tags=["Templates"])


DEFAULT_TEMPLATES: List[Dict[str, Any]] = [
    {
        "name": "Cinematic Portrait",
        "description": "Moody studio portrait with dramatic lighting and shallow depth of field.",
        "emoji": "🎬",
        "positivePrompt": (
            "cinematic portrait of a [subject], dramatic rim lighting, 85mm lens, f/1.4, ultrarealistic skin texture, "
            "cinematic color grading, volumetric fog, soft shadows, professional photography"
        ),
        "negativePrompt": (
            "low resolution, oversaturated, underexposed, overexposed, duplicated features, blurry, cartoon, painting"
        ),
        "category_name": "Portraits",
    },
    {
        "name": "Product Hero",
        "description": "Clean hero shot on colored backdrop for product campaigns.",
        "emoji": "🛍️",
        "positivePrompt": (
            "studio photography of [product], soft diffused lighting, colored backdrop, reflective surface, high contrast, "
            "commercial advertising style, 8k, ultra sharp focus"
        ),
        "negativePrompt": (
            "harsh shadows, fingerprints, dust, low resolution, motion blur, people, hands"
        ),
        "category_name": "Products",
    },
    {
        "name": "Epic Landscape",
        "description": "Sweeping golden hour landscape with atmospheric depth.",
        "emoji": "🌅",
        "positivePrompt": (
            "epic landscape of [environment], golden hour sunlight, volumetric clouds, dramatic sky, wide angle, high detail, "
            "atmospheric perspective, 16k"
        ),
        "negativePrompt": (
            "haze, washed out colors, low detail, people, buildings, artifacts"
        ),
        "category_name": "Landscapes",
    },
    {
        "name": "Social Media Quote",
        "description": "Bold typographic template for inspirational quotes.",
        "emoji": "📝",
        "positivePrompt": (
            "minimalist square graphic, bold typography, inspirational quote, gradient background, modern design, high contrast, "
            "clean layout, social media ready"
        ),
        "negativePrompt": (
            "cluttered, dated design, low contrast, noisy background"
        ),
        "category_name": "Favorites",
    },
]


class TemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    positivePrompt: str = Field(..., min_length=1, max_length=5000)
    negativePrompt: Optional[str] = Field(None, max_length=5000)
    categoryId: Optional[str] = Field(None, description="Associated category id")
    emoji: Optional[str] = Field(None, max_length=50)
    image: Optional[str] = Field(None, description="Base64 encoded image or URL")
    isDefault: Optional[bool] = Field(default=False)


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    positivePrompt: Optional[str] = Field(None, min_length=1, max_length=5000)
    negativePrompt: Optional[str] = Field(None, max_length=5000)
    categoryId: Optional[str] = Field(None, description="Associated category id")
    emoji: Optional[str] = Field(None, max_length=50)
    image: Optional[str] = Field(None, description="Base64 encoded image or URL")
    isDefault: Optional[bool] = None


class Template(TemplateBase):
    id: str
    createdAt: int
    updatedAt: int
    userId: str


def _ensure_category(user_id: str, category_name: str) -> Dict[str, Any]:
    """Find or create a category for the user by name."""
    categories_table = get_table("categories")
    Cat = Query()

    existing = categories_table.get((Cat.userId == user_id) & (Cat.name == category_name))
    if existing:
        return existing

    now = int(datetime.utcnow().timestamp() * 1000)
    new_category = {
        "id": f"cat-{uuid.uuid4().hex[:12]}",
        "name": category_name,
        "description": None,
        "emoji": "📁",
        "image": None,
        "isDefault": True,
        "createdAt": now,
        "updatedAt": now,
        "userId": user_id,
    }
    categories_table.insert(new_category)
    return new_category


def _seed_default_templates(user_id: str) -> List[Dict[str, Any]]:
    """Ensure the user has a starter set of prompt templates."""
    templates_table = get_table("templates")
    TemplateQuery = Query()

    seeded: List[Dict[str, Any]] = []
    for default_template in DEFAULT_TEMPLATES:
        existing = templates_table.get(
            (TemplateQuery.userId == user_id) & (TemplateQuery.name == default_template["name"])
        )
        if existing:
            seeded.append(existing)
            continue

        category_id: Optional[str] = None
        category_name = default_template.get("category_name")
        if category_name:
            category = _ensure_category(user_id, category_name)
            category_id = category["id"]

        now = int(datetime.utcnow().timestamp() * 1000)
        new_template = {
            "id": f"tpl-{uuid.uuid4().hex[:12]}",
            "name": default_template["name"],
            "description": default_template.get("description"),
            "positivePrompt": default_template["positivePrompt"],
            "negativePrompt": default_template.get("negativePrompt"),
            "categoryId": category_id,
            "emoji": default_template.get("emoji"),
            "image": default_template.get("image"),
            "isDefault": True,
            "createdAt": now,
            "updatedAt": now,
            "userId": user_id,
        }

        templates_table.insert(new_template)
        seeded.append(new_template)

    return seeded


def _validate_category_id(category_id: Optional[str], user_id: str) -> None:
    if not category_id:
        return

    categories_table = get_table("categories")
    Cat = Query()
    category = categories_table.get((Cat.id == category_id) & (Cat.userId == user_id))
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category reference")


@router.get("", response_model=List[Template])
async def list_templates(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return all templates for the current user."""
    templates_table = get_table("templates")
    TemplateQuery = Query()

    user_templates = templates_table.search(TemplateQuery.userId == current_user["id"])

    if not user_templates:
        user_templates = _seed_default_templates(current_user["id"])

    return user_templates


@router.post("", response_model=Template, status_code=201)
async def create_template(
    template: TemplateCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new prompt template."""
    templates_table = get_table("templates")
    TemplateQuery = Query()

    existing = templates_table.get(
        (TemplateQuery.userId == current_user["id"]) & (TemplateQuery.name == template.name)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Template with this name already exists")

    _validate_category_id(template.categoryId, current_user["id"])

    now = int(datetime.utcnow().timestamp() * 1000)
    new_template = {
        "id": f"tpl-{uuid.uuid4().hex[:12]}",
        "name": template.name,
        "description": template.description,
        "positivePrompt": template.positivePrompt,
        "negativePrompt": template.negativePrompt,
        "categoryId": template.categoryId,
        "emoji": template.emoji,
        "image": template.image,
        "isDefault": template.isDefault or False,
        "createdAt": now,
        "updatedAt": now,
        "userId": current_user["id"],
    }

    templates_table.insert(new_template)
    return new_template


@router.get("/{template_id}", response_model=Template)
async def get_template(
    template_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a single template by id."""
    templates_table = get_table("templates")
    TemplateQuery = Query()

    template = templates_table.get(
        (TemplateQuery.id == template_id) & (TemplateQuery.userId == current_user["id"])
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template


@router.put("/{template_id}", response_model=Template)
async def update_template(
    template_id: str,
    template_update: TemplateUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update an existing template."""
    templates_table = get_table("templates")
    TemplateQuery = Query()

    existing = templates_table.get(
        (TemplateQuery.id == template_id) & (TemplateQuery.userId == current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")

    if existing.get("isDefault") and template_update.isDefault is False:
        template_update.isDefault = True

    if template_update.name and template_update.name != existing["name"]:
        duplicate = templates_table.get(
            (TemplateQuery.userId == current_user["id"]) &
            (TemplateQuery.name == template_update.name) &
            (TemplateQuery.id != template_id)
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Template with this name already exists")

    if template_update.categoryId is not None:
        _validate_category_id(template_update.categoryId, current_user["id"])

    update_data = template_update.dict(exclude_unset=True)
    update_data["updatedAt"] = int(datetime.utcnow().timestamp() * 1000)

    templates_table.update(
        update_data,
        (TemplateQuery.id == template_id) & (TemplateQuery.userId == current_user["id"])
    )

    updated = templates_table.get(TemplateQuery.id == template_id)
    return updated


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a template."""
    templates_table = get_table("templates")
    TemplateQuery = Query()

    existing = templates_table.get(
        (TemplateQuery.id == template_id) & (TemplateQuery.userId == current_user["id"])
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")

    if existing.get("isDefault"):
        raise HTTPException(status_code=400, detail="Cannot delete default templates")

    templates_table.remove(
        (TemplateQuery.id == template_id) & (TemplateQuery.userId == current_user["id"])
    )

    return None
