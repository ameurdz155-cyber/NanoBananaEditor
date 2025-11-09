# VIS Brand Color System

## Overview

The **VIS (Visual Identity System) Brand Color System** is a comprehensive design system based on the Upscale Panel design. It features a dark-first theme with **Teal/Cyan** as the primary brand color and **Purple** as the secondary accent color.

---

## 🎨 Color Philosophy

### Primary Brand Colors
- **Teal (#14b8a6)**: Main brand identity, used for primary actions, highlights, and interactive elements
- **Cyan (#06b6d4)**: Complementary color for gradients and accents

### Secondary Brand Colors
- **Purple (#a855f7)**: Secondary accent for variety and visual interest

### Design Language
- **Dark-first approach**: Optimized for dark mode with light mode support
- **High contrast**: Ensures readability and accessibility
- **Ambient backgrounds**: Subtle mesh gradients for depth
- **Consistent shadows**: Layered UI with proper elevation

---

## 📁 File Structure

```
src/styles/
├── vis-colors.css              # Main CSS variables and utilities
├── vis-tailwind-extend.js      # Tailwind configuration extension
└── theme.css                   # Existing theme (integrate VIS into this)
```

---

## 🚀 Installation & Setup

### Step 1: Import VIS Colors

Add to your `src/index.css` (after existing imports):

```css
@import './styles/vis-colors.css';
```

### Step 2: Extend Tailwind Config

Update `tailwind.config.js`:

```javascript
import { visColorExtension } from './src/styles/vis-tailwind-extend.js';

export default {
  // ... existing config
  theme: {
    extend: {
      colors: {
        ...visColorExtension.colors,
      },
      backgroundColor: {
        ...visColorExtension.backgroundColor,
      },
      borderColor: {
        ...visColorExtension.borderColor,
      },
      textColor: {
        ...visColorExtension.textColor,
      },
      boxShadow: {
        ...visColorExtension.boxShadow,
      },
      backgroundImage: {
        ...visColorExtension.backgroundImage,
      },
    },
  },
};
```

---

## 🎯 Usage Examples

### CSS Variables (Recommended)

```css
.custom-panel {
  background: var(--vis-panel-bg);
  border: 1px solid var(--vis-border-teal);
  color: var(--vis-text-primary);
  box-shadow: var(--vis-shadow-glow-teal);
}

.custom-button {
  background: var(--vis-button-teal-bg);
  color: white;
}

.custom-button:hover {
  background: var(--vis-button-teal-hover);
  box-shadow: var(--vis-glow-teal-md);
}
```

### Tailwind Classes

```tsx
// Background colors
<div className="bg-vis-teal-500">Teal background</div>
<div className="bg-vis-cyan-400">Cyan background</div>
<div className="bg-vis-purple-600">Purple background</div>

// Text colors
<p className="text-vis-teal">Teal text</p>
<p className="text-vis-cyan">Cyan text</p>
<p className="text-vis-purple">Purple text</p>

// Borders
<div className="border border-vis-teal">Teal border</div>
<div className="border border-vis-purple-light">Light purple border</div>

// Shadows & Glows
<div className="shadow-vis-glow-teal">Teal glow effect</div>
<div className="shadow-vis-glow-purple">Purple glow effect</div>

// Gradients
<div className="bg-vis-gradient-teal">Teal gradient</div>
<div className="bg-vis-gradient-brand">Brand gradient (Teal + Purple)</div>
<div className="bg-vis-gradient-mesh">Ambient mesh background</div>
```

### React Component Example

```tsx
import React from 'react';

const UpscaleButton: React.FC = () => {
  return (
    <button
      className="
        px-6 py-3 rounded-full
        bg-vis-teal-500 hover:bg-vis-teal-600
        text-white font-semibold
        border border-vis-teal-light
        shadow-vis-glow-teal hover:shadow-vis-glow-teal-lg
        transition-all duration-300
      "
    >
      Upscale Image
    </button>
  );
};

const UpscalePanel: React.FC = () => {
  return (
    <div className="bg-vis-panel rounded-xl border border-vis-teal-light shadow-vis-glow-teal">
      <header className="px-4 py-3 border-b border-vis-default">
        <h2 className="text-vis-teal uppercase tracking-wider">
          Image Upscaling
        </h2>
      </header>
      
      <div className="p-4 space-y-4">
        <div className="border border-dashed border-vis-teal-light rounded-lg p-4 bg-vis-card">
          <p className="text-vis-secondary">Upload your image</p>
        </div>
        
        <UpscaleButton />
      </div>
    </div>
  );
};
```

---

## 🎨 Color Palette Reference

### Teal Scale
| Shade | Hex | Usage |
|-------|-----|-------|
| 50 | `#f0fdfa` | Very light backgrounds |
| 100 | `#ccfbf1` | Light backgrounds |
| 200 | `#99f6e4` | Subtle highlights |
| 300 | `#5eead4` | Light text |
| 400 | `#2dd4bf` | Medium accents |
| **500** | **`#14b8a6`** | **Primary brand** |
| 600 | `#0d9488` | Hover states |
| 700 | `#0f766e` | Active states |
| 800 | `#115e59` | Dark accents |
| 900 | `#134e4a` | Very dark |

### Cyan Scale
| Shade | Hex | Usage |
|-------|-----|-------|
| 300 | `#67e8f9` | Light cyan |
| 400 | `#22d3ee` | Medium cyan |
| **500** | **`#06b6d4`** | **Primary cyan** |
| 600 | `#0891b2` | Dark cyan |

### Purple Scale
| Shade | Hex | Usage |
|-------|-----|-------|
| 400 | `#c084fc` | Light purple |
| **500** | **`#a855f7`** | **Primary purple** |
| 600 | `#9333ea` | Dark purple |
| 700 | `#7e22ce` | Very dark purple |

---

## 🧩 Component Patterns

### Panel with Teal Accent

```tsx
<div className="rounded-xl border border-gray-800 bg-gray-900/70 shadow-vis-glow-teal">
  <header className="px-4 py-3 border-b border-gray-800/80">
    <p className="text-sm uppercase tracking-wider text-vis-teal-300 font-medium">
      Panel Title
    </p>
  </header>
  <div className="p-4">
    {/* Panel content */}
  </div>
</div>
```

### Dashed Border Upload Area

```tsx
<div className="rounded-lg border border-dashed border-vis-teal-light bg-gray-900/60 p-4">
  <p className="text-vis-secondary">Upload area</p>
</div>
```

### Teal Outline Button

```tsx
<button className="
  rounded-full border border-vis-teal-light
  text-vis-teal hover:text-vis-teal-bright
  hover:border-vis-teal hover:bg-vis-teal/10
  px-4 py-2 transition-all
">
  Action Button
</button>
```

### Scale Toggle Buttons

```tsx
<div className="grid grid-cols-2 gap-2">
  <button className="h-11 rounded-lg bg-vis-teal-500 text-white">
    2x
  </button>
  <button className="h-11 rounded-lg border border-vis-default text-vis-secondary hover:bg-vis-hover">
    4x
  </button>
</div>
```

### Slider with Teal Accent

```tsx
<input
  type="range"
  className="w-full h-2 rounded-full bg-gray-800/70 accent-vis-teal-400"
/>
```

---

## 🌓 Dark Mode & Light Mode

The VIS color system is **dark-first** but fully supports light mode.

### Dark Mode (Default)
- Uses ultra-dark backgrounds (`#0a0a0f`, `#0e0e14`)
- High contrast text
- Vibrant teal/cyan accents
- Strong shadows and glows

### Light Mode
- Light backgrounds (`#f8fafc`, `#ffffff`)
- Adjusted text colors for readability
- Softer shadows
- More subtle glows

All CSS variables automatically adjust based on the root class:

```html
<!-- Dark mode (default) -->
<html class="dark">

<!-- Light mode -->
<html class="light">
```

---

## 📊 Semantic Colors

### Success (Teal/Green)
```css
background: var(--vis-success-bg);
border: var(--vis-success-border);
color: var(--vis-success-text);
```

### Error (Red)
```css
background: var(--vis-error-bg);
border: var(--vis-error-border);
color: var(--vis-error-text);
```

### Warning (Amber)
```css
background: var(--vis-warning-bg);
border: var(--vis-warning-border);
color: var(--vis-warning-text);
```

### Info (Blue)
```css
background: var(--vis-info-bg);
border: var(--vis-info-border);
color: var(--vis-info-text);
```

---

## ✨ Special Effects

### Glow Effects

```tsx
// Small glow
<div className="shadow-vis-glow-teal-sm">Subtle glow</div>

// Medium glow
<div className="shadow-vis-glow-teal-md">Medium glow</div>

// Large glow
<div className="shadow-vis-glow-teal-lg">Strong glow</div>

// Combined shadow + glow
<div className="shadow-vis-glow-teal">Perfect balance</div>
```

### Gradients

```tsx
// Teal diagonal gradient
<div className="bg-vis-gradient-teal">Diagonal gradient</div>

// Brand gradient (Teal → Purple)
<div className="bg-vis-gradient-brand">Brand gradient</div>

// Mesh background (ambient)
<div className="bg-vis-gradient-mesh">Ambient effect</div>
```

### Resize Handle (from Upscale Panel)

```tsx
<div className="absolute inset-y-0 -right-1 w-3 cursor-col-resize group">
  <div className="absolute inset-y-0 right-0 w-1 bg-gray-700/40 group-hover:bg-vis-teal-400/70 transition-all" />
  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
    <div className="w-0.5 h-16 bg-vis-teal-400 rounded-full shadow-lg shadow-vis-teal-500/40" />
  </div>
</div>
```

---

## 🎯 Best Practices

### 1. **Use Teal for Primary Actions**
- Main buttons
- Active states
- Primary links
- Focus indicators

### 2. **Use Purple for Secondary Actions**
- Secondary buttons
- Alternative paths
- Complementary accents

### 3. **Maintain Contrast**
- Always test text readability
- Use `vis-text-*` variables for proper contrast
- Avoid low-opacity text on dark backgrounds

### 4. **Layer Shadows Properly**
- Use `shadow-vis-sm` for subtle elevation
- Use `shadow-vis-glow-teal` for interactive elements
- Combine shadows for depth

### 5. **Consistent Border Styles**
- Use `border-vis-teal-light` for subtle borders
- Use `border-vis-teal` for emphasized borders
- Use dashed borders (`border-dashed border-vis-teal-light`) for upload areas

### 6. **Gradients for Visual Interest**
- Use `bg-vis-gradient-teal` for buttons
- Use `bg-vis-gradient-brand` for hero sections
- Use `bg-vis-gradient-mesh` for ambient backgrounds

---

## 🔧 Customization

### Adjusting Teal Shade

To change the primary teal shade globally, update in `vis-colors.css`:

```css
:root {
  --vis-teal-500: #YOUR_COLOR_HERE;
  --vis-button-teal-bg: #YOUR_COLOR_HERE;
}
```

### Adding New Colors

Add to `vis-colors.css`:

```css
:root {
  --vis-orange-500: #f97316;
  --vis-text-orange: #fb923c;
}
```

Then extend Tailwind in `vis-tailwind-extend.js`:

```javascript
colors: {
  'vis-orange': {
    500: '#f97316',
    // ... other shades
  },
}
```

---

## 🧪 Testing

### Accessibility Checklist
- [ ] All text meets WCAG AA contrast requirements
- [ ] Focus states are clearly visible
- [ ] Color is not the only indicator of state
- [ ] Hover states provide visual feedback
- [ ] Disabled states are distinguishable

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## 📚 Related Files

- `src/components/UpscalingPanel.tsx` - Reference implementation
- `src/styles/theme.css` - Existing theme system
- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - Main stylesheet

---

## 🎓 Examples from Upscale Panel

The Upscale Panel (`UpscalingPanel.tsx`) demonstrates the VIS color system in action:

1. **Panel background**: `bg-gray-950` with `border-gray-800`
2. **Card container**: `bg-gray-900/70` with `shadow-vis-glow-teal`
3. **Teal accents**: `text-teal-300` for headers
4. **Teal borders**: `border-teal-500/40` for upload areas
5. **Resize handle**: Teal glow on hover (`bg-vis-teal-400/70`)
6. **Sliders**: `accent-purple-400` and `accent-blue-400`

---

## 🤝 Contributing

When adding new components:
1. Use VIS color variables consistently
2. Follow the established patterns
3. Test in both dark and light modes
4. Ensure accessibility standards are met
5. Document any new patterns or utilities

---

## 📄 License

This color system is part of the AI_POD project and follows the project's license.

---

**Version**: 1.0.0  
**Last Updated**: November 9, 2025  
**Maintained by**: AI_POD Team
