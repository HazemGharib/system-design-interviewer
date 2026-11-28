/**
 * One-shot exporter: reads existing TS modules via dynamic import (tsx)
 * and writes JSON under src/data/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { register } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function loadTs(rel) {
  const url = pathToFileURL(join(root, rel)).href;
  return import(url);
}

function write(rel, data) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  console.log('wrote', rel);
}

async function main() {
  // Use tsx loader via spawn alternative: compile with node --import tsx
  const { imageUploadScenario } = await import(pathToFileURL(join(root, 'src/scenarios/imageUpload.ts')).href);
  const { urlShortenerScenario } = await import(pathToFileURL(join(root, 'src/scenarios/urlShortener.ts')).href);
  const { chatMessagingScenario } = await import(pathToFileURL(join(root, 'src/scenarios/chatMessaging.ts')).href);
  const { CHEATSHEET_CATEGORIES, NUMBERS_TO_KNOW } = await import(pathToFileURL(join(root, 'src/data/cheatsheet.ts')).href);
  const { CAPACITY_DATA } = await import(pathToFileURL(join(root, 'src/interactive/capacityData.ts')).href);
  const { CHAOS_INCIDENTS } = await import(pathToFileURL(join(root, 'src/interactive/chaosData.ts')).href);
  const { TRADEOFF_CARDS } = await import(pathToFileURL(join(root, 'src/interactive/tradeoffData.ts')).href);
  const { DRAWING_EXPECTATIONS } = await import(pathToFileURL(join(root, 'src/interactive/drawingData.ts')).href);
  const { PALETTE } = await import(pathToFileURL(join(root, 'src/interactive/palette.ts')).href);

  const scenarios = [imageUploadScenario, urlShortenerScenario, chatMessagingScenario];

  for (const sc of scenarios) {
    const id = sc.id;
    const payload = {
      ...sc,
      capacity: CAPACITY_DATA[id] || null,
      chaos: CHAOS_INCIDENTS[id] || [],
      tradeoffs: TRADEOFF_CARDS[id] || [],
      drawing: DRAWING_EXPECTATIONS[id] || null,
    };
    write(`src/data/scenarios/${id}.json`, payload);
  }

  write('src/data/scenarios/manifest.json', {
    scenarios: scenarios.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      difficulty: s.difficulty,
      estimatedTime: s.estimatedTime,
    })),
  });

  write('src/data/cheatsheet.json', {
    categories: CHEATSHEET_CATEGORIES,
    numbers: NUMBERS_TO_KNOW,
  });

  write('src/data/palette.json', { items: PALETTE });

  console.log('export complete');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
