# MoneyWise website

Source for https://moneywise.airingdeng.com

## Stack

- **Framework:** Astro v6 static output
- **Styling:** Tailwind v4 (via `@tailwindcss/vite`) with `@theme` tokens
- **Type safety:** TypeScript strict
- **Content:** i18n JSON via Astro content collections + Zod schema
- **Analytics:** Umami (self-hosted at `analytics.ursb.me`)
- **Hosting:** GitHub Pages via Actions (`.github/workflows/deploy.yml`)

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

### Update copy
All user-facing strings live in `src/content/i18n/{en,zh,zh-Hant,ja}.json`. Zod schema at `src/content.config.ts` validates every locale at build time — a missing key fails the build.

## Deploy

Push to `main` → GitHub Actions builds and deploys (`.github/workflows/deploy.yml`).

## License

Content © 2026 Airing. Code MIT.
