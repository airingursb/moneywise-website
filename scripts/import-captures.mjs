#!/usr/bin/env node
/**
 * Copy app screen captures into src/assets/screens/captures/ so the site can use them.
 *
 *   node scripts/import-captures.mjs <captures-dir>
 *
 * Expects <captures-dir>/<device>/<locale>/<screen>.(png|jpg|webp), e.g.
 *   site-captures/iphone/en/dashboard.png
 *   site-captures/iphone-dark/zh/dashboard.png
 *   site-captures/duo/en/records.png
 *   site-captures/watch/en/summary.png
 * Any manifest.json at the root is copied alongside for reference.
 *
 * After importing, point the slots in src/config/screenshots.ts at
 * `captures/<device>/{locale}/<screen>.png` and run `pnpm run build`.
 * Astro optimizes the images at build time — no need to pre-resize.
 */
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error('usage: node scripts/import-captures.mjs <captures-dir>');
  process.exit(1);
}
const dest = path.resolve('src/assets/screens/captures');
const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
let n = 0;
for (const device of fs.readdirSync(src)) {
  const dDir = path.join(src, device);
  if (!fs.statSync(dDir).isDirectory()) continue;
  for (const locale of fs.readdirSync(dDir)) {
    const lDir = path.join(dDir, locale);
    if (!fs.statSync(lDir).isDirectory()) continue;
    for (const f of fs.readdirSync(lDir)) {
      if (!exts.has(path.extname(f).toLowerCase())) continue;
      const out = path.join(dest, device, locale, f);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.copyFileSync(path.join(lDir, f), out);
      console.log(`${device}/${locale}/${f}`);
      n++;
    }
  }
}
const manifest = path.join(src, 'manifest.json');
if (fs.existsSync(manifest)) fs.copyFileSync(manifest, path.join(dest, 'manifest.json'));
console.log(`\nImported ${n} file(s) into ${path.relative(process.cwd(), dest)}/`);
console.log('Next: edit SLOTS in src/config/screenshots.ts, then `pnpm run build`.');
