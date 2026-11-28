# System Design Interview Trainer (PWA)

Practice system design interviews offline: 3 scenarios, Senior/Staff levels, Arabic (Egyptian RTL) ↔ English, interactive drawing board, capacity calculator, chaos mode, trade-off cards, radar report, pattern cheat sheet, and a bilingual glossary.

## Run locally

```bash
npm ci
npm run dev
```

Open the printed local URL (base path `/system-design-interviewer/`).

## Build

```bash
npm run validate   # schema + i18n + glossary link checks
npm run build      # validate + typecheck + Vite build
npm run preview
```

Content is JSON under `src/data/` — see [CONTENT.md](./CONTENT.md) for how to add scenarios, cheat sheet rows, and glossary terms.

## Features

- **Scenarios**: Image Upload, URL Shortener, Chat/Messaging
- **Levels**: Senior + optional Staff questions
- **i18n**: Full AR/EN with RTL/LTR
- **Drawing board**: drag components, connect edges, compare to proposed design
- **Capacity calculator**: enter estimates, check vs reference with worked steps
- **Chaos mode**: surprise incident cards with countdown + checklist scoring
- **Trade-off cards**: pick side, justify, reveal interviewer expectations
- **Radar report**: SVG radar + attempt history in localStorage
- **Cheat sheet**: searchable pattern catalog + Print/PDF (`#/cheatsheet`) with glossary appendix
- **Glossary**: searchable A–Z / category index + term pages (`#/glossary`, `#/glossary/<id>`)

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` (Source = GitHub Actions).

Live: https://hazemgharib.github.io/system-design-interviewer/
