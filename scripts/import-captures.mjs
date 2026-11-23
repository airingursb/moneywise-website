#!/usr/bin/env node
/**
 * Import app screen captures into src/assets/screens/captures/ as optimized WebP.
 *
 *   node scripts/import-captures.mjs <captures-dir> [--skip <device/locale/screen>]...
 *
 * Expects <captures-dir>/<device>/<locale>/<screen>.(png|jpg|webp), e.g.
 *   site-captures/iphone/en/home.png
 *   site-captures/iphone-dark/zh/home.png
 *   site-captures/duo/en/records-split.png
 *   site-captures/watch/en/home.png
 * and writes src/assets/screens/captures/<device>/<locale>/<screen>.webp.
 *
 * Raw captures are huge (an iPhone PNG is ~1 MB at 1320×2868), so each file is
 * downscaled to a source width that still covers 2× the largest size the site
 * renders it at, then stored as WebP. Astro generates the responsive variants
 * from these at build time.
 *
 * Use --skip for captures that must not ship, e.g. `--skip duo/zh/invest-split`.
 * After importing, point the slots in src/config/screenshots.ts at
 * `captures/<device>/{locale}/<screen>.webp` and run `pnpm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const src = args[0];
const skip = new Set();
for (let i = 1; i < args.length; i++) if (args[i] === '--skip' && args[i + 1]) skip.add(args[++i]);
if (!src || !fs.existsSync(src)) {
  console.error('usage: node scripts/import-captures.mjs <captures-dir> [--skip device/locale/screen]');
  process.exit(1);
}

// Max source width per device family (≈ 2× the largest rendered width).
const MAX_W = { iphone: 900, duo: 2000, watch: 416 };
const family = (device) => device.replace(/-dark$/, '');

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
      const ext = path.extname(f).toLowerCase();
      if (!exts.has(ext)) continue;
      const screen = path.basename(f, ext);
      if (skip.has(`${device}/${locale}/${screen}`)) {
        console.log(`skip ${device}/${locale}/${f}`);
        continue;
      }
      const out = path.join(dest, device, locale, `${screen}.webp`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const maxW = MAX_W[family(device)] ?? 1600;
      await sharp(path.join(lDir, f))
        .resize({ width: maxW, withoutEnlargement: true })
        .webp({ quality: 88, effort: 5 })
        .toFile(out);
      console.log(`${device}/${locale}/${screen}.webp`);
      n++;
    }
  }
}
const manifest = path.join(src, 'manifest.json');
if (fs.existsSync(manifest)) fs.copyFileSync(manifest, path.join(dest, 'manifest.json'));
console.log(`\nImported ${n} file(s) into ${path.relative(process.cwd(), dest)}/`);
console.log('Next: edit SLOTS in src/config/screenshots.ts, then `pnpm run build`.');
