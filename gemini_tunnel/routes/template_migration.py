"""
Automatic migration utility for converting base64 template images to assets.
This runs automatically when templates are fetched to ensure optimal performance.
"""

import base64
import uuid
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Import from assets module to share metadata
try:
    from routes.assets import TEMP_ASSETS_DIR, _asset_metadata
except ImportError:
    # Fallback if import fails
    TEMP_ASSETS_DIR = Path("temp_assets")
    TEMP_ASSETS_DIR.mkdir(exist_ok=True)
    _asset_metadata: Dict[str, Dict[str, Any]] = {}


def is_base64_image(image_value: Optional[str]) -> bool:
    """Check if image value is a base64 data URL."""
    if not image_value:
        return False
    return image_value.strip().startswith("data:image/")


def extract_base64_data(data_url: str) -> tuple[bytes, str, str]:
    """
    Extract image bytes and metadata from a base64 data URL.
    Returns: (image_bytes, mime_type, file_extension)
    """
    try:
        # Split header and data
        if "," not in data_url:
            raise ValueError("Invalid data URL format")
        
        header, encoded = data_url.split(",", 1)
        
        # Extract mime type
        mime_type = "image/png"  # default
        if ":" in header and ";" in header:
            mime_part = header.split(":", 1)[1].split(";", 1)[0]
            if mime_part.startswith("image/"):
                mime_type = mime_part
        
        # Determine file extension
        if "jpeg" in mime_type or "jpg" in mime_type:
            ext = ".jpg"
        elif "png" in mime_type:
            ext = ".png"
        elif "gif" in mime_type:
            ext = ".gif"
        elif "webp" in mime_type:
            ext = ".webp"
        else:
            ext = ".jpg"
        
        # Decode base64
        image_bytes = base64.b64decode(encoded)
        
        return image_bytes, mime_type, ext
        
    except Exception as e:
        logger.error(f"Failed to extract base64 data: {e}")
        raise ValueError(f"Invalid base64 image data: {e}")


def save_base64_as_asset(base64_data_url: str, user_id: str) -> str:
    """
    Convert a base64 data URL to an asset file and return the asset URL.
    
    Args:
        base64_data_url: Base64 encoded image data URL
        user_id: User ID for asset ownership tracking
        
    Returns:
        Asset URL path (e.g., "/api/v1/assets/{asset_id}")
    """
    try:
        # Extract image data
        image_bytes, mime_type, ext = extract_base64_data(base64_data_url)
        
        # Generate unique asset ID
        asset_id = str(uuid.uuid4())
        filename = f"{asset_id}{ext}"
        file_path = TEMP_ASSETS_DIR / filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        
        # Store metadata
        _asset_metadata[asset_id] = {
            "filename": filename,
            "original_filename": f"migrated-template{ext}",
            "content_type": mime_type,
            "size": len(image_bytes),
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "migrated": True  # Mark as auto-migrated
        }
        
        asset_url = f"/api/v1/assets/{asset_id}"
        logger.info(f"Migrated base64 image to asset: {asset_url} ({len(image_bytes)} bytes)")
        
        return asset_url
        
    except Exception as e:
        logger.error(f"Failed to save base64 as asset: {e}")
        # Return original if migration fails to prevent data loss
        return base64_data_url


def migrate_template_image(template: Dict[str, Any]) -> tuple[Dict[str, Any], bool]:
    """
    Check template image and migrate to asset if it's base64.
    
    Args:
        template: Template dictionary
        
    Returns:
        Tuple of (updated_template, was_migrated)
    """
    image_value = template.get("image")
    
    # Skip if no image or already an asset/URL
    if not image_value or not is_base64_image(image_value):
        return template, False
    
    try:
        # Convert base64 to asset
        user_id = template.get("userId", "unknown")
        asset_url = save_base64_as_asset(image_value, user_id)
        
        # Update template with asset URL
        template["image"] = asset_url
        
        logger.info(f"Auto-migrated template '{template.get('name')}' (ID: {template.get('id')}) from base64 to asset")
        
        return template, True
        
    except Exception as e:
        logger.error(f"Failed to migrate template image: {e}")
        # Keep original on failure
        return template, False


def migrate_templates_batch(templates: list[Dict[str, Any]], save_callback=None) -> tuple[list[Dict[str, Any]], int]:
    """
    Migrate multiple templates from base64 to assets.
    
    Args:
        templates: List of template dictionaries
        save_callback: Optional function to save updated templates to DB
        
    Returns:
        Tuple of (updated_templates, migration_count)
    """
    updated_templates = []
    migration_count = 0
    
    for template in templates:
        updated_template, was_migrated = migrate_template_image(template)
        updated_templates.append(updated_template)
        
        if was_migrated:
            migration_count += 1
            
            # Save to database if callback provided
            if save_callback:
                try:
                    save_callback(updated_template)
                except Exception as e:
                    logger.error(f"Failed to save migrated template: {e}")
    
    if migration_count > 0:
        logger.info(f"Auto-migrated {migration_count} template(s) from base64 to assets")
    
    return updated_templates, migration_count
