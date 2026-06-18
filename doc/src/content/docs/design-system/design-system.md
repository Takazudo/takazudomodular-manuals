---
title: Zudo Design System
sidebar_position: 1
---

# Zudo Design System

This document describes the Zudo Design System used in this project, including spacing conventions, color system, and typography.

## Design System Philosophy

**All Tailwind CSS defaults are disabled.** Only the tokens defined in the Zudo Design System are available for use.

This ensures that:

- No default Tailwind utilities like `h-4`, `text-sm`, `bg-gray-500` can be used
- Only explicitly defined design tokens are available
- Design consistency is enforced at the build level
- Accidental use of non-design-system values is prevented

## Architectural Rule: Using Design Tokens vs Arbitrary Values

When styling components, follow this decision-making process:

### 1. Use Design Tokens First (Preferred)

Always try to use defined design tokens first:

```tsx
// Good — using design tokens
<div className="px-hgap-md py-vgap-sm bg-zd-black text-zd-white">
```

### 2. If No Token Matches

When no design token matches your needs, you have **two options**:

#### Option A: Consider Adding a Token

If this value will be reused or is semantically meaningful:

```css
/* Add to global.css */
--zd-spacing-custom-value: 32px;
```

#### Option B: Use Arbitrary Values (Allowed)

**Arbitrary values ARE allowed** in Tailwind v4. Use them for one-off, specific cases:

```tsx
// Good — arbitrary values for specific needs
<div className="w-[85%] pt-[20px] px-[32px]">
<div className="max-w-[400px] bg-[#custom-color]">
```

### When to Use Each Approach

**Use design tokens when:**

- The value is reused across multiple components
- The value has semantic meaning (e.g., "standard button padding")
- You want consistency across the design system

**Use arbitrary values when:**

- The value is unique to one specific component
- The value is mathematically calculated or component-specific
- Adding a token would create unnecessary abstraction

### NEVER Use Numeric Tailwind Classes

Avoid Tailwind's default numeric classes — these are **not** design system tokens:

```tsx
// Bad — numeric Tailwind defaults
<div className="p-4 m-8 gap-2">

// Good — use design tokens instead
<div className="p-vgap-xs m-vgap-sm gap-hgap-xs">
```

**Why?** Numeric classes (`p-4`, `m-8`) reference Tailwind's default spacing scale, which is disabled in our design system. They should be replaced with semantic spacing tokens (`hgap-*`, `vgap-*`).

## Architecture

### Configuration Files

1. **`/app/globals.css`** — Contains all design system definitions:
   - `:root` variables — Zudo Design System token definitions (`--zd-*`)
   - `@theme` block — Maps Zudo tokens to Tailwind theme variables (disables Tailwind defaults)

2. **`/tailwind.config.cjs`** — Minimal configuration (content paths, custom plugins only)

3. **`/postcss.config.cjs`** — PostCSS configuration (Tailwind CSS v4 PostCSS plugin)

### How It Works

```css
/* global.css */

/* 1. Define Zudo tokens in :root */
:root {
  --zd-spacing-hgap-md: 40px;
  --zd-color-black: rgb(28, 25, 23);
  /* ... */
}

/* 2. Reset Tailwind defaults, then define custom tokens */
@theme {
  /* STEP 1: Reset all Tailwind defaults using wildcard patterns */
  --spacing-*: initial;
  --color-*: initial;
  --text-*: initial;
  --font-*: initial;
  --shadow-*: initial;
  /* ... all namespace wildcards ... */

  /* STEP 2: Define ONLY Zudo Design System tokens */
  --spacing-0: 0;
  --spacing-hgap-md: var(--zd-spacing-hgap-md);
  --color-zd-black: var(--zd-color-black);
  --font-futura: Futura, Jost, 'Century Gothic', sans-serif;
  /* ... */
}
```

**Key Pattern**: First use **wildcard resets** (`--namespace-*: initial`) to remove ALL Tailwind default utilities, then define only custom Zudo tokens.

## Layout Spacing

### Spacing Philosophy

The Zudo Design System uses a semantic spacing system with **vgap** (vertical gaps) and **hgap** (horizontal gaps) instead of Tailwind's default numeric spacing scale.

### Spacing Definitions

```css
/* Spacing - Horizontal gaps */
--zd-spacing-1px: 1px;
--zd-spacing-hgap-2xs: 5px;
--zd-spacing-hgap-xs: 12px;
--zd-spacing-hgap-sm: 20px;
--zd-spacing-hgap-md: 40px;
--zd-spacing-hgap-md-x2: 80px;
--zd-spacing-hgap-lg: 60px;
--zd-spacing-hgap-lg-x2: 120px;
--zd-spacing-hgap-xl: 100px;
--zd-spacing-hgap-2xl: 250px;

/* Spacing - Vertical gaps */
--zd-spacing-vgap-2xs: 4px;
--zd-spacing-vgap-xs: 8px;
--zd-spacing-vgap-sm: 20px;
--zd-spacing-vgap-md: 35px;
--zd-spacing-vgap-lg: 50px;
--zd-spacing-vgap-xl: 65px;
--zd-spacing-vgap-2xl: 80px;
```

### Spacing Scale Reference

#### Horizontal Gaps (hgap)

| Class        | Value | Use Case                    |
| ------------ | ----- | --------------------------- |
| `hgap-2xs`   | 5px   | Minimal horizontal spacing  |
| `hgap-xs`    | 12px  | Small gaps between elements |
| `hgap-sm`    | 20px  | Default padding/margins     |
| `hgap-md`    | 40px  | Section spacing             |
| `hgap-md-x2` | 80px  | Large section spacing       |
| `hgap-lg`    | 60px  | Major layout divisions      |
| `hgap-lg-x2` | 120px | Extra large divisions       |
| `hgap-xl`    | 100px | Page margins                |
| `hgap-2xl`   | 250px | Maximum spacing             |

#### Vertical Gaps (vgap)

| Class      | Value | Use Case                 |
| ---------- | ----- | ------------------------ |
| `vgap-2xs` | 4px   | Minimal vertical spacing |
| `vgap-xs`  | 8px   | Tight vertical spacing   |
| `vgap-sm`  | 20px  | Default vertical gaps    |
| `vgap-md`  | 35px  | Section spacing          |
| `vgap-lg`  | 50px  | Major sections           |
| `vgap-xl`  | 65px  | Large vertical spacing   |
| `vgap-2xl` | 80px  | Maximum vertical spacing |

### Usage Rules

```jsx
// DO: Use vgap for vertical spacing
<div className="mt-vgap-md mb-vgap-lg">

// DO: Use hgap for horizontal spacing
<div className="mx-hgap-md pl-hgap-sm">

// DON'T: Use default Tailwind numeric spacing
<div className="px-4 py-8">        // Will NOT compile
```

## Color System

```css
/* Colors */
--zd-color-black: rgb(28, 25, 23);
--zd-color-white: rgb(214, 211, 209);
--zd-color-link: #fff;
--zd-color-active: #713f12;
--zd-color-gray: rgb(120, 113, 108);
--zd-color-gray2: #201f1f;
--zd-color-strong: #d97706;
--zd-color-notify: #22c55e;
--zd-color-error: #f43f5e;
--zd-color-debug: #ff0000;
--zd-color-price: #fbbf24;
--zd-color-outline: #ea580c;
```

### Color Usage

| Color   | Class                          | Use Case                       |
| ------- | ------------------------------ | ------------------------------ |
| Black   | `bg-zd-black`, `text-zd-black` | Backgrounds, primary text      |
| White   | `bg-zd-white`, `text-zd-white` | Light backgrounds, body text   |
| Gray    | `bg-zd-gray`, `text-zd-gray`   | Secondary elements             |
| Gray2   | `bg-zd-gray2`                  | Dark backgrounds               |
| Link    | `text-zd-link`                 | Links (white with text-shadow) |
| Strong  | `text-zd-strong`               | Strong text emphasis           |
| Active  | `bg-zd-active`                 | Active/pressed states          |
| Notify  | `text-zd-notify`               | Success messages               |
| Error   | `text-zd-error`                | Error messages                 |
| Price   | `text-zd-price`                | Price displays                 |
| Outline | `outline-zd-outline`           | Focus/active outlines          |

## Typography

### Font Sizes with Integrated Line Heights

```css
--zd-font-xs-size: 1rem;
--zd-font-sm-size: 1.1rem;
--zd-font-base-size: 1.4rem;
--zd-font-lg-size: 1.6rem;
--zd-font-xl-size: 1.9rem;
--zd-font-2xl-size: 2.8rem;
--zd-font-3xl-size: 3.2rem;
--zd-font-4xl-size: 4rem;
--zd-font-5xl-size: 4.8rem;
```

### Usage

```jsx
<h1 className="text-5xl">
<h2 className="text-4xl">
<h3 className="text-3xl">
<p className="text-base">
```

## Custom Utilities

### Text Shadows

```jsx
<h1 className="text-shadow-md">
<span className="text-shadow-none">
```

### Link Styles

```jsx
// Standard inverted link (for use on dark backgrounds)
<a href="#" className="zd-invert-color-link">

// Inverted link for inline text
<a href="#" className="zd-invert-color-link-inline">
```

### Gradients

```jsx
<div className="zd-gradient-black-to-transparent">
<div className="zd-gradient-white-to-transparent">
```

## Migration Guide

### Before (Default Tailwind)

```jsx
<div className="px-4 py-6 mt-8 mb-10">
  <div className="gap-5">
```

### After (Zudo Design System)

```jsx
<div className="px-hgap-xs py-vgap-sm mt-vgap-sm mb-vgap-md">
  <div className="gap-hgap-2xs">
```

## Prohibited Utilities (Will Not Compile)

Due to wildcard resets in the `@theme` block, the following Tailwind default utilities are **completely removed** and will cause build errors if used:

- `h-1` through `h-96`, `w-1` through `w-96`
- `p-1`, `px-4`, `py-8`, `m-1`, `mx-4`, `my-8`
- `gap-1`, `gap-x-4`, `gap-y-8`
- `bg-gray-*`, `text-blue-*`, `border-red-*` (all Tailwind color palette)
- `text-xs`, `text-sm` (Tailwind defaults)

## Related Files

- **All design system configuration**: `/app/globals.css`
- **Minimal Tailwind config**: `/tailwind.config.cjs`
- **PostCSS config**: `/postcss.config.cjs`
