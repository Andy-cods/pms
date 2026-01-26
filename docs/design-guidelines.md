# BC Agency PMS - Apple-Inspired Design System

Design system inspired by Apple Human Interface Guidelines for a clean, minimal, and sophisticated user experience.

## Design Principles

1. **Clarity** - Text is legible, icons precise, adornments subtle
2. **Deference** - UI helps understanding without competing with content
3. **Depth** - Visual layers and motion convey hierarchy

## Color System

### Light Mode

| Token | Value | HEX Equivalent | Usage |
|-------|-------|----------------|-------|
| `--background` | `oklch(1 0 0)` | #ffffff | Page background |
| `--surface` | `oklch(0.965 0.002 286)` | #f5f5f7 | Cards, inputs |
| `--foreground` | `oklch(0.15 0.005 286)` | #1d1d1f | Primary text |
| `--foreground-secondary` | `oklch(0.58 0.01 286)` | #86868b | Secondary text |
| `--foreground-tertiary` | `oklch(0.72 0.01 286)` | #aeaeb2 | Tertiary text |
| `--primary` | `oklch(0.55 0.19 250)` | #0071e3 | Apple Blue |
| `--success` | `oklch(0.72 0.19 145)` | #34c759 | Success states |
| `--warning` | `oklch(0.78 0.19 75)` | #ff9f0a | Warning states |
| `--error` | `oklch(0.63 0.26 25)` | #ff3b30 | Error states |

### Dark Mode

| Token | Value | HEX Equivalent | Usage |
|-------|-------|----------------|-------|
| `--background` | `oklch(0 0 0)` | #000000 | True black |
| `--surface` | `oklch(0.14 0 0)` | #1c1c1e | Cards |
| `--surface-raised` | `oklch(0.20 0 0)` | #2c2c2e | Elevated surfaces |
| `--foreground` | `oklch(0.965 0.002 286)` | #f5f5f7 | Primary text |
| `--primary` | `oklch(0.60 0.21 255)` | #0a84ff | Brighter blue |
| `--success` | `oklch(0.75 0.21 145)` | #30d158 | Success states |
| `--warning` | `oklch(0.88 0.19 95)` | #ffd60a | Warning states |
| `--error` | `oklch(0.66 0.26 25)` | #ff453a | Error states |

### Apple System Colors

```css
/* Light Mode */
--apple-blue: #0071e3;
--apple-green: #34c759;
--apple-teal: #5ac8fa;
--apple-purple: #af52de;
--apple-red: #ff3b30;
--apple-orange: #ff9f0a;
--apple-yellow: #ffcc00;

/* Dark Mode */
--apple-blue: #0a84ff;
--apple-green: #30d158;
--apple-teal: #64d2ff;
--apple-purple: #bf5af2;
--apple-red: #ff453a;
--apple-orange: #ff9f0a;
--apple-yellow: #ffd60a;
```

## Typography

Font: **Inter** (SF Pro alternative with Vietnamese support)

### Type Scale

| Name | Size | Weight | Line Height | Tracking | Usage |
|------|------|--------|-------------|----------|-------|
| Display | 48px | 700 | 1.1 | -0.025em | Hero headlines |
| Title | 32px | 600 | 1.2 | -0.02em | Page titles |
| Headline | 24px | 600 | 1.25 | -0.015em | Section headers |
| Subheadline | 20px | 600 | 1.3 | -0.01em | Subsections |
| Body | 17px | 400 | 1.5 | 0 | Standard text |
| Callout | 16px | 400 | 1.5 | 0 | Smaller body |
| Footnote | 14px | 400 | 1.4 | 0 | Supporting text |
| Caption | 13px | 400 | 1.35 | 0 | Labels |

### Typography Classes

```html
<h1 class="text-display">Display Heading</h1>
<h2 class="text-title">Title Heading</h2>
<h3 class="text-headline">Headline</h3>
<h4 class="text-subheadline">Subheadline</h4>
<p class="text-body">Body text</p>
<p class="text-callout">Callout text</p>
<p class="text-footnote">Footnote text</p>
<span class="text-caption">Caption text</span>
```

## Spacing

8px grid system.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing |
| `--space-2` | 8px | Base unit |
| `--space-3` | 12px | Small gaps |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Medium gaps |
| `--space-6` | 24px | Section padding |
| `--space-8` | 32px | Large gaps |
| `--space-10` | 40px | Extra large |
| `--space-12` | 48px | Section margins |
| `--space-16` | 64px | Page sections |

## Border Radius

Larger, smoother curves (16-20px for cards).

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Small elements |
| `--radius-md` | 12px | Inputs, buttons |
| `--radius-lg` | 16px | Cards |
| `--radius-xl` | 20px | Large cards |
| `--radius-2xl` | 24px | Modals |
| `--radius-full` | 9999px | Pills, avatars |

## Shadows

Ultra-soft, layered depth (3 levels).

### Light Mode

```css
--shadow-sm: 0 2px 8px oklch(0 0 0 / 4%), 0 1px 2px oklch(0 0 0 / 4%);
--shadow-md: 0 4px 16px oklch(0 0 0 / 6%), 0 2px 4px oklch(0 0 0 / 4%);
--shadow-lg: 0 8px 32px oklch(0 0 0 / 8%), 0 4px 8px oklch(0 0 0 / 4%);
```

### Dark Mode

```css
--shadow-sm: 0 2px 8px oklch(0 0 0 / 30%), 0 1px 2px oklch(0 0 0 / 20%);
--shadow-md: 0 4px 16px oklch(0 0 0 / 40%), 0 2px 4px oklch(0 0 0 / 20%);
--shadow-lg: 0 8px 32px oklch(0 0 0 / 50%), 0 4px 8px oklch(0 0 0 / 30%);
```

### Usage

```html
<div class="shadow-apple-sm">Subtle shadow</div>
<div class="shadow-apple">Medium shadow</div>
<div class="shadow-apple-lg">Large shadow</div>
```

## Glassmorphism

For sidebar and navbar components.

### Variables

```css
--glass-bg: oklch(1 0 0 / 72%);
--glass-blur: 20px;
--glass-saturate: 180%;
```

### Classes

```html
<aside class="glass-sidebar">Sidebar content</aside>
<nav class="glass-navbar">Navigation</nav>
<div class="glass">Generic glass effect</div>
```

## Borders

Ultra-subtle, almost invisible.

```css
--border: oklch(0 0 0 / 6%);        /* Light mode */
--border-strong: oklch(0 0 0 / 12%); /* Emphasized */

--border: oklch(1 0 0 / 8%);        /* Dark mode */
--border-strong: oklch(1 0 0 / 16%); /* Emphasized */
```

## Animation

Apple-like smooth transitions.

### Timing

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
```

### Easing

```css
--ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Classes

```html
<div class="transition-apple">Default transition</div>
<div class="transition-apple-fast">Fast transition</div>
<div class="transition-spring">Spring animation</div>
<div class="hover-lift">Lift on hover</div>
<div class="hover-scale">Scale on hover</div>
<div class="press-apple">Press effect</div>
```

## Components

### Cards

```html
<div class="card-apple">
  Standard card with hover effect
</div>
```

### Buttons

```html
<button class="btn-apple btn-apple-primary">Primary</button>
<button class="btn-apple btn-apple-secondary">Secondary</button>
```

### Inputs

```html
<input class="input-apple" placeholder="Apple-style input" />
```

### Badges

```html
<span class="badge-primary">Primary</span>
<span class="badge-success">Success</span>
<span class="badge-warning">Warning</span>
<span class="badge-error">Error</span>
```

## File Structure

```
frontend/src/
  app/
    globals.css          # Core design system
  styles/
    apple-design.css     # Extended utilities
```

## Usage

Import in your root layout:

```tsx
// app/layout.tsx
import './globals.css';
import '@/styles/apple-design.css'; // Optional extended utilities
```

## Accessibility

- WCAG 2.1 AA color contrast compliance
- Focus states with visible ring
- Reduced motion support via `prefers-reduced-motion`
- Semantic HTML elements

## Vietnamese Support

Inter font configured with Vietnamese subset:

```tsx
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
});
```
