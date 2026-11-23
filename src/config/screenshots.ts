/**
 * ONE place that decides which product image appears where on the site.
 * ---------------------------------------------------------------------
 * Every product image on every page is referenced by a *slot id* (e.g.
 * `hero.iphone`) and resolved through this file. To swap in new captures you
 * only edit this file (plus drop the image files under `src/assets/screens/`).
 *
 * How paths work
 *   - Paths are relative to `src/assets/screens/`.
 *   - `{locale}` is replaced with the page locale (en, zh, zh-Hant, ja, ko).
 *   - If the file for a locale doesn't exist, we fall back along
 *     LOCALE_FALLBACK (zh-Hant → zh → en, ja → en, ko → en). So shipping only
 *     `en` + `zh` captures is fine.
 *   - `dark` (optional) is shown when the visitor's OS is in dark mode
 *     (rendered as a <picture> with a prefers-color-scheme source).
 *   - Images are optimized at build time by Astro (webp, responsive widths),
 *     and the device frame adopts each image's own aspect ratio, so new
 *     captures with a different resolution need no CSS changes.
 *
 * Swapping in the new captures (site-captures/{iphone,iphone-dark,duo,watch}/{en,zh}/<screen>.png)
 *   1. `node scripts/import-captures.mjs <path-to>/site-captures`
 *      → copies them to src/assets/screens/captures/<device>/<locale>/<screen>.png
 *   2. In SLOTS below, point each slot at `captures/<device>/{locale}/<screen>.png`
 *      (and `dark` at `captures/iphone-dark/{locale}/<screen>.png`).
 *   3. `pnpm run build`. A missing file fails the build with the slot id in the
 *      error message, so typos can't ship silently.
 *
 * Current state: placeholders. `placeholder/iphone/*` are crops of the old App
 * Store marketing images, `placeholder/duo/*` are two of those crops side by
 * side, and `placeholder/watch/*` are hand-drawn mock screens (NOT real app UI).
 */
import type { Locale } from './site';

export type Device = 'iphone' | 'duo' | 'watch' | 'mac';

export interface ScreenSlot {
  device: Device;
  /** Path template under src/assets/screens/, may contain `{locale}`. */
  src: string;
  /** Optional dark-mode variant (same rules as `src`). */
  dark?: string;
}

export const LOCALE_FALLBACK: Record<Locale, Locale[]> = {
  en: ['en'],
  zh: ['zh', 'en'],
  'zh-Hant': ['zh-Hant', 'zh', 'en'],
  ja: ['ja', 'en'],
  ko: ['ko', 'en'],
};

const P = 'placeholder/iphone/{locale}';

export const SLOTS = {
  // ── Home: hero stage ────────────────────────────────────────────────
  'hero.iphone':        { device: 'iphone', src: `${P}/dashboard.webp` },
  'hero.iphone-back':   { device: 'iphone', src: `${P}/investments.webp` },
  'hero.watch':         { device: 'watch',  src: 'placeholder/watch/{locale}/summary.webp' },

  // ── Home: "New in 1.8" cards ────────────────────────────────────────
  'new.goals':          { device: 'iphone', src: `${P}/budget.webp` },
  'new.dark':           { device: 'iphone', src: `${P}/dashboard.webp` },
  'new.share':          { device: 'iphone', src: `${P}/records.webp` },
  'new.widgets':        { device: 'iphone', src: `${P}/daily-brief.webp` },

  // ── Home: foldable "Duo" two-pane + Apple Watch sections ───────────
  'duo.main':           { device: 'duo',    src: 'placeholder/duo/{locale}/home.webp' },
  'watch.primary':      { device: 'watch',  src: 'placeholder/watch/{locale}/summary.webp' },
  'watch.secondary':    { device: 'watch',  src: 'placeholder/watch/{locale}/today.webp' },

  // ── Home: iPhone gallery (order = t.screenshots.captions order) ────
  'gallery.1':          { device: 'iphone', src: `${P}/dashboard.webp` },
  'gallery.2':          { device: 'iphone', src: `${P}/records.webp` },
  'gallery.3':          { device: 'iphone', src: `${P}/daily-brief.webp` },
  'gallery.4':          { device: 'iphone', src: `${P}/budget.webp` },
  'gallery.5':          { device: 'iphone', src: `${P}/investments.webp` },
  'gallery.6':          { device: 'iphone', src: `${P}/security.webp` },
  'gallery.7':          { device: 'iphone', src: `${P}/advisor.webp` },
  'gallery.8':          { device: 'iphone', src: `${P}/family.webp` },
  'gallery.9':          { device: 'iphone', src: `${P}/asset-report.webp` },

  // ── Home: Mac section (already-chromed macOS window captures) ──────
  'mac.1':              { device: 'mac',    src: 'legacy/mac/{locale}/01-dashboard.png' },
  'mac.2':              { device: 'mac',    src: 'legacy/mac/{locale}/02-records.png' },
  'mac.3':              { device: 'mac',    src: 'legacy/mac/{locale}/05-investments.png' },
  'mac.4':              { device: 'mac',    src: 'legacy/mac/{locale}/07-advisor.png' },
  'mac.5':              { device: 'mac',    src: 'legacy/mac/{locale}/09-asset-report.png' },

  // ── /features modules (keyed by module id in i18n featuresPage) ─────
  'features.dashboard':   { device: 'iphone', src: `${P}/dashboard.webp` },
  'features.records':     { device: 'iphone', src: `${P}/records.webp` },
  'features.budgets':     { device: 'iphone', src: `${P}/budget.webp` },
  'features.investments': { device: 'iphone', src: `${P}/investments.webp` },
  'features.advisor':     { device: 'iphone', src: `${P}/advisor.webp` },
  'features.security':    { device: 'iphone', src: `${P}/security.webp` },
  'features.family':      { device: 'iphone', src: `${P}/family.webp` },

  // ── Compare pages hero ─────────────────────────────────────────────
  'compare.iphone':     { device: 'iphone', src: `${P}/dashboard.webp` },
} satisfies Record<string, ScreenSlot>;

export type SlotId = keyof typeof SLOTS;
