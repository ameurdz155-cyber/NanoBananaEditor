# VIS Color System - Migration Guide

This guide helps you migrate existing components to use the VIS Brand Color System.

---

## 🎯 Migration Strategy

### Phase 1: New Components (Immediate)
Use VIS colors in all new components from now on.

### Phase 2: High-Traffic Components (Week 1-2)
Migrate visible, frequently-used components first.

### Phase 3: Remaining Components (Week 3-4)
Gradually update remaining components.

### Phase 4: Cleanup (Week 5)
Remove unused color definitions and consolidate.

---

## 🔄 Color Mapping Guide

### From Old → To VIS

#### Primary Purple Colors
```tsx
// OLD
className="bg-purple-600"
className="text-purple-400"
className="border-purple-500"

// NEW (VIS)
className="bg-vis-purple-600"
className="text-vis-purple-400"
className="border-vis-purple"
```

#### Teal/Cyan Accents
```tsx
// OLD
className="text-teal-300"
className="border-teal-500"
className="bg-cyan-500"

// NEW (VIS)
className="text-vis-teal-300"
className="border-vis-teal"
className="bg-vis-cyan-500"
```

#### Gray Backgrounds
```tsx
// OLD
className="bg-gray-950"
className="bg-gray-900"
className="bg-gray-800"

// NEW (VIS) - Keep as is, or use VIS backgrounds
className="bg-vis-app"        // Instead of bg-gray-950
className="bg-vis-primary"    // Instead of bg-gray-900
className="bg-vis-secondary"  // Instead of bg-gray-800
```

#### Borders
```tsx
// OLD
className="border-gray-800"
className="border-teal-500/40"

// NEW (VIS)
className="border-vis-default"
className="border-vis-teal-light"
```

#### Text Colors
```tsx
// OLD
className="text-gray-100"
className="text-gray-400"
className="text-teal-300"

// NEW (VIS)
className="text-vis-primary"
className="text-vis-muted"
className="text-vis-teal"
```

---

## 📋 Step-by-Step Migration

### Example: Migrating a Button

**Before:**
```tsx
<button className="
  px-6 py-3 rounded-full
  bg-purple-600 hover:bg-purple-700
  text-white font-semibold
  shadow-lg shadow-purple-500/30
  transition-all
">
  Click Me
</button>
```

**After:**
```tsx
<button className="
  px-6 py-3 rounded-full
  bg-vis-purple-600 hover:bg-vis-purple-700
  text-white font-semibold
  shadow-vis-glow-purple
  transition-all
">
  Click Me
</button>
```

**Changes:**
- `bg-purple-600` → `bg-vis-purple-600`
- `hover:bg-purple-700` → `hover:bg-vis-purple-700`
- `shadow-lg shadow-purple-500/30` → `shadow-vis-glow-purple`

---

### Example: Migrating a Panel

**Before:**
```tsx
<div className="
  rounded-xl border border-gray-800
  bg-gray-900/70
  shadow-lg shadow-teal-500/10
">
  <header className="px-4 py-3 border-b border-gray-800/80">
    <p className="text-sm uppercase tracking-wider text-teal-300 font-medium">
      Panel Title
    </p>
  </header>
  <div className="p-4">
    Content
  </div>
</div>
```

**After:**
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
    Content
  </div>
</div>
```

**Changes:**
- `shadow-lg shadow-teal-500/10` → `shadow-vis-glow-teal`
- `text-teal-300` → `text-vis-teal-300`

---

### Example: Migrating Upload Area

**Before:**
```tsx
<div className="
  rounded-lg border border-dashed
  border-teal-500/40
  bg-gray-900/60 p-4
  text-center
">
  <p className="text-gray-400">Upload area</p>
</div>
```

**After:**
```tsx
<div className="
  rounded-lg border border-dashed
  border-vis-teal-light
  bg-gray-900/60 p-4
  text-center
">
  <p className="text-vis-secondary">Upload area</p>
</div>
```

**Changes:**
- `border-teal-500/40` → `border-vis-teal-light`
- `text-gray-400` → `text-vis-secondary`

---

## 🔍 Find & Replace Guide

### Using VS Code

1. **Open Find & Replace** (Ctrl+Shift+H / Cmd+Shift+H)

2. **Enable Regex** (click `.*` icon)

3. **Use these patterns:**

#### Pattern 1: Teal Colors
```
Find:    className="([^"]*)\bteal-(\d+)
Replace: className="$1vis-teal-$2
```

#### Pattern 2: Cyan Colors
```
Find:    className="([^"]*)\bcyan-(\d+)
Replace: className="$1vis-cyan-$2
```

#### Pattern 3: Purple Colors
```
Find:    className="([^"]*)\bpurple-(\d+)
Replace: className="$1vis-purple-$2
```

⚠️ **Warning:** Review each change manually! Not all purple/teal references should be changed.

---

## 📝 Component-by-Component Checklist

### High Priority Components

- [ ] **UpscalingPanel** - Already uses VIS pattern (reference)
- [ ] **Header/Navigation** - Update brand colors
- [ ] **Primary Buttons** - Use `bg-vis-teal-500`
- [ ] **Secondary Buttons** - Use `bg-vis-purple-500`
- [ ] **Modal Dialogs** - Update backgrounds and borders
- [ ] **Form Inputs** - Update focus states
- [ ] **Cards** - Update backgrounds and shadows

### Medium Priority

- [ ] **Sidebar** - Update accents
- [ ] **Tooltips** - Update colors
- [ ] **Badges** - Update semantic colors
- [ ] **Progress Bars** - Use VIS gradients
- [ ] **Dropdowns** - Update hover states
- [ ] **Tabs** - Update active states

### Low Priority

- [ ] **Footer** - Update links
- [ ] **Error Pages** - Update semantic colors
- [ ] **Loading States** - Update spinners
- [ ] **Empty States** - Update illustrations

---

## 🧪 Testing Checklist

After migrating a component:

- [ ] Visual appearance matches original
- [ ] Dark mode looks correct
- [ ] Light mode looks correct
- [ ] Hover states work properly
- [ ] Focus states are visible
- [ ] Transitions are smooth
- [ ] No console errors
- [ ] Accessibility is maintained

---

## ⚠️ Common Pitfalls

### 1. Don't Mix Old and New
```tsx
❌ BAD: <div className="bg-vis-teal-500 border-teal-600">
✅ GOOD: <div className="bg-vis-teal-500 border-vis-teal-600">
```

### 2. Check Opacity Values
```tsx
❌ BAD: border-teal-500/40 → border-vis-teal-500/40
✅ GOOD: border-teal-500/40 → border-vis-teal-light
```
(VIS has predefined opacity variants)

### 3. Update Shadows Too
```tsx
❌ BAD: shadow-lg shadow-teal-500/30
✅ GOOD: shadow-vis-glow-teal
```

### 4. Use Semantic Colors
```tsx
❌ BAD: text-red-400 for errors
✅ GOOD: text-vis-error-text
```

---

## 🎨 CSS Variables Migration

### For Custom CSS

**Before:**
```css
.my-component {
  background: #14b8a6;
  border: 1px solid rgba(20, 184, 166, 0.4);
  color: #5eead4;
}
```

**After:**
```css
.my-component {
  background: var(--vis-teal-500);
  border: 1px solid var(--vis-border-teal);
  color: var(--vis-text-teal);
}
```

---

## 📊 Migration Progress Tracker

Create a checklist in your project management tool:

```markdown
## VIS Color System Migration

### Phase 1: New Components ✅
- [x] All new components use VIS
- [x] Style guide updated

### Phase 2: High Priority (Week 1-2)
- [ ] Navigation/Header
- [ ] Primary Buttons
- [ ] Modal Dialogs
- [ ] Form Components
- [ ] Main Cards

### Phase 3: Medium Priority (Week 3-4)
- [ ] Sidebar
- [ ] Tooltips
- [ ] Badges
- [ ] Dropdowns
- [ ] Tabs

### Phase 4: Low Priority (Week 5)
- [ ] Footer
- [ ] Error Pages
- [ ] Loading States
- [ ] Empty States

### Phase 5: Cleanup
- [ ] Remove unused color definitions
- [ ] Update documentation
- [ ] Final QA pass
```

---

## 🚀 Quick Wins

Start with these easy migrations:

### 1. Text Colors (5 minutes)
```tsx
// Find all instances and replace
text-teal-300 → text-vis-teal-300
text-cyan-400 → text-vis-cyan-400
text-purple-400 → text-vis-purple-400
```

### 2. Semantic Colors (10 minutes)
Update all success/error/warning states to use VIS semantic colors.

### 3. Buttons (15 minutes)
Update all primary and secondary buttons.

---

## 🔗 Resources During Migration

- **Color Mapping**: `docs/VIS_QUICK_REFERENCE.md`
- **Component Patterns**: `docs/VIS_COLOR_SYSTEM.md`
- **Visual Reference**: `src/components/VISColorShowcase.tsx`
- **Live Example**: `src/components/UpscalingPanel.tsx`

---

## 💬 Need Help?

### Before Migration
1. Review the component
2. Check if it uses teal/cyan/purple
3. Identify all color references
4. Plan the changes

### During Migration
1. Update one section at a time
2. Test after each change
3. Keep the browser dev tools open
4. Compare with the original

### After Migration
1. Run the app in dark mode
2. Run the app in light mode
3. Test all interactive states
4. Check accessibility
5. Get code review

---

## ✅ Migration Checklist Template

Copy this for each component:

```markdown
## Component: [ComponentName]

### Analysis
- [ ] Component uses purple/teal/cyan colors
- [ ] Identified all color references
- [ ] Checked for custom CSS

### Migration
- [ ] Updated bg- classes
- [ ] Updated text- classes
- [ ] Updated border- classes
- [ ] Updated shadow/glow effects
- [ ] Updated CSS variables (if any)

### Testing
- [ ] Dark mode ✓
- [ ] Light mode ✓
- [ ] Hover states ✓
- [ ] Focus states ✓
- [ ] Active states ✓
- [ ] Disabled states ✓

### Review
- [ ] Code review complete
- [ ] QA passed
- [ ] Merged to main
```

---

## 🎉 After Full Migration

Once all components are migrated:

1. **Remove old color definitions** from theme.css (if any)
2. **Update style guide** with VIS colors only
3. **Document any exceptions** (if needed)
4. **Celebrate!** 🎊

---

**Migration Guide Version**: 1.0.0  
**Last Updated**: November 9, 2025
