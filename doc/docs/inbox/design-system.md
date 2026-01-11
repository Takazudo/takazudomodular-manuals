---
title: Design System
sidebar_position: 100
---

# Design System

This document describes the Zudo Design System used in this project, including spacing conventions, color system, and typography.

## 🎯 Design System Philosophy

**All Tailwind CSS defaults are disabled.** Only the tokens defined in the Zudo Design System are available for use.

This ensures that:

- No default Tailwind utilities like `h-4`, `text-sm`, `bg-gray-500` can be used
- Only explicitly defined design tokens are available
- Design consistency is enforced at the build level
- Accidental use of non-design-system values is prevented

## 📐 Architectural Rule: Using Design Tokens vs Arbitrary Values

When styling components, follow this decision-making process:

### 1. Use Design Tokens First (Preferred)

Always try to use defined design tokens first:

```tsx
// ✅ GOOD - Using design tokens
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

```tsx
// Then use it
<div className="px-custom-value">
```

#### Option B: Use Arbitrary Values (ALLOWED!)

**Arbitrary values ARE allowed** in Tailwind v4! Use them for one-off, specific cases:

```tsx
// ✅ GOOD - Arbitrary values for specific needs
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

### ⚠️ NEVER Use Numeric Tailwind Classes

Avoid Tailwind's default numeric classes - these are **not** design system tokens:

```tsx
// ❌ BAD - Numeric Tailwind defaults
<div className="p-4 m-8 gap-2">
<div className="mr-4 ml-6">

// ✅ GOOD - Use design tokens instead
<div className="p-vgap-xs m-vgap-sm gap-hgap-xs">
<div className="mr-hgap-xs ml-hgap-sm">
```

**Why?** Numeric classes (p-4, m-8) reference Tailwind's default spacing scale, which is disabled in our design system. They should be replaced with our semantic spacing tokens (hgap-\*, vgap-\*).

## Architecture

### Configuration Files

1. **`/app/globals.css`** - Contains all design system definitions:

- `:root` variables - Zudo Design System token definitions (--zd-\*)
- `@theme` block - Maps Zudo tokens to Tailwind theme variables (disables Tailwind defaults by only defining custom tokens)

2. **`/tailwind.config.cjs`** - Minimal configuration:

- Content paths for Tailwind to scan
- Custom plugins only
- NO theme configuration (moved to globals.css)

3. **`/postcss.config.cjs`** - PostCSS configuration:

- Tailwind CSS v4 PostCSS plugin only

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

**Key Pattern**: We first use **wildcard resets** (`--namespace-*: initial`) to remove ALL Tailwind default utilities, then define only our custom Zudo tokens. This ensures utilities like `bg-red-500`, `p-4`, `text-gray-500` are completely unavailable.

This architecture ensures that **only** Zudo Design System tokens are available as Tailwind utilities.

## Layout Spacing

### Spacing Philosophy

The Zudo Design System uses a semantic spacing system with **vgap** (vertical gaps) and **hgap** (horizontal gaps) instead of Tailwind's default numeric spacing scale (like `px-4`, `mr-8`).

**Why?** Using semantic spacing creates a consistent, rule-based design that maintains visual harmony across the application.

### Spacing Definitions

Our spacing system is defined in `/src/styles/global.css`:

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

### Usage Rules

#### ✅ DO: Use vgap for vertical spacing

```jsx
// Vertical margins, padding, gaps
<div className="mt-vgap-md mb-vgap-lg">
<div className="py-vgap-sm">
<div className="gap-y-vgap-xs">
```

#### ✅ DO: Use hgap for horizontal spacing

```jsx
// Horizontal margins, padding, gaps
<div className="mx-hgap-md pl-hgap-sm">
<div className="px-hgap-xs">
<div className="gap-x-hgap-md">
```

#### ❌ DON'T: Use default Tailwind numeric spacing

```jsx
// These will NOT compile - Tailwind defaults are disabled
<div className="px-4 py-8">        // ❌ Error: utilities not defined
<div className="mt-6 mb-10">       // ❌ Error: utilities not defined
<div className="gap-5">            // ❌ Error: utilities not defined
<div className="text-gray-500">    // ❌ Error: color not defined
<div className="h-4 w-8">          // ❌ Error: spacing not defined
```

**Why these fail:** Wildcard resets (`--spacing-*: initial`, `--color-*: initial`) remove all Tailwind default utilities. Only Zudo Design System tokens are available.

#### ✅ DO: Use arbitrary values for detailed tweaks

When the design requires a specific value that doesn't match the vgap/hgap scale:

```jsx
// Fine-tuning with arbitrary values is acceptable
<div className="px-[3px] mt-[15px]">
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

### Common Patterns

#### Container Padding

```jsx
// Page container
<div className="px-hgap-sm py-vgap-md">

// Card/Component padding
<div className="px-hgap-xs py-vgap-sm">
```

#### Grid Gaps

```jsx
// Product grid with appropriate gaps
<div className="grid gap-hgap-xs gap-y-vgap-sm">
```

#### Section Margins

```jsx
// Section spacing
<section className="mt-vgap-lg mb-vgap-xl">
```

## Color System

The Zudo Design System includes a custom color palette defined as CSS variables:

```css
/* Colors */
--zd-color-black: rgb(28, 25, 23);
--zd-color-white: rgb(214, 211, 209);
--zd-color-link: #fff; /* White with text-shadow for visibility */
--zd-color-active: #713f12;
--zd-color-gray: rgb(120, 113, 108);
--zd-color-gray2: #201f1f;
--zd-color-strong: #d97706; /* Orange/amber for strong text emphasis */
--zd-color-notify: #22c55e;
--zd-color-error: #f43f5e;
--zd-color-debug: #ff0000;
--zd-color-price: #fbbf24;
--zd-color-outline: #ea580c; /* Focus/active outlines */
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

The project uses a combined font-size and line-height system for consistent typography:

```css
/* Font size / line height combinations */
--zd-font-xs-size: 1rem; /* 10px */
--zd-font-xs-lineHeight: 1.4;
--zd-font-sm-size: 1.1rem; /* 11px */
--zd-font-sm-lineHeight: 1.5;
--zd-font-base-size: 1.4rem; /* 14px */
--zd-font-base-lineHeight: 1.7;
--zd-font-lg-size: 1.6rem; /* 16px */
--zd-font-lg-lineHeight: 1.5;
--zd-font-xl-size: 1.9rem; /* 19px */
--zd-font-xl-lineHeight: 1.4;
--zd-font-2xl-size: 2.8rem; /* 28px */
--zd-font-2xl-lineHeight: 1.35;
--zd-font-3xl-size: 3.2rem; /* 32px */
--zd-font-3xl-lineHeight: 1.3;
--zd-font-4xl-size: 4rem; /* 40px */
--zd-font-4xl-lineHeight: 1.3;
--zd-font-5xl-size: 4.8rem; /* 48px */
--zd-font-5xl-lineHeight: 1.3;
```

### Typography Usage

```jsx
// Use Tailwind classes that map to these variables
<h1 className="text-5xl">  // Uses --zd-font-5xl-size and lineHeight
<h2 className="text-4xl">  // Uses --zd-font-4xl-size and lineHeight
<h3 className="text-3xl">  // Uses --zd-font-3xl-size and lineHeight
<p className="text-base">  // Uses --zd-font-base-size and lineHeight
```

### Line Height Classes

For cases where you need to override line height:

```css
--zd-lineHeight-none: 1;
--zd-lineHeight-tight: 1.4;
--zd-lineHeight-snug: 1.6;
--zd-lineHeight-normal: 1.8;
--zd-lineHeight-relaxed: 1;
--zd-lineHeight-loose: 2.3;
```

## Custom Utilities

### Text Shadows

```jsx
// Add text shadow for better readability on images
<h1 className="text-shadow-md">

// Remove text shadow
<span className="text-shadow-none">
```

### Link Styles

#### Inverted Link (for use on dark backgrounds)

```jsx
// Standard inverted link with hover/focus/active states
<a href="#" className="zd-invert-color-link">

// Inverted link specifically for inline text
<a href="#" className="zd-invert-color-link-inline">

// Forced focus state (for accessibility/testing)
<a href="#" className="zd-invert-color-link--focus">
```

### Gradients

```jsx
// Black to transparent gradient
<div className="zd-gradient-black-to-transparent">

// White to transparent gradient
<div className="zd-gradient-white-to-transparent">
```

### Utility Classes

```jsx
// Clearfix for float layouts
<div className="clearfix">

// Hash symbol spacing
<span className="zd-hash">#</span>
```

## Best Practices

1. **Consistency**: Always use vgap/hgap for spacing unless there's a specific design requirement
2. **Semantic naming**: The spacing names reflect their purpose (vertical vs horizontal)
3. **Arbitrary values**: Use `[value]` syntax only for fine-tuning that doesn't fit the scale
4. **Design tokens**: Prefer design system tokens over raw Tailwind utilities
5. **Maintainability**: Using the design system makes global spacing changes easier

## Migration Guide

When converting existing code to use the design system:

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

### Conversion Reference

Common Tailwind spacing to vgap/hgap mapping:

**Horizontal (padding/margin-x):**

- `px-2` (8px) → `px-hgap-2xs` (5px) or `px-hgap-xs` (12px)
- `px-4` (16px) → `px-hgap-xs` (12px) or `px-hgap-sm` (20px)
- `px-6` (24px) → `px-hgap-sm` (20px)
- `px-8` (32px) → `px-hgap-md` (40px)

**Vertical (padding/margin-y):**

- `py-2` (8px) → `py-vgap-xs` (8px)
- `py-4` (16px) → `py-vgap-sm` (20px)
- `py-6` (24px) → `py-vgap-sm` (20px)
- `py-8` (32px) → `py-vgap-md` (35px)
- `mt-10` (40px) → `mt-vgap-md` (35px) or `mt-vgap-lg` (50px)

## Example: Product Grid

```jsx
// Using Zudo Design System spacing
<div className="min-h-screen bg-zd-black px-hgap-sm py-vgap-md">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-hgap-xs gap-y-vgap-sm">
    <div className="bg-zd-gray2 p-hgap-xs">
      <img className="mb-vgap-xs" />
      <h3 className="text-zd-white text-lg mb-vgap-2xs">Product Name</h3>
      <p className="text-zd-price text-xl">¥1,480</p>
    </div>
  </div>
</div>
```

## 🚫 Prohibited Utilities (Will Not Compile)

Due to wildcard resets in the `@theme` block, the following Tailwind default utilities are **completely removed** and will cause build errors if used:

### Spacing

- `h-1` through `h-96` - Use `h-hgap-*` or `h-vgap-*` instead
- `w-1` through `w-96` - Use `w-hgap-*` instead
- `p-1`, `px-4`, `py-8`, etc. - Use `p-hgap-*` or `p-vgap-*` instead
- `m-1`, `mx-4`, `my-8`, etc. - Use `m-hgap-*` or `m-vgap-*` instead
- `gap-1`, `gap-x-4`, `gap-y-8`, etc. - Use `gap-hgap-*` or `gap-vgap-*` instead

### Colors

- `bg-gray-*`, `text-blue-*`, `border-red-*` - All Tailwind color palette
- Use only: `zd-black`, `zd-white`, `zd-gray`, `zd-gray2`, `zd-link`, `zd-active`, `zd-notify`, `zd-error`, `zd-price`

### Typography

- `text-xs`, `text-sm` (Tailwind defaults) - Use only if defined in @theme block
- `leading-normal`, `leading-snug` (Tailwind defaults) - Use custom line-height tokens

### Example Build Errors

```jsx
// ❌ This code will FAIL to build:
<div className="px-4 bg-gray-500 text-sm">Content</div>

// Error: The utility `px-4` does not exist in your theme.
// Error: The utility `bg-gray-500` does not exist in your theme.
// Error: The utility `text-sm` does not exist in your theme.
```

## ✅ Expected Behavior

### What Works

```jsx
// ✅ Only Zudo Design System tokens compile successfully:
<div className="px-hgap-sm bg-zd-gray2 text-base">
  Content
</div>

<div className="h-vgap-md text-zd-white leading-tight">
  Content
</div>

// ✅ Arbitrary values still work for one-off tweaks:
<div className="px-[15px] mt-[22px]">
  Fine-tuned spacing
</div>
```

### Development Experience

1. **Type a non-existent utility** → Build fails with clear error message
2. **Check available tokens** → Refer to this documentation
3. **Use correct Zudo token** → Build succeeds

This strict enforcement ensures design consistency across the entire application.

## 🧠 Summary

**Setup Steps:**

1. Define design tokens in `:root` (--zd-\* variables)
2. In `@theme` block, use wildcard resets to remove ALL Tailwind defaults
3. Then define only custom Zudo tokens in the `@theme` block
4. Only custom tokens are available - Tailwind defaults are completely removed

**Key Syntax:**

```css
@theme {
  /* STEP 1: Reset all Tailwind defaults using wildcard patterns */
  --spacing-*: initial;
  --color-*: initial;
  --text-*: initial;
  --font-*: initial;
  --shadow-*: initial;
  --width-*: initial;
  /* ... more namespace resets ... */

  /* STEP 2: Define ONLY custom tokens */
  --spacing-0: 0;
  --spacing-hgap-md: 40px;
  --color-zd-black: #1c1917;
  --font-futura: Futura, sans-serif;
  /* ... */
}
```

**Benefits:**

- ✅ Enforced design consistency at build time
- ✅ Impossible to use non-design-system values
- ✅ Clear build errors guide developers to correct tokens
- ✅ Centralized design system in one file
- ✅ No need for external tailwind.config.js theme configuration

## Related Files

- **All design system configuration**: `/app/globals.css`
- **Minimal Tailwind config**: `/tailwind.config.cjs` (content paths only)
- **PostCSS config**: `/postcss.config.cjs` (Tailwind CSS v4 plugin)
