# Documentation (Docusaurus) - CLAUDE.md

Docusaurus documentation system configuration. For project-wide instructions, see the root `CLAUDE.md`.

## Overview

Comprehensive project documentation is maintained in `/doc/` using Docusaurus 3.

- **INBOX category**: Main development documentation (in `doc/docs/inbox/`)
- **Japanese locale**: All documentation in Japanese (default language)
- **Dark mode**: Forced dark theme for consistency with the main app

## Development Commands

```bash
pnpm doc:dev            # Start Docusaurus dev server (port 3100, doc-zmanuals.localhost)
pnpm doc:build          # Build documentation for production
```

## URL Mapping

- `http://doc-zmanuals.localhost:3100/docs/inbox/` maps to files in `/doc/docs/inbox/`

## Structure

```
doc/
├── docs/
│   └── inbox/              # Main documentation category
├── docusaurus.config.ts    # Docusaurus configuration
├── package.json            # Doc-specific dependencies
├── plugins/                # Custom Docusaurus plugins
├── scripts/                # Doc build scripts
├── sidebars.ts             # Sidebar configuration
├── src/                    # Custom components and pages
├── static/                 # Static assets for documentation
└── tsconfig.json           # TypeScript config
```

## Design System Documentation

The Zudo Design System documentation is at `/doc/docs/inbox/design-system.md`. This is the authoritative reference for the custom Tailwind CSS v4 configuration used in the main app.
