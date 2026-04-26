---
title: Competitor Comparison Pages
status: draft
date: 2026-04-26
linear: SHU-429
---

# MoneyWise Competitor Comparison Pages — Design Spec

## 1. Goal

Add a system of "MoneyWise vs `<Competitor>`" pages to the marketing site for SEO traffic capture on high-intent comparison searches. The system must be **data-driven**: one Astro template + one JSON data file per competitor + shared i18n strings, so adding a new competitor is a content change, not a code change.

Reference page: <https://www.morgen.so/morgen-vs-akiflow>

## 2. Scope

### 2.1 Competitor list (21 total)

Slugs are stable, lowercase, ASCII, and used in URLs.

| Region | Competitor | Slug |
| --- | --- | --- |
| Western (en) | Mint | `mint` |
| Western (en) | YNAB | `ynab` |
| Western (en) | Copilot Money | `copilot-money` |
| Western (en) | Monarch Money | `monarch-money` |
| Western (en) | Rocket Money | `rocket-money` |
| Western (en) | Empower (Personal Capital) | `empower` |
| Western (en) | Spendee | `spendee` |
| Western (en) | PocketGuard | `pocketguard` |
| Chinese | 随手记 | `suishouji` |
| Chinese | 鲨鱼记账 | `shayu` |
| Chinese | 钱迹 | `qianji` |
| Chinese | MoneyKeeper | `moneykeeper` |
| Chinese | 一木记账 | `yimu` |
| Japanese | Zaim | `zaim` |
| Japanese | Money Forward ME | `money-forward-me` |
| Japanese | マネーツリー (Moneytree) | `moneytree` |
| Korean | 뱅크샐러드 (Banksalad) | `banksalad` |
| Korean | 편한가계부 | `pyeonhan` |
| iOS-ecosystem | Money Pro | `money-pro` |
| iOS-ecosystem | 1Money | `1money` |
| iOS-ecosystem | MoneyCoach | `moneycoach` |

### 2.2 Localization

Every comparison page is published in **all 5 locales** (`en`, `zh`, `zh-Hant`, `ja`, `ko`).

- Total page count: 21 competitors × 5 locales + 5 index pages = **110 pages**
- All pages are statically generated at build time
- `LocaleSwitcher` works without 404 because every slug exists in every locale (per project's existing pattern in `Nav.astro`)

### 2.3 Out of scope (this iteration)

- User rating cards (Product Hunt / Trustpilot etc.) — MoneyWise has no public rating yet
- Testimonial walls — no real user testimonials yet
- "Migrate from X" data importers — described in FAQ copy only, no implementation
- Competitor-specific OG images — use a single shared OG template (see §6.5)

## 3. URL & Routing

### 3.1 URL pattern

| Route | Default locale (en) | Other locales |
| --- | --- | --- |
| Single comparison page | `/moneywise-vs-<slug>/` | `/<locale>/moneywise-vs-<slug>/` |
| Comparison index | `/compare/` | `/<locale>/compare/` |

Examples: `/moneywise-vs-ynab/`, `/zh/moneywise-vs-suishouji/`, `/ja/compare/`.

This matches `pathFor(locale, slug)` in `src/lib/i18n.ts`. The slug passed to existing helpers (`SeoHead`, `Nav`, `Footer`) is `moneywise-vs-<slug>` or `compare`.

### 3.2 File layout

```
src/pages/
  moneywise-vs-[competitor].astro            # default-locale pages
  compare.astro                              # default-locale index
  zh/
    moneywise-vs-[competitor].astro
    compare.astro
  zh-Hant/
    moneywise-vs-[competitor].astro
    compare.astro
  ja/
    moneywise-vs-[competitor].astro
    compare.astro
  ko/
    moneywise-vs-[competitor].astro
    compare.astro
```

Each `[competitor].astro` is a 5-line wrapper that calls `getStaticPaths()` over the competitors collection and renders the shared `ComparePage.astro` view with `locale` + `competitor` props. The default-locale variants pass `locale="en"`.

### 3.3 Sitemap

`@astrojs/sitemap` is already integrated and discovers all generated pages automatically. No config change needed.

## 4. Data Model

### 4.1 Competitor data (Astro Content Collection)

Location: `src/content/competitors/<slug>.json` (one file per competitor).

Schema (Zod, to be added in `src/content.config.ts`):

```ts
const competitorSchema = z.object({
  slug: z.string(),                      // matches filename, validated
  displayName: z.string(),               // "YNAB"
  fullName: z.string().optional(),       // "You Need A Budget"
  logoPath: z.string(),                  // /competitors/ynab.svg under public/
  websiteUrl: z.string().url(),
  // Pricing (one row in the comparison table)
  // Numbers are USD-normalized for fair side-by-side comparison.
  // `notes` carries the original-currency string when relevant (e.g. "¥30/mo (≈ $4.20)").
  pricing: z.object({
    model: z.enum(['free', 'freemium', 'subscription', 'one-time', 'free-with-ads']),
    monthly: z.number().nullable(),
    annual: z.number().nullable(),
    notes: z.string().optional(),
  }),
  // Platforms (visual matrix row)
  platforms: z.object({
    ios: z.boolean(),
    android: z.boolean(),
    web: z.boolean(),
    macos: z.boolean(),
    windows: z.boolean(),
    linux: z.boolean(),
  }),
  // Feature checklist matrix — same fixed key order on every competitor
  features: z.object({
    multiCurrency: z.boolean(),
    offlineFirst: z.boolean(),
    localEncryption: z.boolean(),
    optionalCloudSync: z.boolean(),
    byokAi: z.boolean(),
    builtinAi: z.boolean(),              // "AI without needing your own key"
    investments: z.boolean(),
    budgets: z.boolean(),
    receiptPhotos: z.boolean(),
    voiceInput: z.boolean(),
    bankSync: z.boolean(),               // automatic bank import (we don't, many do)
    familySharing: z.boolean(),
    noAds: z.boolean(),
    noTrackers: z.boolean(),
    openSource: z.boolean(),
  }),
  // Free-form positioning summary (English only — translated in i18n layer)
  positioningKey: z.string(),            // key into i18n compare.competitors.<slug>.* — see §4.2
  // Audit metadata
  sources: z.array(z.object({
    label: z.string(),                   // "Official pricing page"
    url: z.string().url(),
  })),
  lastVerified: z.string(),              // ISO date; flag if older than 90 days
  verificationConfidence: z.enum(['high', 'medium', 'low']),
});
```

**Validation rules** (enforced by Zod):

- Filename must match `slug` field
- `pricing.monthly` and `pricing.annual` must be `null` when `pricing.model === 'free'`
- `lastVerified` must be a valid ISO date

### 4.2 Per-competitor i18n strings

Per-locale, per-competitor copy that cannot be derived from the boolean matrix lives in `src/content/i18n/compare/<locale>.json`:

```json
{
  "common": {
    "title_template": "MoneyWise vs {competitor} — Local-first finance vs {competitor}",
    "description_template": "Compare MoneyWise and {competitor}. Side-by-side pricing, platforms, AI, privacy, and which one fits you.",
    "hero_subtitle_template": "Two ways to track your money. {competitor} is {competitor_one_liner}. MoneyWise is local-first, multi-currency, and brings your own AI key.",
    "section_titles": {
      "comparison_table": "At a glance",
      "moneywise_advantages": "Where MoneyWise is different",
      "ai_deep_dive": "AI without sending your data anywhere",
      "privacy": "Your data stays on your phone",
      "when_to_choose": "Which one is right for you?",
      "pricing": "Pricing",
      "faq": "Frequently asked questions"
    },
    "feature_labels": {
      "multiCurrency": "Multi-currency",
      "offlineFirst": "Offline-first",
      "localEncryption": "Local encryption",
      "...": "..."
    },
    "platform_labels": { "ios": "iOS", "android": "Android", "...": "..." },
    "table_yes": "✓",
    "table_no": "—",
    "cta_primary": "Try MoneyWise",
    "cta_secondary": "See full features",
    "back_to_compare_index": "All comparisons",
    "compare_index": {
      "title": "MoneyWise alternatives, side-by-side",
      "subtitle": "21 finance apps compared. Pick the one that fits your money.",
      "regions": {
        "western": "Global / English",
        "chinese": "中文记账",
        "japanese": "日本",
        "korean": "한국",
        "ios_focused": "iOS-focused"
      }
    }
  },
  "competitors": {
    "ynab": {
      "one_liner": "a strict zero-based-budgeting system",
      "when_choose_competitor": "If you've already adopted YNAB's zero-based-budgeting method and your finances are mostly in one currency, YNAB's budget engine is more opinionated and mature.",
      "when_choose_moneywise": "If you handle multiple currencies, want your data to stay on your device, or want AI insights without subscribing to another vendor, MoneyWise fits better.",
      "faq": [
        { "q": "Can I import my YNAB data?", "a": "Today, no auto-importer. You can re-create accounts and start fresh; YNAB users find onboarding fast because they already think in categories." },
        { "q": "Does MoneyWise do zero-based budgeting?", "a": "MoneyWise has monthly category budgets, not the strict YNAB rule-set." }
      ]
    },
    ...
  }
}
```

**Schema** (Zod): all `competitors.<slug>` keys must match the slugs in the `competitors` collection — enforced by a `refine` step that pulls slugs at validation time. A missing or misnamed key fails the build.

### 4.3 Why split between `competitors/*.json` and `i18n/compare/*.json`

- **Boolean matrix and pricing are universal facts**: shared across all locales, no translation.
- **Positioning copy is locale-specific**: a Japanese reader needs Japanese copy.
- This keeps the data layer's translation surface small and prevents drift (a feature flag flipping in one locale but not another).

## 5. Page Structure

Each comparison page renders these sections in order. Sections are individual `.astro` components under `src/components/compare/` so they can be unit-rendered or rearranged.

### 5.1 Section list

| # | Component | Purpose | Reuses existing? |
| --- | --- | --- | --- |
| 1 | `Nav` | Site nav with locale switcher | ✓ existing |
| 2 | `CompareHero` | "MoneyWise vs `<Competitor>`" with both logos and a one-line positioning | new |
| 3 | `CompareTable` | At-a-glance: pricing row, platform matrix, full feature matrix | new |
| 4 | `CompareAdvantages` | 4 image+text blocks for Local-first / BYOK AI / Multi-currency / Privacy. **Same content on every competitor page**, but localized — copy comes from `compare.common.advantages.*` in the locale's i18n file. Uses existing `FeatureGrid`-style layout. | new (mostly markup) |
| 5 | `CompareAiDeepDive` | BYOK AI explanation. **Same content on every competitor page**, but localized — copy comes from `compare.common.ai_deep_dive.*`. | new |
| 6 | `PrivacyFirst` | Privacy pillars | ✓ existing |
| 7 | `CompareWhenToChoose` | Two-column "When to choose `<Competitor>`" / "When to choose MoneyWise" — soft-honest, 2–3 sentences each, copy from i18n `competitors.<slug>.when_choose_*` | new |
| 8 | `Pricing` | MoneyWise pricing | ✓ existing |
| 9 | `DownloadCta` | App Store CTA | ✓ existing |
| 10 | `CompareFaq` | 6-question accordion, copy from i18n `competitors.<slug>.faq` | new |
| 11 | `Footer` | Site footer | ✓ existing |

### 5.2 Honesty calibration

Section 7 ("When to choose") is the one place we acknowledge competitor strengths. **Soft honesty**: state what the competitor is good at without disparaging or hedging into uselessness. Example template (English):

> **Choose YNAB if:** you've already adopted zero-based budgeting and your finances are in one currency. YNAB's budget engine is more opinionated.
>
> **Choose MoneyWise if:** you handle multiple currencies, you want your data on your device, or you want AI insights without paying another subscription.

The `when_choose_competitor` and `when_choose_moneywise` strings live per locale per competitor.

### 5.3 Comparison table layout

Three sub-tables, each with two columns ("MoneyWise" | "<Competitor>"):

1. **Pricing row** — model badge + monthly/annual price + notes
2. **Platform matrix** — 6 rows (iOS / Android / Web / macOS / Windows / Linux) with ✓ or — per cell
3. **Features matrix** — 15 rows (one per `features.*` boolean) with ✓ or — per cell

Static feature label copy comes from `compare.common.feature_labels` (per locale). Cell values come from `competitors/<slug>.json`.

MoneyWise's own row is sourced from a single canonical record at `src/content/competitors/_self.json` (slug `_self`, hidden from the index, used as the left column on every comparison page).

### 5.4 Compare index page (`/compare/`)

- H1 + subtitle (from `compare.common.compare_index`)
- Grouped grid of competitor cards by region (Western / Chinese / Japanese / Korean / iOS-focused)
- Each card: competitor logo, name, one-liner, "Compare →" link
- Cards link to the locale-prefixed comparison page

This page exists in all 5 locales for consistency.

## 6. SEO

### 6.1 `<title>` and `<meta description>`

Driven by `compare.common.title_template` / `description_template` with `{competitor}` interpolation. Examples (en):

- Title: `MoneyWise vs YNAB — Local-first finance vs YNAB`
- Description: `Compare MoneyWise and YNAB. Side-by-side pricing, platforms, AI, privacy, and which one fits you.`

### 6.2 Canonical and `hreflang`

Existing `SeoHead` already emits canonical + `hreflang` for every locale via `alternateLinks(slug)`. Comparison pages pass `slug = 'moneywise-vs-<competitor>'`. No changes needed to `SeoHead`.

### 6.3 Structured data (JSON-LD)

Add a `SoftwareApplication` JSON-LD block in `CompareHero`'s `<script type="application/ld+json">` referencing both products + a `ComparisonReview`-style description. Pulled from competitor JSON.

This is a small win for SERP rich results. If implementation slips, it's a deferrable enhancement — not a blocker.

### 6.4 Internal linking

- Footer gets a "Compare alternatives" link pointing to `/compare/`
- Compare index page has a card grid linking to every comparison page (massive PageRank concentration)
- Each comparison page links back to `/compare/` and to other comparison pages in the same region (3 most-related, in a "See also" strip below the FAQ)

### 6.5 Open Graph image

For v1, all comparison pages use a single shared `/og-compare.png`. Per-competitor OG images are out of scope this iteration (would require ~21 designed images; revisit if SEO data shows comparison pages need shareable cards).

## 7. Data Sourcing & Audit

### 7.1 Process

1. For each competitor, I research: official pricing page, App Store listing, Wikipedia (if applicable), the product's docs/help center
2. Fill `src/content/competitors/<slug>.json` with `verificationConfidence: 'high' | 'medium' | 'low'`
3. List sources under `sources: []` so any claim can be traced back
4. Set `lastVerified: '2026-04-26'` (or the actual date)

### 7.2 Confidence flags

- `high`: prices and feature flags directly from competitor's own pricing/marketing page in 2026
- `medium`: derived from secondary sources (review sites, App Store listing) — flag for Airing review
- `low`: educated guess (e.g. inferring "no offline mode" from absence of advertising it) — flag for Airing review

Build script prints a summary: `X competitors with confidence=low or medium — review before publishing.`

### 7.3 Staleness check

A small build-time check in `astro.config.mjs` (or a pre-build script) warns if any competitor's `lastVerified` is older than 90 days. Not a build failure — a warning.

## 8. Implementation Order

The plan will sequence as:

1. **Schema + content collection** — define `competitorSchema`, register collection, write `_self.json`, update content config
2. **i18n schema extension** — extend `i18nSchema` (or create separate `compareI18nSchema`) for `compare/<locale>.json`; add stub English file
3. **Shared compare view** — `src/views/ComparePage.astro` taking `locale` + `competitor` slug
4. **Section components** — `CompareHero`, `CompareTable`, `CompareAdvantages`, `CompareAiDeepDive`, `CompareWhenToChoose`, `CompareFaq`
5. **Page wrappers** — `[competitor].astro` × 5 locales using `getStaticPaths`
6. **Index page** — `compare.astro` × 5 locales
7. **Footer link** — add "Compare alternatives" entry
8. **MVP competitor (YNAB)** — fully populate `ynab.json` + 5 locale strings; manual review by Airing
9. **Batch fill remaining 20 competitors** — research + JSON files + i18n strings
10. **Translation pass** — ensure all 5 locales have copy for all 21 competitors

Steps 1–8 are the thin slice; review gate after step 8 before scaling to 9+.

## 9. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Wrong competitor pricing/feature info → credibility damage | `sources[]` field + `verificationConfidence` flag + Airing review gate before publishing each competitor |
| Translation drift (a feature flips in one locale, not others) | Boolean matrix lives in language-agnostic competitor JSON, never in i18n files |
| Schema change breaks all competitor files | Adding a feature flag is a default-`false` field with migration script; removing or renaming requires a sweep across all JSON files (unavoidable) |
| Competitor sues for trademark or comparison claims | Soft-honest tone; cite sources; "MoneyWise" does not appear in competitor logos; no "Akiflow"-style direct attacks |
| Pages duplicate-content-flagged by Google | Each page has unique `<title>`, unique competitor section text (positioning, when-to-choose, FAQ); ~70%+ unique copy per page |
| 100+ pages bloat sitemap | Already automatically handled by `@astrojs/sitemap` |
| Slug collision (e.g. `1money`) | Validation: slug must match `[a-z0-9][a-z0-9-]*`; `1money` is allowed |

## 10. Acceptance Criteria

- [ ] `pnpm run build` passes with all 21 competitor JSON files + 5 locales
- [ ] Visiting `/moneywise-vs-ynab/` renders correctly with full content in English
- [ ] Visiting `/zh/moneywise-vs-ynab/` shows the page in Simplified Chinese
- [ ] Locale switcher on a comparison page navigates to the same competitor in the target locale (no 404)
- [ ] `/compare/` lists all 21 competitors grouped by region
- [ ] Sitemap includes all 110 pages (21×5 + 5 index)
- [ ] All 5 `hreflang` alternates emitted on every comparison page
- [ ] Lighthouse SEO score ≥ 95 on the YNAB page
- [ ] Adding a 22nd competitor requires: 1 JSON file + 5 i18n entries + 0 code changes
