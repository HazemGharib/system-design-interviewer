# Content guide

All static interview content lives under `src/data/` as JSON (bundled at build time so the PWA stays offline). Edit JSON — do not put scenario/cheat/glossary copy back into TypeScript.

## Layout

```
src/data/
  cheatsheet.json
  glossary.json
  palette.json
  scenarios/
    manifest.json
    image-upload.json
    url-shortener.json
    chat-messaging.json
```

`import.meta.glob` loads every `src/data/scenarios/*.json` except `manifest.json`. The manifest controls display order and must list each scenario id.

## Add or edit a scenario

1. Copy an existing file in `src/data/scenarios/` (e.g. `url-shortener.json`).
2. Set a unique `id` matching the filename (`my-scenario.json` → `"id": "my-scenario"`).
3. Fill bilingual fields (`{ "ar": "...", "en": "..." }`) for title, description, problem, facts, stages, checklist details, capacity, chaos, trade-offs, and drawing.
4. Add an entry to `scenarios/manifest.json`.
5. Run `npm run validate` (also runs as part of `npm run build`).

Required scenario sections: `stages` (with senior/staff levels), `capacity` (or `null`), `chaos`, `tradeoffs`, `drawing` (or `null`). Checklist item `detail` must include `ar`/`en` objects with `why`, `how`, `tradeoffs`, `examples`, `mistakes`.

## Capacity formulas

`capacity` is formula-driven (Auto + Practice modes):

```json
{
  "variables": [
    {
      "id": "dau",
      "label": { "ar": "...", "en": "Daily Active Users" },
      "unit": { "ar": "يوزر", "en": "users" },
      "default": 10000000,
      "role": "input"
    },
    {
      "id": "peakFactor",
      "label": { "ar": "...", "en": "Peak factor" },
      "unit": { "ar": "x", "en": "x" },
      "default": 3,
      "role": "assumption",
      "range": { "goodMin": 2, "goodMax": 4, "okMin": 1.5, "okMax": 6 },
      "rangeHint": {
        "ar": "معامل الذروة المعتاد حوالي ٢–٤× متوسط الحمل.",
        "en": "Typical peak factor is about 2–4× average load."
      }
    }
  ],
  "metrics": [
    {
      "id": "writeQps",
      "label": { "ar": "...", "en": "Write QPS" },
      "unit": { "ar": "طلب/ث", "en": "req/s" },
      "format": "qps",
      "expr": "uploadsDay / 86400",
      "display": [
        { "ref": "uploadsDay" },
        { "text": " ÷ " },
        { "const": 86400 }
      ],
      "practice": true
    }
  ],
  "steps": [{ "ar": "...", "en": "..." }]
}
```

- `variables[].role`: `input` (problem numbers the user types) or `assumption` (editable peak factor, retention, etc.).
- `variables[].default`: expected value kept in JSON for Auto Check (inputs) / Practice fill — **never** shown as UI prefill/placeholder.
- `variables[].range` + `rangeHint` (required for assumptions): reasonable bands for Auto Check (`good` / `ok` / `off`) with a short bilingual explanation. Do not put the exact expected number in failure copy for inputs.
- Auto mode **Check** grades problem inputs vs `default` (without revealing the number on failure) and assumptions vs `range`; empty fields are `missing`. Practice mode Check is unchanged (grades metric estimates).
- `metrics[].expr`: arithmetic with `+ - * / **`, ids, and numbers.
- `metrics[].display`: formula UI parts — `{ text }`, `{ const }`, `{ ref }` (prior metric/variable), `{ var }` (inline editable variable).
- `metrics[].practice`: if true, shown as a graded estimate field in Practice mode.
- UI inputs start empty with unit/label placeholders only; Clear wipes values.

## Add a cheat sheet entry

Edit `src/data/cheatsheet.json`:

- Pick a category (or add one with `id` + bilingual `title`).
- Append an entry with `id`, `problem`, `patterns`, `when`, `tradeoffs`, `example`, `tags`, and `termIds`.
- `termIds` must reference existing ids in `glossary.json` (validator fails otherwise).

## Add a glossary term

Edit `src/data/glossary.json`:

- Ensure the `category` id exists under `categories`.
- Add a term with `id`, `category`, bilingual `name`, `short`, `definition`, `when`, `pros`, `cons`, `example`, and `related` (array of other term ids).
- Link the term from cheat sheet entries via `termIds` when it appears in patterns text.

Deep links: `#/glossary` and `#/glossary/<term-id>`.

## Validation

```bash
npm run validate
```

Fails the build/CI on missing bilingual fields, schema errors, manifest mismatches, capacity formula/link errors, or glossary/cheat links to unknown term ids.
