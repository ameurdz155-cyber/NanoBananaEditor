"""
Migrate category images from base64 to asset files.
"""
import base64
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tinydb import TinyDB, Query

# Paths
DB_PATH = Path(__file__).parent.parent / "ai_pod.json"
ASSETS_DIR = Path(__file__).parent.parent / "assets" / "categories"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)


def save_base64_image(image_data: str, category_id: str) -> str:
    """Convert base64 image to file and return URL path."""
    if not image_data or not image_data.startswith("data:image"):
        return image_data
    
    try:
        # Extract base64 data
        header, encoded = image_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        
        # Determine file extension
        if "jpeg" in header or "jpg" in header:
            ext = "jpg"
        elif "png" in header:
            ext = "png"
        elif "gif" in header:
            ext = "gif"
        elif "webp" in header:
            ext = "webp"
        else:
            ext = "jpg"
        
        # Save file
        filename = f"{category_id}.{ext}"
        filepath = ASSETS_DIR / filename
        
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        print(f"  ✓ Saved {filename} ({len(image_bytes)} bytes)")
        return f"/assets/categories/{filename}"
    
    except Exception as e:
        print(f"  ✗ Error saving image for {category_id}: {e}")
        return None


def main():
    """Migrate all base64 images to asset files."""
    db = TinyDB(DB_PATH)
    categories_table = db.table("categories")
    
    all_categories = categories_table.all()
    print(f"Found {len(all_categories)} categories\n")
    
    migrated = 0
    skipped = 0
    errors = 0
    
    for cat in all_categories:
        image = cat.get("image")
        cat_id = cat.get("id")
        cat_name = cat.get("name", "Unknown")
        
        if not image:
            print(f"⊘ {cat_name} ({cat_id}): No image")
            skipped += 1
            continue
        
        if image.startswith("/assets/"):
            print(f"⊘ {cat_name} ({cat_id}): Already migrated")
            skipped += 1
            continue
        
        if image.startswith("data:image"):
            print(f"→ {cat_name} ({cat_id}): Migrating base64 image...")
            new_url = save_base64_image(image, cat_id)
            
            if new_url:
                # Update database
                categories_table.update(
                    {"image": new_url},
                    Query().id == cat_id
                )
                migrated += 1
            else:
                errors += 1
        else:
            print(f"? {cat_name} ({cat_id}): Unknown image format")
            skipped += 1
    
    print(f"\n{'='*50}")
    print(f"Migration complete!")
    print(f"  Migrated: {migrated}")
    print(f"  Skipped:  {skipped}")
    print(f"  Errors:   {errors}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
