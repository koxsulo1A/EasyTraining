// Assembles the web app into ./www — the folder Capacitor bundles into the iOS app.
// Source files stay in the repo root so the existing dev/preview flow is unchanged.
import { rm, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const OUT = 'www';
const ITEMS = ['index.html', 'css', 'js', 'supplements.json'];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const item of ITEMS) {
  if (existsSync(item)) {
    await cp(item, `${OUT}/${item}`, { recursive: true });
    console.log('copied', item);
  } else {
    console.log('skip (missing)', item);
  }
}
console.log('Web assets ready in ./' + OUT);
