# Changelog

All notable changes to AI Image Studio Pro will be documented in this file.

## [2.0.0] - 2025-01-07

### 🎉 Major Release - CodeCanyon Edition

#### Added
- **Desktop Application**: Full Tauri-based desktop app for Windows, macOS, and Linux
- **Settings Panel**: Built-in API key management with secure local storage
- **Professional Branding**: Complete rebrand as AI Image Studio Pro
- **Icon System**: Custom application icons for all platforms
- **Offline Caching**: IndexedDB integration for offline asset access
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
- **Export Features**: High-quality PNG export functionality
- **History Panel**: Visual generation history with thumbnails
- **Mask Tools**: Advanced masking with variable brush sizes
- **Error Handling**: Improved error messages and user feedback

#### Changed
- Migrated from web-only to desktop application
- Updated UI with professional dark theme
- Improved canvas performance with Konva.js optimizations
- Enhanced prompt composer with better UX
- Refactored state management for better performance

#### Security
- API keys now stored locally (never transmitted)
- Removed all external tracking
- Enhanced input sanitization

#### Technical
- Built with Tauri 2.0 for native performance
- TypeScript strict mode enabled
- Reduced bundle size by 30%
- Optimized image processing pipeline

### Installation
- Windows: MSI installer
- macOS: DMG installer  
- Linux: AppImage and DEB packages

---

## [1.5.0] - 2024-12-15

### Added
- Reference image support (up to 2 images)
- Temperature/creativity control
- Seed control for reproducible generations
- SynthID watermarking

### Changed
- Upgraded to Gemini 2.5 Flash Image model
- Improved generation speed by 40%
- Enhanced mask painting precision

### Fixed
- Canvas zoom issues on mobile devices
- Memory leaks in history panel
- API timeout handling

---

## [1.0.0] - 2024-11-01

### 🚀 Initial Release

#### Features
- Text-to-image generation
- Basic image editing with prompts
- Simple masking tools
- Download functionality
- Basic history tracking

#### Known Issues
- Limited to 1024x1024 output
- No offline support
- Basic error handling

---

## Roadmap

### Version 2.1 (Q2 2025)
- [ ] Batch generation support
- [ ] Custom aspect ratios
- [ ] Image upscaling
- [ ] Prompt templates library

### Version 2.2 (Q3 2025)
- [ ] Plugin system
- [ ] Custom filters
- [ ] Animation support
- [ ] Advanced selection tools

### Version 3.0 (Q4 2025)
- [ ] Multi-model support
- [ ] Cloud sync functionality
- [ ] Team collaboration features
- [ ] API for third-party integrations

---

For feature requests and bug reports, please contact through CodeCanyon.

**AI Image Studio Pro** - Professional AI Image Generation & Editing