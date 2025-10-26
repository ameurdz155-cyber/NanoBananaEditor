#!/bin/bash

echo "🎨 Converting icons for all platforms..."

# For macOS - Convert PNG to ICNS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Creating macOS ICNS file..."
    
    # Create iconset directory
    mkdir -p src-tauri/icons/icon.iconset
    
    # Generate all required sizes for macOS
    sips -z 16 16     src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_16x16.png
    sips -z 32 32     src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_16x16@2x.png
    sips -z 32 32     src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_32x32.png
    sips -z 64 64     src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_32x32@2x.png
    sips -z 128 128   src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_128x128.png
    sips -z 256 256   src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_128x128@2x.png
    sips -z 256 256   src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_256x256.png
    sips -z 512 512   src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_256x256@2x.png
    sips -z 512 512   src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_512x512.png
    sips -z 1024 1024 src-tauri/icons/icon.png --out src-tauri/icons/icon.iconset/icon_512x512@2x.png
    
    # Convert to ICNS
    iconutil -c icns src-tauri/icons/icon.iconset -o src-tauri/icons/icon.icns
    
    # Clean up
    rm -rf src-tauri/icons/icon.iconset
    
    echo "✅ macOS ICNS created successfully!"
fi

# For Linux/Windows with ImageMagick
if command -v convert &> /dev/null; then
    echo "Creating Windows ICO file with ImageMagick..."
    convert src-tauri/icons/icon.png -define icon:auto-resize=256,128,64,48,32,16 src-tauri/icons/icon.ico
    echo "✅ Windows ICO created successfully!"
else
    echo "⚠️  ImageMagick not found. Install it to generate ICO files:"
    echo "    Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "    macOS: brew install imagemagick"
    echo "    Windows: Download from https://imagemagick.org"
fi

echo "🎉 Icon conversion complete!"