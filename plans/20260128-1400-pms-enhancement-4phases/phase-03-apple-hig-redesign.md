# Phase 3: Apple HIG Color Redesign

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** None (CSS-only changes; no backend work)
- **Blocked by:** Nothing; can run in parallel with any phase

## Overview

- **Date:** 2026-01-28
- **Description:** Update CSS design system with vibrant Apple HIG 2025 colors, enhanced Liquid Glass glassmorphism (40px blur, tinted glass), gradient buttons/headers, multi-layer shadows, spring animations, and color-coded sections. Dark mode fully supported. No component logic changes.
- **Priority:** MEDIUM
- **Implementation Status:** COMPLETED
- **Review Status:** COMPLETED

## Key Insights

1. Current styling lives in two files: `frontend/src/app/globals.css` (main design system, 884 lines) and `frontend/src/styles/apple-colors.css` (Apple system color vars, 43 lines).
2. `globals.css` already has `--glass-blur: 20px` -- we increase to 40px. Already has `--ease-spring`, shadow levels, typography scale.
3. Apple colors in `apple-colors.css` use exact Apple HIG values. We keep these as-is; changes go into `globals.css` variable overrides.
4. The file has TWO `:root` blocks (line 91 and line 821) due to append -- the second block at line 821 overrides the first. We consolidate.
5. Color-coded sections: projects=blue `#0071e3`, tasks=green `#34c759`, budget=orange `#ff9f0a`, teams=purple `#af52de`, reports=teal `#5ac8fa`. These are applied via CSS custom properties consumed by section-specific utility classes.
6. **DO NOT** change any component JSX/logic. Only CSS/style changes.

## Requirements

1. Update CSS variables in globals.css for vibrant Apple HIG 2025 palette
2. Enhanced Liquid Glass: deeper blur (40px), tinted glass backgrounds, glass card utility
3. Gradient fills for primary buttons and section headers
4. Multi-layer shadows: update all 3 levels (subtle/medium/elevated) with more depth
5. Spring animations: add `--ease-spring-bouncy` and `--ease-spring-gentle` variants
6. Color-coded section variables: `--section-projects`, `--section-tasks`, `--section-budget`, `--section-teams`, `--section-reports`
7. Dark mode: all changes must work; brighter accent colors in dark
8. No component logic changes (only `.css` files modified)

## Architecture

```
frontend/
  src/app/globals.css         # Primary file: update variables, add utilities
  src/styles/apple-colors.css # No changes needed (source colors are correct)
```

Only `globals.css` is modified. No new files created.

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/app/globals.css` | MODIFY | Update CSS variables, glassmorphism, gradients, shadows, animations, section colors |
| `frontend/src/styles/apple-colors.css` | NO CHANGE | Apple HIG source colors stay as-is |

## Implementation Steps

### Step 1: Consolidate `:root` Blocks

The file has two `:root` blocks (line 91 and line 821) and two `.dark` / `:root.dark` blocks. Merge them into single `:root` and `.dark` blocks to eliminate confusion. Keep the values from the second block (line 821+) as they are the intended overrides.

### Step 2: Enhanced Glassmorphism Variables

**Before (current values):**
```css
--glass-blur: 20px;
--glass-saturate: 180%;
--glass-bg: oklch(1 0 0 / 72%);
--glass-bg-light: oklch(1 0 0 / 56%);
--glass-border: oklch(1 0 0 / 50%);
```

**After (enhanced):**
```css
/* Liquid Glass - deeper blur, tinted backgrounds */
--glass-blur: 40px;
--glass-saturate: 200%;
--glass-bg: oklch(0.98 0.005 250 / 68%);           /* Slight blue tint */
--glass-bg-light: oklch(0.99 0.003 250 / 52%);
--glass-border: oklch(1 0 0 / 40%);
--glass-shadow: 0 1px 3px oklch(0 0 0 / 4%), inset 0 1px 0 oklch(1 0 0 / 60%);
```

**Dark mode after:**
```css
--glass-blur: 40px;
--glass-saturate: 200%;
--glass-bg: oklch(0.16 0.008 250 / 65%);            /* Dark blue tint */
--glass-bg-light: oklch(0.22 0.005 250 / 50%);
--glass-border: oklch(1 0 0 / 8%);
--glass-shadow: 0 1px 3px oklch(0 0 0 / 30%), inset 0 1px 0 oklch(1 0 0 / 6%);
```

### Step 3: Update Glass Utility Classes

**Before:**
```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
}
```

**After:**
```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-xl);
  transition: box-shadow var(--duration-normal) var(--ease-default),
              transform var(--duration-normal) var(--ease-default);
}

.glass-card:hover {
  box-shadow: var(--shadow-md), var(--glass-shadow);
  transform: translateY(-1px);
}
```

### Step 4: Enhanced Multi-Layer Shadows

**Before:**
```css
/* Light */
--shadow-sm: 0 2px 8px oklch(0 0 0 / 4%), 0 1px 2px oklch(0 0 0 / 4%);
--shadow-md: 0 4px 16px oklch(0 0 0 / 6%), 0 2px 4px oklch(0 0 0 / 4%);
--shadow-lg: 0 8px 32px oklch(0 0 0 / 8%), 0 4px 8px oklch(0 0 0 / 4%);
```

**After (3-layer each for more depth):**
```css
/* Light - subtle / medium / elevated */
--shadow-sm: 0 1px 2px oklch(0 0 0 / 3%), 0 2px 6px oklch(0 0 0 / 4%), 0 0 1px oklch(0 0 0 / 6%);
--shadow-md: 0 2px 4px oklch(0 0 0 / 3%), 0 6px 16px oklch(0 0 0 / 5%), 0 0 1px oklch(0 0 0 / 8%);
--shadow-lg: 0 4px 8px oklch(0 0 0 / 4%), 0 12px 40px oklch(0 0 0 / 8%), 0 0 1px oklch(0 0 0 / 10%);
```

**Dark after:**
```css
--shadow-sm: 0 1px 2px oklch(0 0 0 / 20%), 0 2px 6px oklch(0 0 0 / 25%), 0 0 1px oklch(0 0 0 / 40%);
--shadow-md: 0 2px 4px oklch(0 0 0 / 25%), 0 6px 16px oklch(0 0 0 / 35%), 0 0 1px oklch(0 0 0 / 50%);
--shadow-lg: 0 4px 8px oklch(0 0 0 / 30%), 0 12px 40px oklch(0 0 0 / 45%), 0 0 1px oklch(0 0 0 / 60%);
```

### Step 5: Gradient Variables and Button Class

Add to `:root`:
```css
/* Gradient fills */
--gradient-primary: linear-gradient(135deg, #0071e3 0%, #00a1ff 100%);
--gradient-primary-hover: linear-gradient(135deg, #005bb5 0%, #0088dd 100%);
--gradient-section-projects: linear-gradient(135deg, #0071e3 0%, #5ac8fa 100%);
--gradient-section-tasks: linear-gradient(135deg, #34c759 0%, #30d158 100%);
--gradient-section-budget: linear-gradient(135deg, #ff9f0a 0%, #ffcc00 100%);
--gradient-section-teams: linear-gradient(135deg, #af52de 0%, #bf5af2 100%);
--gradient-section-reports: linear-gradient(135deg, #5ac8fa 0%, #64d2ff 100%);
```

Dark mode:
```css
--gradient-primary: linear-gradient(135deg, #0a84ff 0%, #64d2ff 100%);
--gradient-primary-hover: linear-gradient(135deg, #0077ed 0%, #5ac8fa 100%);
--gradient-section-projects: linear-gradient(135deg, #0a84ff 0%, #64d2ff 100%);
--gradient-section-tasks: linear-gradient(135deg, #30d158 0%, #66d97a 100%);
--gradient-section-budget: linear-gradient(135deg, #ff9f0a 0%, #ffd60a 100%);
--gradient-section-teams: linear-gradient(135deg, #bf5af2 0%, #da8fff 100%);
--gradient-section-reports: linear-gradient(135deg, #64d2ff 0%, #99e4ff 100%);
```

Add component class:
```css
.btn-gradient {
  background: var(--gradient-primary);
  color: #ffffff;
  border: none;
  position: relative;
  overflow: hidden;
}

.btn-gradient:hover {
  background: var(--gradient-primary-hover);
}

.btn-gradient:active {
  transform: scale(0.98);
}

.section-header-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Step 6: Color-Coded Section Variables

Add to `:root`:
```css
/* Section accent colors */
--section-projects: #0071e3;
--section-tasks: #34c759;
--section-budget: #ff9f0a;
--section-teams: #af52de;
--section-reports: #5ac8fa;
```

Dark mode:
```css
--section-projects: #0a84ff;
--section-tasks: #30d158;
--section-budget: #ff9f0a;
--section-teams: #bf5af2;
--section-reports: #64d2ff;
```

Add utility classes:
```css
.accent-projects { --accent-section: var(--section-projects); }
.accent-tasks    { --accent-section: var(--section-tasks); }
.accent-budget   { --accent-section: var(--section-budget); }
.accent-teams    { --accent-section: var(--section-teams); }
.accent-reports  { --accent-section: var(--section-reports); }

.section-accent-border { border-left: 3px solid var(--accent-section); }
.section-accent-bg     { background: oklch(from var(--accent-section) l c h / 8%); }
.section-accent-text   { color: var(--accent-section); }
.section-accent-dot    { background: var(--accent-section); width: 8px; height: 8px; border-radius: 50%; }
```

### Step 7: Spring Animation Variants

**Before:**
```css
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

**After (add variants, keep original):**
```css
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
--ease-spring-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-spring-gentle: cubic-bezier(0.25, 1, 0.5, 1);
--ease-spring-snappy: cubic-bezier(0.16, 1, 0.3, 1);
```

Add utility classes:
```css
.transition-spring-bouncy {
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--ease-spring-bouncy);
}

.transition-spring-gentle {
  transition-duration: var(--duration-slow);
  transition-timing-function: var(--ease-spring-gentle);
}

.transition-spring-snappy {
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-spring-snappy);
}
```

### Step 8: Update Sidebar Glassmorphism

**Before:**
```css
.glass-sidebar {
  background: var(--sidebar);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border-right: 1px solid var(--sidebar-border);
}
```

**After:**
```css
.glass-sidebar {
  background: var(--sidebar);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border-right: 1px solid var(--sidebar-border);
  box-shadow: 1px 0 4px oklch(0 0 0 / 3%);
}
```

Similarly update `.glass-navbar`:
```css
.glass-navbar {
  background: var(--navbar);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border-bottom: 1px solid var(--navbar-border);
  box-shadow: 0 1px 4px oklch(0 0 0 / 3%);
}
```

### Step 9: Enhanced Card Hover

**Before:**
```css
.card-apple:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

**After:**
```css
.card-apple {
  /* ... existing ... */
  transition: box-shadow var(--duration-normal) var(--ease-spring-gentle),
              transform var(--duration-normal) var(--ease-spring-gentle);
}

.card-apple:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px) scale(1.005);
}
```

### Step 10: Button Enhancements

Update `.btn-apple-primary`:

**Before:**
```css
.btn-apple-primary {
  background: var(--primary);
  color: var(--primary-foreground);
}
.btn-apple-primary:hover {
  background: var(--primary-hover);
}
```

**After:**
```css
.btn-apple-primary {
  background: var(--gradient-primary);
  color: var(--primary-foreground);
  box-shadow: 0 2px 8px oklch(from var(--primary) l c h / 30%);
}

.btn-apple-primary:hover {
  background: var(--gradient-primary-hover);
  box-shadow: 0 4px 12px oklch(from var(--primary) l c h / 40%);
}

.btn-apple-primary:active {
  background: var(--primary-active);
  transform: scale(0.98);
  box-shadow: 0 1px 4px oklch(from var(--primary) l c h / 20%);
}
```

### Step 11: Update reduced-motion

Add the new spring classes to the reduced-motion media query:

```css
@media (prefers-reduced-motion: reduce) {
  /* ... existing selectors ... */
  .transition-spring-bouncy,
  .transition-spring-gentle,
  .transition-spring-snappy,
  .glass-card {
    transition: none;
  }

  .glass-card:hover {
    transform: none;
  }
}
```

## Todo List

- [x] Step 1: Consolidate duplicate :root and .dark blocks (kept both, updated second)
- [x] Step 2: Update glassmorphism variables (blur 40px, tinted glass, glass-shadow)
- [x] Step 3: Update glass utility classes + add glass-card
- [x] Step 4: Update multi-layer shadows (3-layer each level)
- [x] Step 5: Add gradient variables and btn-gradient class
- [x] Step 6: Add color-coded section variables and utility classes
- [x] Step 7: Add spring animation variants (bouncy, gentle, snappy)
- [x] Step 8: Update sidebar and navbar glassmorphism
- [x] Step 9: Enhance card-apple hover with spring easing
- [x] Step 10: Update btn-apple-primary to use gradient
- [x] Step 11: Update reduced-motion queries

## Success Criteria

1. `--glass-blur` is 40px; sidebar/navbar/glass elements show deeper frosted effect
2. Primary buttons show gradient fill, not flat color
3. Shadows have 3 layers at each level (inspect in DevTools)
4. Spring animations visible on card hover, button press
5. Section utility classes (`.accent-projects`, etc.) render correct colors
6. Dark mode: all glass, gradient, shadow, animation changes work correctly
7. No visual regressions in existing components
8. `prefers-reduced-motion` disables all new animations

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| 40px blur causes performance issues on low-end devices | Janky scrolling | CSS `will-change: transform` on glass elements; test on mobile |
| Gradient buttons look different from shadcn defaults | Inconsistent buttons | Only apply gradient to `.btn-apple-primary` and `.btn-gradient`, not shadcn `<Button>` |
| oklch `from` syntax not supported in older browsers | Colors broken | Add fallback hex values before oklch lines where used |
| Consolidating :root blocks may break specificity | Wrong colors applied | Test all pages after merge; keep same property order |

## Security Considerations

- No security implications (CSS-only changes)
- No data exposure risks
- No authentication changes

## Next Steps

- After applying CSS changes, visually audit all pages (Dashboard, Projects, Tasks, Teams, Reports, Calendar, Approvals, Admin)
- Consider adding a "system theme" option alongside light/dark toggle
- Future: Add micro-interactions for tab switches and modal opens using CSS @keyframes
