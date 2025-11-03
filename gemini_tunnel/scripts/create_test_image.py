"""Generate test images for upscaling experiments."""
import os
from PIL import Image, ImageDraw, ImageFont

def create_simple_pattern(size=(256, 256), filename="test_simple.png"):
    """Create a simple colorful pattern."""
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw colorful squares
    colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
    square_size = size[0] // 3
    
    for i, color in enumerate(colors[:6]):
        row = i // 3
        col = i % 3
        x1 = col * square_size
        y1 = row * square_size
        x2 = x1 + square_size
        y2 = y1 + square_size
        draw.rectangle([x1, y1, x2, y2], fill=color, outline='black', width=2)
    
    img.save(filename)
    print(f"✓ Created {filename} ({size[0]}x{size[1]})")
    return filename


def create_gradient(size=(256, 256), filename="test_gradient.png"):
    """Create a smooth gradient."""
    img = Image.new('RGB', size)
    pixels = img.load()
    
    for x in range(size[0]):
        for y in range(size[1]):
            r = int(255 * (x / size[0]))
            g = int(255 * (y / size[1]))
            b = int(255 * ((x + y) / (size[0] + size[1])))
            pixels[x, y] = (r, g, b)
    
    img.save(filename)
    print(f"✓ Created {filename} ({size[0]}x{size[1]})")
    return filename


def create_text_image(size=(256, 256), filename="test_text.png"):
    """Create an image with text."""
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw border
    draw.rectangle([0, 0, size[0]-1, size[1]-1], outline='black', width=3)
    
    # Draw some shapes
    draw.ellipse([20, 20, 80, 80], fill='red', outline='darkred', width=2)
    draw.rectangle([100, 20, 160, 80], fill='blue', outline='darkblue', width=2)
    draw.polygon([(190, 80), (220, 20), (250, 80)], fill='green', outline='darkgreen')
    
    # Draw lines
    for i in range(0, size[0], 30):
        draw.line([(i, 100), (i + 20, 200)], fill='purple', width=2)
    
    # Try to add text (will use default font if custom font not available)
    try:
        draw.text((20, 220), "UPSCALE TEST", fill='black')
        draw.text((20, 240), f"{size[0]}x{size[1]}", fill='gray')
    except:
        pass
    
    img.save(filename)
    print(f"✓ Created {filename} ({size[0]}x{size[1]})")
    return filename


def create_photo_like(size=(512, 512), filename="test_photo.png"):
    """Create a more photo-like test image."""
    img = Image.new('RGB', size)
    pixels = img.load()
    
    # Create a landscape-like gradient
    for x in range(size[0]):
        for y in range(size[1]):
            if y < size[1] * 0.3:  # Sky
                r = int(135 - (y / size[1]) * 50)
                g = int(206 - (y / size[1]) * 50)
                b = 235
            elif y < size[1] * 0.5:  # Mountains
                shade = int(100 + (y / size[1]) * 50)
                r = g = b = shade
            else:  # Ground
                r = int(34 + (y / size[1]) * 50)
                g = int(139 - (y / size[1]) * 30)
                b = int(34 + (y / size[1]) * 20)
            pixels[x, y] = (r, g, b)
    
    # Add some circles to simulate trees/objects
    draw = ImageDraw.Draw(img)
    import random
    random.seed(42)
    
    for _ in range(10):
        x = random.randint(50, size[0] - 50)
        y = random.randint(int(size[1] * 0.6), size[1] - 50)
        r = random.randint(20, 40)
        color = (
            random.randint(20, 60),
            random.randint(80, 150),
            random.randint(20, 60)
        )
        draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
    
    img.save(filename)
    print(f"✓ Created {filename} ({size[0]}x{size[1]})")
    return filename


def create_checkerboard(size=(256, 256), squares=8, filename="test_checkerboard.png"):
    """Create a checkerboard pattern - good for testing upscaling quality."""
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    square_size = size[0] // squares
    
    for row in range(squares):
        for col in range(squares):
            if (row + col) % 2 == 0:
                x1 = col * square_size
                y1 = row * square_size
                x2 = x1 + square_size
                y2 = y1 + square_size
                draw.rectangle([x1, y1, x2, y2], fill='black')
    
    img.save(filename)
    print(f"✓ Created {filename} ({size[0]}x{size[1]}, {squares}x{squares} checkerboard)")
    return filename


if __name__ == "__main__":
    print("=" * 60)
    print("Generating test images for upscaling...")
    print("=" * 60)
    
    # Create output directory if it doesn't exist
    output_dir = "test_images"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}/\n")
    
    # Generate various test images
    images_created = []
    
    print("\n📸 Creating test images...")
    print("-" * 60)
    
    # Small images (good for quick tests)
    images_created.append(create_simple_pattern((128, 128), f"{output_dir}/small_pattern.png"))
    images_created.append(create_gradient((128, 128), f"{output_dir}/small_gradient.png"))
    images_created.append(create_checkerboard((128, 128), 8, f"{output_dir}/small_checkerboard.png"))
    
    # Medium images (standard test size)
    images_created.append(create_simple_pattern((256, 256), f"{output_dir}/medium_pattern.png"))
    images_created.append(create_gradient((256, 256), f"{output_dir}/medium_gradient.png"))
    images_created.append(create_text_image((256, 256), f"{output_dir}/medium_text.png"))
    images_created.append(create_checkerboard((256, 256), 16, f"{output_dir}/medium_checkerboard.png"))
    
    # Larger images (more realistic)
    images_created.append(create_photo_like((512, 512), f"{output_dir}/photo_landscape.png"))
    images_created.append(create_simple_pattern((512, 512), f"{output_dir}/large_pattern.png"))
    
    print("\n" + "=" * 60)
    print(f"✓ Successfully created {len(images_created)} test images!")
    print("=" * 60)
    print(f"\n📁 All images saved in: {output_dir}/")
    print("\nRecommended images for upscaling tests:")
    print("  • medium_pattern.png     - Good for testing color preservation")
    print("  • medium_checkerboard.png - Good for testing edge sharpness")
    print("  • photo_landscape.png    - Good for realistic scenarios")
    print("  • small_gradient.png     - Quick test for smooth transitions")
    print("\n💡 Tip: Start with small images for faster testing!")
