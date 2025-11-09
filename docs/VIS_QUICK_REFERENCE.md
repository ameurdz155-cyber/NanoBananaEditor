# VIS Color System - Quick Reference

## 🎨 Color Tokens

### CSS Variables (Use in style attributes or CSS files)
```css
/* Backgrounds */
background: var(--vis-bg-app);         /* #0a0a0f */
background: var(--vis-bg-primary);     /* #0e0e14 */
background: var(--vis-panel-bg);       /* rgba(17, 17, 26, 0.7) */
background: var(--vis-card-bg);        /* rgba(26, 26, 36, 0.6) */

/* Borders */
border-color: var(--vis-border-teal);        /* rgba(20, 184, 166, 0.4) */
border-color: var(--vis-border-teal-light);  /* rgba(20, 184, 166, 0.25) */
border-color: var(--vis-border-purple);      /* rgba(168, 85, 247, 0.4) */

/* Text */
color: var(--vis-text-primary);    /* #f8fafc */
color: var(--vis-text-teal);       /* #5eead4 */
color: var(--vis-text-cyan);       /* #22d3ee */
color: var(--vis-text-purple);     /* #c084fc */

/* Shadows & Glows */
box-shadow: var(--vis-shadow-glow-teal);    /* Combined shadow + glow */
box-shadow: var(--vis-glow-teal-md);        /* Medium teal glow */
box-shadow: var(--vis-glow-purple-lg);      /* Large purple glow */

/* Gradients */
background: var(--vis-gradient-teal);        /* Teal diagonal */
background: var(--vis-gradient-brand);       /* Teal → Purple */
background: var(--vis-gradient-mesh);        /* Ambient background */
```

### Tailwind Classes

#### Colors
```tsx
// Teal (Primary Brand)
<div className="bg-vis-teal-500">     {/* #14b8a6 */}
<div className="text-vis-teal-300">   {/* #5eead4 */}
<div className="border-vis-teal-600"> {/* #0d9488 */}

// Cyan (Complementary)
<div className="bg-vis-cyan-500">     {/* #06b6d4 */}
<div className="text-vis-cyan-400">   {/* #22d3ee */}

// Purple (Secondary)
<div className="bg-vis-purple-500">   {/* #a855f7 */}
<div className="text-vis-purple-400"> {/* #c084fc */}
```

#### Backgrounds
```tsx
<div className="bg-vis-app">        {/* Main app background */}
<div className="bg-vis-panel">      {/* Panel background */}
<div className="bg-vis-card">       {/* Card background */}
<div className="bg-vis-hover">      {/* Hover state */}
```

#### Borders
```tsx
<div className="border-vis-teal">         {/* Teal border */}
<div className="border-vis-teal-light">   {/* Light teal */}
<div className="border-vis-purple">       {/* Purple border */}
```

#### Text
```tsx
<p className="text-vis-primary">      {/* Primary text */}
<p className="text-vis-teal">         {/* Teal text */}
<p className="text-vis-cyan">         {/* Cyan text */}
<p className="text-vis-muted">        {/* Muted text */}
```

#### Shadows & Glows
```tsx
<div className="shadow-vis-glow-teal">      {/* Shadow + glow */}
<div className="shadow-vis-glow-teal-md">   {/* Medium glow */}
<div className="shadow-vis-glow-purple">    {/* Purple glow */}
```

#### Gradients
```tsx
<div className="bg-vis-gradient-teal">        {/* Teal diagonal */}
<div className="bg-vis-gradient-purple">      {/* Purple horizontal */}
<div className="bg-vis-gradient-brand">       {/* Teal → Purple */}
<div className="bg-vis-gradient-mesh">        {/* Ambient mesh */}
```

---

## 🧩 Common Patterns

### Primary Button (Teal)
```tsx
<button className="
  px-6 py-3 rounded-full
  bg-vis-teal-500 hover:bg-vis-teal-600
  text-white font-semibold
  shadow-vis-glow-teal
  transition-all duration-300
">
  Primary Action
</button>
```

### Secondary Button (Purple)
```tsx
<button className="
  px-6 py-3 rounded-full
  bg-vis-purple-500 hover:bg-vis-purple-600
  text-white font-semibold
  shadow-vis-glow-purple
  transition-all
">
  Secondary Action
</button>
```

### Outline Button (Teal)
```tsx
<button className="
  px-4 py-2 rounded-full
  border border-vis-teal-light
  text-vis-teal hover:text-vis-teal-bright
  hover:border-vis-teal hover:bg-vis-teal/10
  transition-all
">
  Outline Button
</button>
```

### Panel with Teal Accent
```tsx
<div className="
  rounded-xl border border-gray-800
  bg-gray-900/70
  shadow-vis-glow-teal
">
  <header className="px-4 py-3 border-b border-gray-800/80">
    <p className="text-sm uppercase tracking-wider text-vis-teal-300 font-medium">
      Panel Title
    </p>
  </header>
  <div className="p-4">
    {/* Content */}
  </div>
</div>
```

### Dashed Upload Area
```tsx
<div className="
  rounded-lg border border-dashed border-vis-teal-light
  bg-gray-900/60 p-4
  text-center
">
  <p className="text-vis-secondary">Upload area</p>
</div>
```

### Scale Toggle Buttons
```tsx
<div className="grid grid-cols-2 gap-2">
  <button className="h-11 rounded-lg bg-vis-teal-500 text-white font-semibold">
    2x
  </button>
  <button className="h-11 rounded-lg border border-vis-default text-vis-secondary hover:bg-vis-hover">
    4x
  </button>
</div>
```

### Range Slider (Teal Accent)
```tsx
<input
  type="range"
  className="w-full h-2 rounded-full bg-gray-800/70 accent-vis-teal-400"
  defaultValue="50"
/>
```

### Resize Handle (from Upscale Panel)
```tsx
<div className="
  absolute inset-y-0 -right-1 w-3
  cursor-col-resize group
">
  <div className="
    absolute inset-y-0 right-0 w-1
    bg-gray-700/40 group-hover:bg-vis-teal-400/70
    transition-all
  " />
  <div className="
    absolute inset-y-0 left-0 right-0
    flex items-center justify-center
    opacity-0 group-hover:opacity-100
    transition-opacity
  ">
    <div className="w-0.5 h-16 bg-vis-teal-400 rounded-full shadow-lg shadow-vis-teal-500/40" />
  </div>
</div>
```

---

## 📊 Semantic Colors

### Success
```tsx
<div className="bg-vis-success-bg border border-vis-success-border rounded-lg p-4">
  <p className="text-vis-success-text">Success message</p>
</div>
```

### Error
```tsx
<div className="bg-vis-error-bg border border-vis-error-border rounded-lg p-4">
  <p className="text-vis-error-text">Error message</p>
</div>
```

### Warning
```tsx
<div className="bg-vis-warning-bg border border-vis-warning-border rounded-lg p-4">
  <p className="text-vis-warning-text">Warning message</p>
</div>
```

### Info
```tsx
<div className="bg-vis-info-bg border border-vis-info-border rounded-lg p-4">
  <p className="text-vis-info-text">Info message</p>
</div>
```

---

## 🎯 Usage Guidelines

### When to Use Teal
- Primary actions (submit, save, upscale, generate)
- Active/selected states
- Primary focus indicators
- Main brand elements

### When to Use Purple
- Secondary actions (cancel, alternative options)
- Complementary accents
- Variety in multi-panel layouts
- Slider/range controls

### When to Use Cyan
- Gradients with teal
- Alternative highlights
- Complementary text accents

---

## 🌓 Dark/Light Mode

All CSS variables automatically adapt:

```tsx
// Dark mode (default)
<html className="dark">

// Light mode
<html className="light">
```

No code changes needed - colors adjust automatically!

---

## 📖 Full Documentation

See `docs/VIS_COLOR_SYSTEM.md` for complete documentation.

See `src/components/VISColorShowcase.tsx` for live examples.
