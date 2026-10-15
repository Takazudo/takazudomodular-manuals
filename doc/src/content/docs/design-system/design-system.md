---
title: Zudo Design System
description: >-
  Root application Wind tokens, authored CSS, semantic spacing (hgap/vgap), colors, and typography,
  with the separate documentation preset described explicitly.
sidebar_position: 1
---

# Zudo Design System

The manual viewer uses zudo-wind and authored CSS. Utility mappings, breakpoints,
and the reset live in `zfb.config.ts`; their CSS variable values and authored
classes live in `styles/global.css`. Prose rules live in `styles/prose.css`.
The former Tailwind and PostCSS configuration files are no longer used.

## Token and cascade contract

Use semantic tokens first. JSX uses HTML-spelled `class` attributes:

```tsx
<div class="px-hgap-md py-vgap-sm bg-zd-black text-zd-white" />
```

A new semantic utility needs both its raw CSS variable and a mapping in
`wind.tokens`. For example, `spacing['hgap-md']` maps to
`var(--zd-spacing-hgap-md)`. Adding a CSS variable alone does not register a
utility. Supported arbitrary values such as `w-[85%]` and `pt-[20px]` are useful
for one-off geometry; prefer authored CSS for unsupported syntax.

The root uses `reset: 'owned-v1'`, `strict: true`, and
`utilities.placement: 'before-authored'`. Authored declarations follow generated
utilities, but specificity still decides which declaration wins. Do not assume
that putting a rule in a layer makes it outrank unlayered utilities.

Keep complete utility candidates in direct class strings or traced plain string
constants. Check them with `pnpm exec zfb wind audit --fail-on error`; verify
computed styles in a browser as well. `text-xs` and `text-sm` are valid because
this project explicitly maps them. The old Tailwind wildcard resets and
`@theme`, `@apply`, `@utility`, and `@source` directives must not be reintroduced.

## Responsive breakpoints

| Variant | Minimum width |
| --- | --- |
| `sm` | 580px |
| `md` | 740px |
| `lg` | 980px |
| `xl` | 1280px |
| `2xl` | 1630px |
| `3xl` | 1800px |

## Layout Spacing

### Spacing Philosophy

The Zudo Design System uses a semantic spacing system with **vgap** (vertical gaps) and **hgap** (horizontal gaps) with explicitly registered Wind tokens.

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
<div class="mt-vgap-md mb-vgap-lg">

// DO: Use hgap for horizontal spacing
<div class="mx-hgap-md pl-hgap-sm">

// DON'T: Use default Tailwind numeric spacing
<div class="px-4 py-8">        // Use the semantic tokens above
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
<h1 class="text-5xl">
<h2 class="text-4xl">
<h3 class="text-3xl">
<p class="text-base">
```

## Custom Utilities

### Text Shadows

```jsx
<h1 class="text-shadow-md">
<span class="text-shadow-none">
```

### Link Styles

```jsx
// Standard inverted link (for use on dark backgrounds)
<a href="#" class="zd-invert-color-link">

// Inverted link for inline text
<a href="#" class="zd-invert-color-link-inline">
```

### Gradients

```jsx
<div class="zd-gradient-black-to-transparent">
<div class="zd-gradient-white-to-transparent">
```

## Documentation host

`doc/` uses zudo-doc 7 on the same ZFB 4.5.2 engine family, with the preset's
own Wind manifest and `hsp`/`vsp` token names. Its `sm`/`lg`/`xl` breakpoints
are 640/1024/1280px; they are independent of the root viewer's breakpoints.
`doc/zfb.config.ts` sets `wind.sources.rootPackage: false` so the unrelated
root viewer's tokens are not scanned into the documentation stylesheet.

`doc/src/styles/global.css` imports the public package styles and retains the
host's token values as ordinary `:root` declarations. The semantic z-index
values come from `doc/src/config/z-index-tokens.ts`; run
`pnpm --dir doc gen:z-index` after editing them and
`pnpm --dir doc check:z-index` to check the generated block. Do not edit that
block manually.

## Verification

Run root quality/unit checks and `pnpm b4push`. For documentation changes run
`pnpm --dir doc check`, `check:pin-parity`, `check:wrangler-pin`,
`check:template-drift`, `check:z-index`, and `b4push`. Browser checks must cover
actual hydration, navigation, search, theme controls, and responsive layout.
Noto Sans JP is loaded through Google Fonts by the root layout; fallback-font
screenshots do not establish intended-font visual parity.
