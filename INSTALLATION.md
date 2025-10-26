# AI Image Studio Pro - Installation Guide

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Ubuntu 20.04+
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 200MB available space
- **Internet**: Required for AI image generation

### API Requirements
- Google Gemini API key (free tier available)
- Get your key at: https://aistudio.google.com/app/apikey

## 🚀 Quick Installation

### Windows
1. Download `AI-Image-Studio-Pro_2.0.0_x64.msi`
2. Double-click to run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### macOS
1. Download `AI-Image-Studio-Pro_2.0.0_x64.dmg`
2. Open the DMG file
3. Drag the app to Applications folder
4. Launch from Applications or Launchpad

### Linux (AppImage)
1. Download `AI-Image-Studio-Pro_2.0.0_amd64.AppImage`
2. Make it executable: `chmod +x AI-Image-Studio-Pro_2.0.0_amd64.AppImage`
3. Run: `./AI-Image-Studio-Pro_2.0.0_amd64.AppImage`

### Linux (Debian/Ubuntu)
1. Download `AI-Image-Studio-Pro_2.0.0_amd64.deb`
2. Install: `sudo dpkg -i AI-Image-Studio-Pro_2.0.0_amd64.deb`
3. Launch from Applications menu

## ⚙️ First-Time Setup

### Step 1: Launch the Application
Open AI Image Studio Pro from your applications menu or desktop.

### Step 2: Configure API Key
1. Click the **Settings** button (⚙️) in the header
2. Enter your Gemini API key
3. Click **Save**
4. The key is stored securely on your device

### Step 3: Test the Setup
1. Switch to **Generate** mode
2. Enter a simple prompt like "a beautiful sunset"
3. Click **Generate** or press `Ctrl+Enter`
4. If an image appears, setup is complete!

## 🔧 Building from Source

### Prerequisites
- Node.js 18+ and npm
- Rust (for Tauri)
- Git

### Build Steps
```bash
# Clone the repository
git clone [repository-url]
cd ai-image-studio-pro

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run tauri:build
```

## 🆘 Troubleshooting

### API Key Not Working
- Verify your key at https://aistudio.google.com/app/apikey
- Ensure you have API quota remaining
- Check your internet connection

### App Won't Launch
- **Windows**: Run as Administrator
- **macOS**: Allow in System Preferences > Security & Privacy
- **Linux**: Check dependencies with `ldd`

### Generation Fails
- Check Settings for valid API key
- Verify internet connection
- Try a simpler prompt
- Check console for error messages (F12)

### Performance Issues
- Close other heavy applications
- Ensure adequate RAM available
- Try smaller image operations first

## 📞 Support

For technical support:
- Check the documentation
- Contact through CodeCanyon messaging
- Include your OS and error messages

## 📝 License

This software is licensed for use according to CodeCanyon's standard license terms.

---

**Version**: 2.0.0  
**Last Updated**: 2025