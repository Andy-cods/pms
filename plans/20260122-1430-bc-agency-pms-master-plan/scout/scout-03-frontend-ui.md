# Frontend UI Architecture Scout Report

**Date:** 2026-01-22
**Focus:** Current UI setup and readiness for Shadcn/ui integration

## Current Folder Structure

```
src/
├── app/                          # Next.js 16 App Router
│   ├── (admin)/                  # Admin group
│   ├── (auth)/                   # Auth group (login, client-login)
│   ├── (client-portal)/          # Client portal group
│   ├── (dashboard)/              # Dashboard group
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with Providers
│   └── page.tsx                  # Home page
├── components/
│   ├── ui/                       # UI components
│   │   ├── button.tsx            # Custom Button (Week 2)
│   │   ├── input.tsx             # Custom Input (Week 2)
│   │   └── index.ts              # Barrel export
│   ├── common/                   # Common components (empty)
│   ├── project/                  # Project-related components (empty)
│   └── task/                     # Task-related components (empty)
├── lib/
│   ├── utils/
│   │   └── index.ts              # cn() utility, formatDate helpers
│   ├── api/                      # API integration
│   └── auth/                     # Auth utilities
├── hooks/
│   ├── use-auth.ts               # Auth hook
│   └── index.ts
├── stores/                       # Zustand stores
│   ├── auth/
│   └── ui/
├── providers/
│   ├── query-provider.tsx        # React Query provider
│   └── index.tsx                 # Provider wrapper
└── types/
    └── index.ts                  # Type definitions
```

## Existing UI Components

**Button** (`src/components/ui/button.tsx`)
- Variants: primary, secondary, outline, ghost, danger
- Sizes: sm, md, lg
- Props: isLoading, disabled
- Uses: forwardRef, cn utility, Tailwind v4
- Spinner: Custom SVG animation

**Input** (`src/components/ui/input.tsx`)
- Props: label, error, helperText
- Features: Error states, helper text, disabled state
- Uses: forwardRef, cn utility
- Styling: Hardcoded gray/blue/red colors

## Tailwind Configuration Status

**Version:** Tailwind v4 + @tailwindcss/postcss
**PostCSS Config:** `postcss.config.mjs` (minimal, only @tailwindcss/postcss)
**globals.css:**
- Using `@import "tailwindcss"` directive
- CSS custom properties for colors (--background, --foreground)
- Dark mode support (prefers-color-scheme)
- No CSS variables for the complete design system yet

**tailwind.config.ts:**
- Currently empty (placeholder only)
- No custom theme configuration
- No color palette defined

## Package.json Dependencies

**Core:**
- next: 16.1.4
- react: 19.2.3
- react-dom: 19.2.3
- typescript: 5

**UI/Styling:**
- tailwindcss: 4
- @tailwindcss/postcss: 4
- clsx: 2.1.1
- tailwind-merge: 3.4.0

**State/Data:**
- zustand: 5.0.10
- @tanstack/react-query: 5.90.19
- axios: 1.13.2
- zod: 4.3.5

**Utilities:**
- date-fns: 4.1.0

**Missing for Shadcn/ui:**
- None at core level (can install as needed)

## globals.css Current State

- Minimal setup (27 lines)
- Light/dark mode CSS variables
- Typography: Arial, Helvetica defaults (no system font stack)
- Tailwind v4 @import syntax

## Styling Patterns & Theme

- **Color Scheme:** Light/dark with CSS variables
- **Font:** Inter imported from Google Fonts (layout.tsx)
- **Spacing:** Standard Tailwind (no custom spacing tokens)
- **Components:** Custom implementations (Button, Input) with hardcoded colors
- **Utility:** cn() function ready (clsx + tailwind-merge)

## Shadcn/ui Integration Recommendations

### Immediate Actions:
1. Install shadcn/ui CLI and initialize with Tailwind v4 config
2. Create/update `tailwind.config.ts` with design tokens (colors, spacing, typography)
3. Extend globals.css with shadcn design system CSS variables
4. Replace hardcoded Button/Input colors with CSS variable-based styling

### Component Migration:
- Button: Can be replaced with shadcn Button (backward compatible via props)
- Input: Can be replaced with shadcn Input (needs minor refactoring)
- Maintain custom components in separate folder during transition

### Configuration Changes:
- Update `tailwind.config.ts` to include shadcn theme
- Update `next.config.ts` with alias paths if needed
- Update `globals.css` with complete design token system

### Best Practices:
- Keep project/task/common component folders for domain-specific UI
- Use shadcn as base layer in `ui/` folder
- Establish CSS variable naming convention before adding components

## File Locations Summary

```
Package: /frontend/package.json
Config: /frontend/next.config.ts, /frontend/postcss.config.mjs
Styles: /frontend/src/app/globals.css
Components: /frontend/src/components/ui/
Utils: /frontend/src/lib/utils/index.ts
Layout: /frontend/src/app/layout.tsx
Providers: /frontend/src/providers/
```

## Status

✓ Tailwind v4 ready
✓ CSS custom properties in place
✓ Utility structure (cn, formatters)
✓ Component organization ready
✗ Design tokens not defined
✗ shadcn/ui not installed
✗ Dark mode CSS variables incomplete
