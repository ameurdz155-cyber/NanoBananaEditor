@echo off
echo Converting icons for Windows...

REM This script helps convert PNG to ICO format for Windows
REM Requires ImageMagick or similar tool to be installed

echo.
echo To properly convert icons for Windows:
echo 1. Install ImageMagick: https://imagemagick.org/script/download.php#windows
echo 2. Run: magick convert src-tauri/icons/icon.png -define icon:auto-resize=256,128,64,48,32,16 src-tauri/icons/icon.ico
echo.
echo Or use an online converter:
echo - https://convertio.co/png-ico/
echo - https://www.icoconverter.com/
echo.
pause