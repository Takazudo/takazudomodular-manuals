---
sidebar_position: 1
pagination_next: null
pagination_prev: null
---

# INBOX

Development documentation for Takazudo Modular: Manuals project.

## Current Content

### Design System

- **[📐 Design System](design-system.md)** - Zudo Design System: spacing, colors, typography, and custom utilities

## Project Overview

### Project Goal

Create a web-based manual viewer for hardware synthesizer manuals that displays:

- Multiple manuals in bilingual format
- Original English PDF pages (rendered as PNG images at 300 DPI)
- Japanese translations alongside each page
- Searchable, user-friendly interface

### Technology Stack

- **Next.js 14+** - App Router for SSR and static generation
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with Zudo Design System
- **Docusaurus 3** - Technical documentation system (this site)

### Data Structure

- **JSON format** for translation data (pages.json per manual)
- **Markdown/MDX** for translation content
- **PNG images** for rendered PDF pages

## Documentation Categories

### INBOX

Main development documentation including:

- Design system documentation
- Development guidelines
- Project architecture

## Planned Content

- Component development guide
- Translation workflow documentation
- Deployment procedures
- Testing guidelines
- Data migration documentation
