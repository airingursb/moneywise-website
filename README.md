# MoneyWise website

Source for https://moneywise.ursb.me

## Stack

- **Framework:** Astro v6 static output
- **Styling:** Tailwind v4 (via `@tailwindcss/vite`) with `@theme` tokens
- **Type safety:** TypeScript strict
- **Content:** i18n JSON via Astro content collections + Zod schema
- **Analytics:** Umami (self-hosted at `analytics.ursb.me`)
- **Hosting:** Vercel (moneywise.ursb.me) + GitHub Pages via Actions for the legacy domain (`.github/workflows/deploy.yml`)

## Local development

```bash
pnpm install
pnpm run dev          # http://localhost:4321
pnpm run build        # static output to dist/
```

## Common edits

### Update after App Store approval
Flip `appStoreAvailable: true` in `src/config/site.ts`. All CTA buttons will switch from "Coming soon" badges to live App Store links.

### Update Pro pricing
Edit `PRICING.pro.priceMonthly` / `priceAnnual` in `src/config/site.ts`. The Pricing card auto-formats via `Intl.NumberFormat`.

### Add a new locale
1. Add the code to `LOCALES` in `src/config/site.ts` and add a label to `LOCALE_LABELS`
2. Add the code to `astro.config.mjs` under `i18n.locales`
3. Drop a translated JSON into `src/content/i18n/<code>.json` (use `en.json` as the template)
4. Translate `src/content/legal/privacy-<code>.md` and `terms-<code>.md`
5. Create page wrappers under `src/pages/<code>/{index,features,privacy,terms}.astro`

### Product screenshots
Every product image goes through **`src/config/screenshots.ts`** (slot id → image path per locale, with device type).
Device frames (iPhone, foldable, Apple Watch, Mac) are drawn in CSS (`src/components/device/`), and images are
optimized by Astro at build time. To swap in new captures:

```bash
node scripts/import-captures.mjs /path/to/site-captures   # → src/assets/screens/captures/<device>/<locale>/
# then edit SLOTS in src/config/screenshots.ts to point at captures/<device>/{locale}/<screen>.png
pnpm run build                                              # a missing file fails the build with the slot id
```

### Design tokens
Colors, type scale and components live in `src/styles/global.css` (CSS variables on `:root`, flipped under
`prefers-color-scheme: dark`, exposed to Tailwind via `@theme inline` — e.g. `bg-bg`, `text-fg-2`, `border-line`).

### FAQ / Help
Copy lives in `src/content/faq/<locale>.json` (validated by the `faq` schema in `src/content.config.ts`).
Answers may contain inline HTML; `{privacy}`, `{account_deletion}` and `{email}` are filled in at build time.

### Update copy
All user-facing strings live in `src/content/i18n/{en,zh,zh-Hant,ja}.json`. Zod schema at `src/content.config.ts` validates every locale at build time — a missing key fails the build.

## Deploy

Push to `main` → GitHub Actions builds and deploys (`.github/workflows/deploy.yml`).

## License

Content © 2026 Airing. Code MIT.
