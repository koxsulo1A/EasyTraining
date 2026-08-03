// Assembles the web app into ./www — the folder Capacitor bundles into the iOS app.
// Source files stay in the repo root so the existing dev/preview flow is unchanged.
import { rm, mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OUT = 'www';
const ITEMS = ['index.html', 'css', 'js', 'supplements.json', 'landing'];

// ── BUILD ID ──────────────────────────────────────────────────────────────
// Jednoznaczny identyfikator tej kompilacji. Służy do dwóch rzeczy:
//  1) cache-busting — podmienia WSZYSTKIE ?v=… w index.html, więc WebView na
//     iPhonie nie może podać starego JS/CSS, nawet jeśli ktoś zapomniał ręcznie
//     bumpnąć numer wersji przy edycji pliku (to się realnie zdarzało);
//  2) widoczny stempel w aplikacji (Profil), żeby dało się jednym rzutem oka
//     sprawdzić, czy telefon faktycznie ma nową wersję po instalacji .ipa.
function buildId() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
  // W CI numer runu jest monotoniczny i czytelny; lokalnie fallback na skrót commita.
  const run = process.env.GITHUB_RUN_NUMBER;
  if (run) return `${stamp}.${run}`;
  try {
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return `${stamp}.${sha}`;
  } catch {
    return stamp;
  }
}

const BUILD_ID = buildId();

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

// ── Cache-busting + stempel wersji w kopii index.html ─────────────────────
// Zmieniamy tylko plik w ./www — źródło w repo zostaje z ręcznymi ?v=N, żeby
// nie robić szumu w gicie przy każdym buildzie.
const htmlPath = `${OUT}/index.html`;
let html = await readFile(htmlPath, 'utf8');

// Każdy lokalny plik js/ i css/ dostaje ten sam build ID — także te bez ?v=,
// żeby żaden zasób nie mógł zostać podany ze starego cache.
html = html.replace(/(src|href)="((?:js|css)\/[^"?]+)(\?v=[^"]*)?"/g,
  (_m, attr, path) => `${attr}="${path}?v=${BUILD_ID}"`);
const busted = (html.match(/\?v=/g) || []).length;

// Globalna stała odczytywana przez aplikację (Profil → informacje o wersji).
const marker = 'window.ET = {};';
if (!html.includes(marker)) {
  throw new Error('build-web: nie znaleziono "window.ET = {};" w index.html — stempel wersji nie zostałby wstrzyknięty');
}
html = html.replace(marker, `${marker}\nwindow.ET_BUILD = ${JSON.stringify(BUILD_ID)};`);

if (!busted) throw new Error('build-web: nie podmieniono żadnego ?v= — cache-busting nie zadziałał');
await writeFile(htmlPath, html, 'utf8');

console.log(`Web assets ready in ./${OUT} (build ${BUILD_ID}, ${busted} zasobów z cache-bustingiem)`);
