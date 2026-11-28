# System Design Interview Trainer (PWA)

Practice system design interviews offline: 3 scenarios, Senior/Staff levels, Arabic (Egyptian RTL) ↔ English, interactive drawing board, capacity calculator, chaos mode, trade-off cards, radar report, and a comprehensive pattern cheat sheet.

## Run locally

```bash
npm ci
npm run dev
```

Open the printed local URL (base path `/system-design-interviewer/`).

## Build

```bash
npm run build
npm run preview
```

## Features

- **Scenarios**: Image Upload, URL Shortener, Chat/Messaging
- **Levels**: Senior + optional Staff questions
- **i18n**: Full AR/EN with RTL/LTR
- **Drawing board**: drag components, connect edges, compare to proposed design
- **Capacity calculator**: enter estimates, check vs reference with worked steps
- **Chaos mode**: surprise incident cards with countdown + checklist scoring
- **Trade-off cards**: pick side, justify, reveal interviewer expectations
- **Radar report**: SVG radar + attempt history in localStorage
- **Cheat sheet**: searchable pattern catalog + Print/PDF (`#/cheatsheet`)

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` (Source = GitHub Actions).

Live: https://hazemgharib.github.io/system-design-interviewer/
