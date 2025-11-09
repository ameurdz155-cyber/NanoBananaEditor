# ✨ VIS Brand Color System

A comprehensive **Visual Identity System** built for the AI_POD project, based on the Upscale Panel design with **Teal/Cyan** primary and **Purple** secondary brand colors.

---

## 🚀 Quick Start

### 1. Installation
Already integrated! The VIS system is imported in `src/index.css`.

### 2. Usage

**CSS Variables:**
```css
.my-panel {
  background: var(--vis-panel-bg);
  border: 1px solid var(--vis-border-teal);
  box-shadow: var(--vis-shadow-glow-teal);
}
```

**Tailwind Classes:**
```tsx
<div className="bg-vis-teal-500 text-white shadow-vis-glow-teal">
  Teal Button
</div>
```

---

## 📦 What's Included

| File | Purpose |
|------|---------|
| `src/styles/vis-colors.css` | All CSS variables and utility classes |
| `src/styles/vis-tailwind-extend.js` | Tailwind configuration extension |
| `docs/VIS_COLOR_SYSTEM.md` | Complete documentation |
| `docs/VIS_QUICK_REFERENCE.md` | Quick reference guide |
| `src/components/VISColorShowcase.tsx` | Interactive showcase component |

---

## 🎨 Core Colors

### Primary: Teal (#14b8a6)
```tsx
<button className="bg-vis-teal-500">Primary Action</button>
```

### Complementary: Cyan (#06b6d4)
```tsx
<div className="text-vis-cyan-400">Cyan Text</div>
```

### Secondary: Purple (#a855f7)
```tsx
<button className="bg-vis-purple-500">Secondary Action</button>
```

---

## 🧩 Common Patterns

### Panel with Teal Glow
```tsx
<div className="rounded-xl border border-gray-800 bg-gray-900/70 shadow-vis-glow-teal">
  <header className="px-4 py-3 border-b border-gray-800/80">
    <p className="text-vis-teal-300 uppercase">Title</p>
  </header>
</div>
```

### Primary Teal Button
```tsx
<button className="
  px-6 py-3 rounded-full
  bg-vis-teal-500 hover:bg-vis-teal-600
  text-white shadow-vis-glow-teal
">
  Action
</button>
```

### Upload Area
```tsx
<div className="border border-dashed border-vis-teal-light bg-gray-900/60 p-4">
  Upload here
</div>
```

---

## 📖 Documentation

- **[Complete Guide](./VIS_COLOR_SYSTEM.md)** - Full documentation with examples
- **[Quick Reference](./VIS_QUICK_REFERENCE.md)** - Common patterns and snippets
- **Showcase Component** - `src/components/VISColorShowcase.tsx`

---

## 🎯 Key Features

✅ **Dark-first design** with light mode support  
✅ **600+ CSS variables** for complete control  
✅ **Tailwind integration** with custom classes  
✅ **Semantic colors** (success, error, warning, info)  
✅ **Gradient system** for backgrounds and effects  
✅ **Glow effects** for interactive elements  
✅ **Accessibility-focused** with proper contrast  

---

## 🌓 Dark & Light Mode

Automatically adjusts based on root class:

```html
<!-- Dark mode (default) -->
<html class="dark">

<!-- Light mode -->
<html class="light">
```

---

## 🔧 Customization

Edit `src/styles/vis-colors.css` to adjust colors:

```css
:root {
  --vis-teal-500: #YOUR_COLOR_HERE;
}
```

---

## 📊 Color Scales

Each color has 11 shades (50, 100, 200...950):

- **Teal**: `vis-teal-{50-950}`
- **Cyan**: `vis-cyan-{50-950}`
- **Purple**: `vis-purple-{50-950}`

---

## 💡 Examples

### Success Message
```tsx
<div className="bg-vis-success-bg border border-vis-success-border rounded-lg p-4">
  <p className="text-vis-success-text">Operation successful!</p>
</div>
```

### Gradient Button
```tsx
<button className="bg-vis-gradient-brand text-white px-6 py-3 rounded-full">
  Gradient Button
</button>
```

### Glowing Card
```tsx
<div className="bg-vis-card rounded-xl p-6 shadow-vis-glow-teal">
  Content with glow effect
</div>
```

---

## 🧪 Testing

View all colors and components:

```tsx
import { VISColorShowcase } from './components/VISColorShowcase';

// In your app
<VISColorShowcase />
```

---

## 📝 Reference Implementation

See `src/components/UpscalingPanel.tsx` for a complete example of VIS colors in production.

---

## 🤝 Contributing

When adding new components:
1. Use VIS CSS variables (`var(--vis-*)`)
2. Follow established patterns
3. Test in both dark and light modes
4. Document new patterns

---

**Version**: 1.0.0  
**Created**: November 9, 2025  
**Based on**: Upscale Panel Design
