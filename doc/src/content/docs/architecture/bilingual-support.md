---
title: Bilingual Support (JA / EN)
sidebar_position: 2
---

# Bilingual Support (JA / EN)

The manual viewer displays every supported manual in two languages: **Japanese (JA, default)** and **English (EN)**. Users switch between them from a segmented toggle in the header utility bar. This page documents the user-facing behaviour and the implementation contract so future contributors know what to preserve.

## Default language

- The default UI language is **Japanese** (`ja`).
- On first visit to any manual page, the translation column renders in Japanese and the `<div lang="ja">` attribute is set on the translation panel.
- The URL has no `?lang=` query parameter when Japanese is active — default-state URLs stay clean and shareable.

## Toggling language

A segmented control labelled `JA | EN` appears in the header utility bar whenever the user is viewing a manual (index page, page view, scroll view). Clicking a segment switches the active language immediately, with no navigation.

- Click **EN** → translation column re-renders in English and the URL gains `?lang=en`.
- Click **JA** → translation column re-renders in Japanese and the `?lang=` query parameter is removed from the URL.

The toggle is a visual segmented control. The active segment is indicated by `aria-pressed="true"` and a filled background; the inactive segment uses `aria-pressed="false"`.

## URL behaviour

| State   | URL shape                                  |
| ------- | ------------------------------------------ |
| JA (default) | `/<id>/page/<n>`                   |
| EN      | `/<id>/page/<n>?lang=en`           |

Rules:

- `?lang=en` appears only when English is active.
- `?lang=ja` is **never written** by the app — Japanese is the default, so a clean URL already implies JA.
- If a user pastes a URL ending in `?lang=en`, the page renders in English on load. Removing the parameter and reloading falls back to the persisted choice (see below).
- Any unsupported value in `?lang=` is ignored and treated as JA.

## Persistence (localStorage)

The selected language is persisted in `window.localStorage` under the key:

```
zmanuals:lang
```

- Values are `"ja"` or `"en"`.
- The key is written every time the toggle is clicked.
- On page load the provider resolves the active language in this priority order:
  1. `?lang=` query parameter on the current URL
  2. `localStorage["zmanuals:lang"]`
  3. Default (`"ja"`)
- The namespaced key prefix (`zmanuals:`) avoids collisions with other `takazudomodular` apps hosted on the same origin.

Clearing localStorage and reloading returns the viewer to the Japanese default.

## Manuals without English (disabled-toggle caveat)

Not every manual ships both languages. The registry records which languages each manual has via `hasLanguage(manualId, lang)`. When English is unavailable for the current manual:

- The **EN** segment is rendered with `aria-disabled="true"` and a dimmed style.
- Clicking EN is a no-op — the active language stays JA.
- Hovering or keyboard-focusing the EN segment reveals a Japanese tooltip: `この資料は日本語のみ対応です` ("This document is only available in Japanese.").
- The URL and localStorage are not modified on a disabled click.

Today every shipped manual includes both `pages-ja.json` and `pages-en.json`, so the disabled state is not exercised in production. The mechanism is preserved for future additions that may ship JA-only first.

## Developer notes

- Language state is owned by `LanguageProvider` at `components/language/language-context.tsx`.
- The segmented control lives in `components/language/language-toggle.tsx` and is mounted by `components/header.tsx`.
- Viewers consume the active language via `useLanguage()` and pass `lang` down to `PageViewer` / `ScrollViewer`, which set it as the `lang` attribute on the translation container.
- Per-manual language data is shipped as `public/<manual-id>/data/pages-<lang>.json`; `lib/manual-data.ts` reads the correct file based on the active language.
- The initial render is always JA to keep the static export free of hydration mismatches; the persisted value is resolved inside a mount-time effect.
