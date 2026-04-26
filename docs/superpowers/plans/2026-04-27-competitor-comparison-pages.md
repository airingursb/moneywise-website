# Competitor Comparison Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add data-driven `MoneyWise vs <Competitor>` pages for 21 competitors × 5 locales (≈110 pages), batch-generated from one Astro template + per-competitor JSON + shared i18n copy.

**Architecture:** Two new Astro Content Collections — `competitors` (locale-agnostic facts) and `compare-i18n` (per-locale UI strings + per-competitor positioning). One shared view (`ComparePage.astro`) rendered by 5 thin page wrappers using `getStaticPaths()` over the competitors collection. Default locale at root (`/moneywise-vs-<slug>/`), other locales prefixed (`/<locale>/moneywise-vs-<slug>/`). Plus a `/compare/` index page in each locale.

**Tech Stack:** Astro v6, Tailwind v4, TypeScript strict, Zod schema validation, `@astrojs/sitemap`. Verification: `pnpm run build` + manual browser check (no test framework in this project).

**Spec:** `docs/superpowers/specs/2026-04-26-competitor-comparison-pages-design.md` (Linear: SHU-429)

---

## File Structure

**Created:**
```
src/content/competitors/
  _self.json                         # MoneyWise canonical row
  ynab.json                          # MVP competitor
  mint.json, copilot-money.json, ... # remaining 19 (Phase K)
src/content/i18n/compare/
  en.json zh.json zh-Hant.json ja.json ko.json
src/components/compare/
  CompareHero.astro
  CompareTable.astro
  CompareAdvantages.astro
  CompareAiDeepDive.astro
  CompareWhenToChoose.astro
  CompareFaq.astro
  CompareSeeAlso.astro               # 3 related-competitor links below FAQ
  CompareIndexCard.astro
  CompetitorBadge.astro              # text-based logo placeholder
src/lib/
  compare.ts                         # competitor + i18n helpers
src/views/
  ComparePage.astro
  CompareIndex.astro
src/pages/moneywise-vs-[competitor].astro
src/pages/compare.astro
src/pages/zh/moneywise-vs-[competitor].astro
src/pages/zh/compare.astro
src/pages/zh-Hant/moneywise-vs-[competitor].astro
src/pages/zh-Hant/compare.astro
src/pages/ja/moneywise-vs-[competitor].astro
src/pages/ja/compare.astro
src/pages/ko/moneywise-vs-[competitor].astro
src/pages/ko/compare.astro
scripts/
  check-competitor-freshness.mjs     # warns on stale lastVerified
```

OG image: comparison pages reuse the existing `/og-image.png` default in `SeoHead.astro` for v1 — no per-comparison OG image this iteration (deferred per spec §6.5).

**Modified:**
```
src/content.config.ts                # add competitor + compare-i18n schemas
src/components/Footer.astro          # add "Compare alternatives" link
src/content/i18n/{en,zh,zh-Hant,ja,ko}.json   # add footer.compare label
src/content.config.ts                # extend i18nSchema with footer.compare
```

---

## Phase A — Schema & Data Foundation

### Task 1: Add `competitors` collection schema

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Open `src/content.config.ts` and add the `competitor` schema and collection definition above the `export const collections` line.**

```ts
const competitorSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase-kebab-case only'),
  displayName: z.string(),
  fullName: z.string().optional(),
  websiteUrl: z.string().url(),
  hideFromIndex: z.boolean().default(false),
  region: z.enum(['western', 'chinese', 'japanese', 'korean', 'ios_focused', 'self']),
  pricing: z.object({
    model: z.enum(['free', 'freemium', 'subscription', 'one-time', 'free-with-ads']),
    monthly: z.number().nullable(),
    annual: z.number().nullable(),
    notes: z.string().optional(),
  }).refine(
    (p) => p.model !== 'free' || (p.monthly === null && p.annual === null),
    { message: 'Free apps must have null monthly and annual prices' },
  ),
  platforms: z.object({
    ios: z.boolean(),
    android: z.boolean(),
    web: z.boolean(),
    macos: z.boolean(),
    windows: z.boolean(),
    linux: z.boolean(),
  }),
  features: z.object({
    multiCurrency: z.boolean(),
    offlineFirst: z.boolean(),
    localEncryption: z.boolean(),
    optionalCloudSync: z.boolean(),
    byokAi: z.boolean(),
    builtinAi: z.boolean(),
    investments: z.boolean(),
    budgets: z.boolean(),
    receiptPhotos: z.boolean(),
    voiceInput: z.boolean(),
    bankSync: z.boolean(),
    familySharing: z.boolean(),
    noAds: z.boolean(),
    noTrackers: z.boolean(),
    openSource: z.boolean(),
  }),
  sources: z.array(z.object({
    label: z.string(),
    url: z.string().url(),
  })),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  verificationConfidence: z.enum(['high', 'medium', 'low']),
});

const competitors = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/competitors' }),
  schema: competitorSchema,
});

export type CompetitorData = z.infer<typeof competitorSchema>;
```

- [ ] **Step 2: Update the `export const collections` line to include `competitors`.**

```ts
export const collections = { i18n, competitors };
```

- [ ] **Step 3: Run `pnpm astro check` to confirm the file type-checks.**

Run: `pnpm astro check`
Expected: zero errors related to `content.config.ts` (existing errors unrelated to this change are acceptable; if any appear in this file, fix them).

- [ ] **Step 4: Run `pnpm run build` to confirm the build still passes.**

Run: `pnpm run build`
Expected: PASS — the empty `competitors/` directory loads zero entries cleanly.

- [ ] **Step 5: Commit.**

```bash
git add src/content.config.ts
git commit -m "feat(compare): add competitor content collection schema"
```

---

### Task 2: Add `compare-i18n` collection schema

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add the compare i18n schema and collection in `src/content.config.ts`.**

Add above the `export const collections` line, after the competitor schema:

```ts
const compareCommonSchema = z.object({
  meta: z.object({
    title_template: z.string(),         // "MoneyWise vs {competitor} — ..."
    description_template: z.string(),
  }),
  hero: z.object({
    subtitle_template: z.string(),      // "...{competitor_one_liner}..."
    cta_primary: z.string(),
    cta_secondary: z.string(),
    versus_label: z.string(),           // "vs"
  }),
  section_titles: z.object({
    comparison_table: z.string(),
    moneywise_advantages: z.string(),
    ai_deep_dive: z.string(),
    privacy: z.string(),
    when_to_choose: z.string(),
    pricing: z.string(),
    faq: z.string(),
    see_also: z.string(),
  }),
  table: z.object({
    pricing_label: z.string(),
    platforms_label: z.string(),
    features_label: z.string(),
    yes: z.string(),
    no: z.string(),
    free_label: z.string(),
    pricing_per_month: z.string(),
    pricing_per_year: z.string(),
  }),
  feature_labels: z.object({
    multiCurrency: z.string(),
    offlineFirst: z.string(),
    localEncryption: z.string(),
    optionalCloudSync: z.string(),
    byokAi: z.string(),
    builtinAi: z.string(),
    investments: z.string(),
    budgets: z.string(),
    receiptPhotos: z.string(),
    voiceInput: z.string(),
    bankSync: z.string(),
    familySharing: z.string(),
    noAds: z.string(),
    noTrackers: z.string(),
    openSource: z.string(),
  }),
  platform_labels: z.object({
    ios: z.string(),
    android: z.string(),
    web: z.string(),
    macos: z.string(),
    windows: z.string(),
    linux: z.string(),
  }),
  advantages: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).length(4),
  ai_deep_dive: z.object({
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    bullets: z.array(z.string()).length(3),
  }),
  when_to_choose: z.object({
    moneywise_heading: z.string(),         // "Choose MoneyWise if"
    competitor_heading_template: z.string(), // "Choose {competitor} if"
  }),
  back_to_index: z.string(),
  index: z.object({
    title: z.string(),
    subtitle: z.string(),
    region_labels: z.object({
      western: z.string(),
      chinese: z.string(),
      japanese: z.string(),
      korean: z.string(),
      ios_focused: z.string(),
    }),
    card_cta: z.string(),
  }),
});

const competitorCopySchema = z.object({
  one_liner: z.string(),                       // used in hero subtitle interpolation
  positioning: z.string(),                     // 1-2 sentence headline blurb under H1
  when_choose_competitor: z.string(),
  when_choose_moneywise: z.string(),
  faq: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).min(3).max(8),
});

const compareI18nSchema = z.object({
  common: compareCommonSchema,
  competitors: z.record(z.string(), competitorCopySchema),
});

const compareI18n = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/i18n/compare' }),
  schema: compareI18nSchema,
});

export type CompareI18nData = z.infer<typeof compareI18nSchema>;
export type CompetitorCopy = z.infer<typeof competitorCopySchema>;
```

- [ ] **Step 2: Update the `collections` export to include `compareI18n`.**

```ts
export const collections = { i18n, competitors, 'compare-i18n': compareI18n };
```

- [ ] **Step 3: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 4: Build.**

Run: `pnpm run build`
Expected: PASS (the empty `compare/` directory loads zero entries).

- [ ] **Step 5: Commit.**

```bash
git add src/content.config.ts
git commit -m "feat(compare): add compare-i18n content collection schema"
```

---

### Task 3: Write `_self.json` — MoneyWise canonical row

**Files:**
- Create: `src/content/competitors/_self.json`

- [ ] **Step 1: Write `src/content/competitors/_self.json`.**

```json
{
  "slug": "_self",
  "displayName": "MoneyWise",
  "fullName": "MoneyWise — Local-first finance",
  "websiteUrl": "https://moneywise.airingdeng.com",
  "hideFromIndex": true,
  "region": "self",
  "pricing": {
    "model": "freemium",
    "monthly": 6.99,
    "annual": 49.99,
    "notes": "Free for unlimited records on a single device. Pro adds sync, backup, pooled AI."
  },
  "platforms": {
    "ios": true,
    "android": false,
    "web": false,
    "macos": false,
    "windows": false,
    "linux": false
  },
  "features": {
    "multiCurrency": true,
    "offlineFirst": true,
    "localEncryption": true,
    "optionalCloudSync": true,
    "byokAi": true,
    "builtinAi": true,
    "investments": true,
    "budgets": true,
    "receiptPhotos": true,
    "voiceInput": true,
    "bankSync": false,
    "familySharing": true,
    "noAds": true,
    "noTrackers": true,
    "openSource": false
  },
  "sources": [
    { "label": "MoneyWise pricing", "url": "https://moneywise.airingdeng.com/#pricing" }
  ],
  "lastVerified": "2026-04-27",
  "verificationConfidence": "high"
}
```

- [ ] **Step 2: Validate by running `pnpm run build`.**

Run: `pnpm run build`
Expected: PASS. If schema rejects the file, fix the JSON to match.

- [ ] **Step 3: Commit.**

```bash
git add src/content/competitors/_self.json
git commit -m "feat(compare): add MoneyWise canonical competitor row"
```

---

## Phase B — i18n Base (English)

### Task 4: Write `compare/en.json` — `common` section

**Files:**
- Create: `src/content/i18n/compare/en.json`

- [ ] **Step 1: Write `src/content/i18n/compare/en.json` with the `common` block and an empty `competitors` map.**

```json
{
  "common": {
    "meta": {
      "title_template": "MoneyWise vs {competitor} — Local-first finance compared to {competitor}",
      "description_template": "Compare MoneyWise and {competitor}. Side-by-side pricing, platforms, AI, privacy, and which one fits your money."
    },
    "hero": {
      "subtitle_template": "Two ways to track your money. {competitor} is {one_liner}. MoneyWise is local-first, multi-currency, and brings your own AI key.",
      "cta_primary": "Try MoneyWise",
      "cta_secondary": "See full features",
      "versus_label": "vs"
    },
    "section_titles": {
      "comparison_table": "At a glance",
      "moneywise_advantages": "Where MoneyWise is different",
      "ai_deep_dive": "AI without sending your data anywhere",
      "privacy": "Your data stays on your phone",
      "when_to_choose": "Which one is right for you?",
      "pricing": "Pricing",
      "faq": "Frequently asked questions",
      "see_also": "See also"
    },
    "table": {
      "pricing_label": "Pricing",
      "platforms_label": "Platforms",
      "features_label": "Features",
      "yes": "✓",
      "no": "—",
      "free_label": "Free",
      "pricing_per_month": "/mo",
      "pricing_per_year": "/yr"
    },
    "feature_labels": {
      "multiCurrency": "Multi-currency",
      "offlineFirst": "Offline-first",
      "localEncryption": "Local encryption",
      "optionalCloudSync": "Optional cloud sync",
      "byokAi": "BYOK AI (your key)",
      "builtinAi": "Built-in AI (no key)",
      "investments": "Investments",
      "budgets": "Budgets",
      "receiptPhotos": "Receipt photos",
      "voiceInput": "Voice input",
      "bankSync": "Automatic bank sync",
      "familySharing": "Family sharing",
      "noAds": "No ads",
      "noTrackers": "No trackers",
      "openSource": "Open source"
    },
    "platform_labels": {
      "ios": "iOS",
      "android": "Android",
      "web": "Web",
      "macos": "macOS",
      "windows": "Windows",
      "linux": "Linux"
    },
    "advantages": [
      { "title": "Offline-first by design", "description": "Every record is in an encrypted SQLite database on your phone. Works in airplane mode." },
      { "title": "Bring your own AI key", "description": "Plug in your Anthropic or OpenAI key. Insights run with no extra subscription. Or use pooled credits in Pro." },
      { "title": "Multi-currency from day one", "description": "Hold accounts in any currency. Convert with daily rates. No 'home currency only' lock-in." },
      { "title": "No ads, no trackers", "description": "Nothing leaves your device unless you turn on optional encrypted sync. We literally cannot read your data." }
    ],
    "ai_deep_dive": {
      "eyebrow": "AI you control",
      "title": "An advisor that runs on your terms",
      "description": "Most finance apps either don't have AI, or send your transactions to a vendor's server. MoneyWise lets you choose: bring your own Anthropic or OpenAI key, or use Pro's pooled credits. Either way, the AI sees only what you ask it to see.",
      "bullets": [
        "Keys stored in iOS Keychain — never on our servers",
        "Daily Brief, monthly summaries, and ad-hoc Q&A",
        "Skip AI entirely — every other feature still works"
      ]
    },
    "when_to_choose": {
      "moneywise_heading": "Choose MoneyWise if",
      "competitor_heading_template": "Choose {competitor} if"
    },
    "back_to_index": "All comparisons",
    "index": {
      "title": "MoneyWise alternatives, side-by-side",
      "subtitle": "21 finance apps compared. Pick the one that fits your money.",
      "region_labels": {
        "western": "Global / English",
        "chinese": "中文记账",
        "japanese": "日本",
        "korean": "한국",
        "ios_focused": "iOS-focused"
      },
      "card_cta": "Compare →"
    }
  },
  "competitors": {}
}
```

- [ ] **Step 2: Build.**

Run: `pnpm run build`
Expected: PASS — the file loads via the `compare-i18n` collection.

- [ ] **Step 3: Commit.**

```bash
git add src/content/i18n/compare/en.json
git commit -m "feat(compare): add English compare i18n base copy"
```

---

### Task 5: Add YNAB entry to `compare/en.json`

**Files:**
- Modify: `src/content/i18n/compare/en.json`

- [ ] **Step 1: Replace the empty `"competitors": {}` block with a YNAB entry.**

```json
"competitors": {
  "ynab": {
    "one_liner": "a strict zero-based-budgeting system",
    "positioning": "YNAB and MoneyWise both help you understand where your money goes — but they're built for different people. YNAB enforces a budget method. MoneyWise tracks your real life.",
    "when_choose_competitor": "You've already adopted zero-based budgeting and want every dollar assigned a job. Your finances are mostly in one currency, and you're happy paying for a strong methodology coach.",
    "when_choose_moneywise": "You handle multiple currencies, you want your data on your device (not in a vendor's cloud), or you want AI insights without paying for yet another subscription.",
    "faq": [
      { "q": "Can I import my YNAB data into MoneyWise?", "a": "Today, no automatic importer. You can re-create accounts and start fresh. YNAB users tend to onboard quickly because they already think in categories." },
      { "q": "Does MoneyWise do zero-based budgeting?", "a": "MoneyWise has monthly category budgets with pacing, but not the strict YNAB rule-set. If the rule-set is what you love about YNAB, stay with YNAB." },
      { "q": "Will MoneyWise work without internet?", "a": "Yes. Every record is on your phone in an encrypted database. The app is fully usable in airplane mode." },
      { "q": "How is MoneyWise's pricing different from YNAB's?", "a": "MoneyWise is free for unlimited records on one device. Pro adds multi-device sync, backup, and pooled AI for $6.99/mo or $49.99/yr. YNAB is subscription-only at $14.99/mo or $109/yr." },
      { "q": "Does MoneyWise have AI like the new YNAB features?", "a": "Yes — MoneyWise has an AI advisor. The difference: you can plug in your own Anthropic or OpenAI key, so your data isn't sent to a vendor's pipeline." },
      { "q": "Can I use MoneyWise alongside YNAB?", "a": "Yes — many people start with MoneyWise for quick mobile entry and keep YNAB for the budget method. There's no lock-in either way." }
    ]
  }
}
```

- [ ] **Step 2: Build.**

Run: `pnpm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/content/i18n/compare/en.json
git commit -m "feat(compare): add YNAB English copy"
```

---

## Phase C — YNAB Competitor Data

### Task 6: Write `ynab.json`

**Files:**
- Create: `src/content/competitors/ynab.json`

- [ ] **Step 1: Research YNAB pricing and features at https://www.ynab.com/pricing and confirm the 2026 numbers. Then write `src/content/competitors/ynab.json`.**

```json
{
  "slug": "ynab",
  "displayName": "YNAB",
  "fullName": "You Need A Budget",
  "websiteUrl": "https://www.ynab.com",
  "hideFromIndex": false,
  "region": "western",
  "pricing": {
    "model": "subscription",
    "monthly": 14.99,
    "annual": 109.0,
    "notes": "34-day free trial. No free tier."
  },
  "platforms": {
    "ios": true,
    "android": true,
    "web": true,
    "macos": false,
    "windows": false,
    "linux": false
  },
  "features": {
    "multiCurrency": false,
    "offlineFirst": false,
    "localEncryption": false,
    "optionalCloudSync": true,
    "byokAi": false,
    "builtinAi": false,
    "investments": false,
    "budgets": true,
    "receiptPhotos": false,
    "voiceInput": false,
    "bankSync": true,
    "familySharing": true,
    "noAds": true,
    "noTrackers": false,
    "openSource": false
  },
  "sources": [
    { "label": "YNAB pricing", "url": "https://www.ynab.com/pricing" },
    { "label": "YNAB features", "url": "https://www.ynab.com/features" }
  ],
  "lastVerified": "2026-04-27",
  "verificationConfidence": "high"
}
```

- [ ] **Step 2: Build to verify schema acceptance.**

Run: `pnpm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/content/competitors/ynab.json
git commit -m "feat(compare): add YNAB competitor data"
```

---

## Phase D — Helpers

### Task 7: Create `src/lib/compare.ts` helpers

**Files:**
- Create: `src/lib/compare.ts`

- [ ] **Step 1: Write `src/lib/compare.ts`.**

```ts
import { getCollection, getEntry } from 'astro:content';
import type { Locale } from '../config/site';
import type { CompetitorData, CompareI18nData, CompetitorCopy } from '../content.config';

export async function getCompetitor(slug: string): Promise<CompetitorData> {
  const entry = await getEntry('competitors', slug);
  if (!entry) throw new Error(`competitor not found: ${slug}`);
  return entry.data;
}

export async function getSelf(): Promise<CompetitorData> {
  return getCompetitor('_self');
}

export async function getAllCompetitors(): Promise<CompetitorData[]> {
  const all = await getCollection('competitors');
  return all
    .map((e) => e.data)
    .filter((c) => !c.hideFromIndex)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getCompareI18n(locale: Locale): Promise<CompareI18nData> {
  const entry = await getEntry('compare-i18n', locale.toLowerCase());
  if (!entry) throw new Error(`compare-i18n missing for locale: ${locale}`);
  return entry.data;
}

export function getCompetitorCopy(c: CompareI18nData, slug: string): CompetitorCopy {
  const copy = c.competitors[slug];
  if (!copy) {
    throw new Error(`compare-i18n is missing competitors.${slug} entry — add it to all 5 locales`);
  }
  return copy;
}

export function compareSlug(competitorSlug: string): string {
  return `moneywise-vs-${competitorSlug}`;
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/compare.ts
git commit -m "feat(compare): add competitor data helpers"
```

---

## Phase E — Section Components

### Task 8: `CompetitorBadge.astro` (text-based logo placeholder)

**Files:**
- Create: `src/components/compare/CompetitorBadge.astro`

- [ ] **Step 1: Create the file.**

Avoiding trademark issues from real logo SVGs in v1, render a styled text badge:

```astro
---
interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'self' | 'competitor';
}
const { name, size = 'md', variant = 'competitor' } = Astro.props;
const sizeClass = size === 'lg' ? 'text-[28px] px-5 py-3' : size === 'sm' ? 'text-[14px] px-3 py-1.5' : 'text-[20px] px-4 py-2';
const variantClass = variant === 'self'
  ? 'bg-[var(--color-accent-primary)] text-white'
  : 'bg-[var(--color-surface-secondary)] text-[var(--color-fg-primary)] border border-[var(--color-border)]';
---
<span class={`inline-flex items-center rounded-xl font-bold tracking-tight ${sizeClass} ${variantClass}`}>
  {name}
</span>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompetitorBadge.astro
git commit -m "feat(compare): add CompetitorBadge component"
```

---

### Task 9: `CompareHero.astro`

**Files:**
- Create: `src/components/compare/CompareHero.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { CompetitorData, CompareI18nData, CompetitorCopy } from '../../content.config';
import CompetitorBadge from './CompetitorBadge.astro';
import { interpolate } from '../../lib/compare';

interface Props {
  self: CompetitorData;
  competitor: CompetitorData;
  c: CompareI18nData;
  copy: CompetitorCopy;
}
const { self, competitor, c, copy } = Astro.props;
const subtitle = interpolate(c.common.hero.subtitle_template, {
  competitor: competitor.displayName,
  one_liner: copy.one_liner,
});
---
<section class="mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-24 md:pb-16">
  <div class="flex items-center justify-center gap-4 md:gap-6">
    <CompetitorBadge name={self.displayName} size="lg" variant="self" />
    <span class="text-[18px] md:text-[22px] font-semibold text-[var(--color-fg-secondary)]">
      {c.common.hero.versus_label}
    </span>
    <CompetitorBadge name={competitor.displayName} size="lg" />
  </div>
  <h1 class="mt-10 max-w-3xl mx-auto text-center font-[family-name:var(--font-display)] font-bold text-[40px] md:text-[60px] leading-[1.02] tracking-[-0.035em] text-[var(--color-fg-primary)]">
    {self.displayName} <em class="font-[family-name:var(--font-serif-italic)] not-italic [font-style:italic] font-medium text-[var(--color-accent-primary)]">{c.common.hero.versus_label}</em> {competitor.displayName}
  </h1>
  <p class="mt-6 max-w-2xl mx-auto text-center text-[17px] leading-[1.6] text-[var(--color-fg-secondary)]">
    {copy.positioning}
  </p>
  <p class="mt-3 max-w-2xl mx-auto text-center text-[14px] leading-[1.55] text-[var(--color-fg-secondary)]/80">
    {subtitle}
  </p>
</section>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompareHero.astro
git commit -m "feat(compare): add CompareHero component"
```

---

### Task 10: `CompareTable.astro`

**Files:**
- Create: `src/components/compare/CompareTable.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { CompetitorData, CompareI18nData } from '../../content.config';

interface Props {
  self: CompetitorData;
  competitor: CompetitorData;
  c: CompareI18nData;
}
const { self, competitor, c } = Astro.props;

const fmt = (n: number | null) =>
  n === null ? c.common.table.free_label : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const pricingCell = (p: CompetitorData['pricing']) => {
  if (p.model === 'free') return c.common.table.free_label;
  if (p.monthly === null && p.annual === null) return p.notes ?? '—';
  const parts: string[] = [];
  if (p.monthly !== null) parts.push(`${fmt(p.monthly)}${c.common.table.pricing_per_month}`);
  if (p.annual !== null) parts.push(`${fmt(p.annual)}${c.common.table.pricing_per_year}`);
  return parts.join(' · ');
};

const platformKeys = ['ios', 'android', 'web', 'macos', 'windows', 'linux'] as const;
const featureKeys = [
  'multiCurrency', 'offlineFirst', 'localEncryption', 'optionalCloudSync',
  'byokAi', 'builtinAi', 'investments', 'budgets',
  'receiptPhotos', 'voiceInput', 'bankSync', 'familySharing',
  'noAds', 'noTrackers', 'openSource',
] as const;

const cell = (v: boolean) =>
  v ? c.common.table.yes : c.common.table.no;
---
<section class="mx-auto max-w-5xl px-6 py-12 md:py-16">
  <h2 class="text-center font-[family-name:var(--font-display)] font-bold text-[28px] md:text-[36px] tracking-[-0.025em] text-[var(--color-fg-primary)]">
    {c.common.section_titles.comparison_table}
  </h2>
  <div class="mt-10 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
    <table class="w-full text-[14px]">
      <thead class="bg-[var(--color-surface-secondary)] text-left">
        <tr>
          <th class="p-4 font-semibold text-[var(--color-fg-secondary)] uppercase text-[11px] tracking-[0.1em] w-1/3"></th>
          <th class="p-4 font-bold text-[var(--color-accent-primary)]">{self.displayName}</th>
          <th class="p-4 font-bold text-[var(--color-fg-primary)]">{competitor.displayName}</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t border-[var(--color-border)]">
          <td class="p-4 font-semibold text-[var(--color-fg-secondary)] uppercase text-[11px] tracking-[0.1em]">{c.common.table.pricing_label}</td>
          <td class="p-4">{pricingCell(self.pricing)}</td>
          <td class="p-4">{pricingCell(competitor.pricing)}</td>
        </tr>
        <tr class="border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40">
          <td class="p-4 font-semibold text-[var(--color-fg-secondary)] uppercase text-[11px] tracking-[0.1em]" colspan="3">{c.common.table.platforms_label}</td>
        </tr>
        {platformKeys.map((k) => (
          <tr class="border-t border-[var(--color-border)]">
            <td class="p-4 text-[var(--color-fg-secondary)]">{c.common.platform_labels[k]}</td>
            <td class="p-4">{cell(self.platforms[k])}</td>
            <td class="p-4">{cell(competitor.platforms[k])}</td>
          </tr>
        ))}
        <tr class="border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40">
          <td class="p-4 font-semibold text-[var(--color-fg-secondary)] uppercase text-[11px] tracking-[0.1em]" colspan="3">{c.common.table.features_label}</td>
        </tr>
        {featureKeys.map((k) => (
          <tr class="border-t border-[var(--color-border)]">
            <td class="p-4 text-[var(--color-fg-secondary)]">{c.common.feature_labels[k]}</td>
            <td class="p-4">{cell(self.features[k])}</td>
            <td class="p-4">{cell(competitor.features[k])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompareTable.astro
git commit -m "feat(compare): add CompareTable component"
```

---

### Task 11: `CompareAdvantages.astro`

**Files:**
- Create: `src/components/compare/CompareAdvantages.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { CompareI18nData } from '../../content.config';

interface Props {
  c: CompareI18nData;
}
const { c } = Astro.props;
const icons = ['◆', '▲', '●', '★'];
const bg = ['#E8F5E9', '#E3F2FD', '#FFF3E0', '#F3E5F5'];
---
<section class="bg-[var(--color-surface-secondary)] py-20 md:py-24">
  <div class="mx-auto max-w-6xl px-6">
    <h2 class="max-w-2xl font-[family-name:var(--font-display)] font-bold text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.025em] text-[var(--color-fg-primary)]">
      {c.common.section_titles.moneywise_advantages}
    </h2>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
      {c.common.advantages.map((a, i) => (
        <article class="rounded-2xl bg-white border border-[var(--color-border)] p-6">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-accent-primary)] font-bold"
            style={`background:${bg[i]}`}
          >
            {icons[i]}
          </div>
          <h3 class="mt-4 text-[18px] font-semibold text-[var(--color-fg-primary)]">{a.title}</h3>
          <p class="mt-2 text-[14px] leading-[1.65] text-[var(--color-fg-secondary)]">{a.description}</p>
        </article>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompareAdvantages.astro
git commit -m "feat(compare): add CompareAdvantages component"
```

---

### Task 12: `CompareAiDeepDive.astro`

**Files:**
- Create: `src/components/compare/CompareAiDeepDive.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { CompareI18nData } from '../../content.config';

interface Props {
  c: CompareI18nData;
}
const { c } = Astro.props;
---
<section class="py-20 md:py-24">
  <div class="mx-auto max-w-4xl px-6">
    <p class="text-[11px] uppercase tracking-[0.12em] text-[var(--color-accent-primary)] font-semibold">
      {c.common.ai_deep_dive.eyebrow}
    </p>
    <h2 class="mt-3 font-[family-name:var(--font-display)] font-bold text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.025em] text-[var(--color-fg-primary)]">
      {c.common.ai_deep_dive.title}
    </h2>
    <p class="mt-5 text-[17px] leading-[1.65] text-[var(--color-fg-secondary)]">
      {c.common.ai_deep_dive.description}
    </p>
    <ul class="mt-8 space-y-3">
      {c.common.ai_deep_dive.bullets.map((b) => (
        <li class="flex gap-3 text-[15px] text-[var(--color-fg-primary)]">
          <span class="text-[var(--color-accent-primary)] font-bold">→</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  </div>
</section>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompareAiDeepDive.astro
git commit -m "feat(compare): add CompareAiDeepDive component"
```

---

### Task 13: `CompareWhenToChoose.astro`

**Files:**
- Create: `src/components/compare/CompareWhenToChoose.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { CompetitorData, CompareI18nData, CompetitorCopy } from '../../content.config';
import { interpolate } from '../../lib/compare';

interface Props {
  self: CompetitorData;
  competitor: CompetitorData;
  c: CompareI18nData;
  copy: CompetitorCopy;
}
const { self, competitor, c, copy } = Astro.props;
const competitorHeading = interpolate(c.common.when_to_choose.competitor_heading_template, {
  competitor: competitor.displayName,
});
---
<section class="py-20 md:py-24 bg-[var(--color-surface-secondary)]">
  <div class="mx-auto max-w-5xl px-6">
    <h2 class="font-[family-name:var(--font-display)] font-bold text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.025em] text-[var(--color-fg-primary)]">
      {c.common.section_titles.when_to_choose}
    </h2>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
      <article class="rounded-2xl bg-white border-2 border-[var(--color-accent-primary)] p-7">
        <h3 class="text-[20px] font-bold text-[var(--color-accent-primary)]">
          {c.common.when_to_choose.moneywise_heading} {self.displayName}
        </h3>
        <p class="mt-4 text-[15px] leading-[1.65] text-[var(--color-fg-primary)]">{copy.when_choose_moneywise}</p>
      </article>
      <article class="rounded-2xl bg-white border border-[var(--color-border)] p-7">
        <h3 class="text-[20px] font-bold text-[var(--color-fg-primary)]">{competitorHeading}</h3>
        <p class="mt-4 text-[15px] leading-[1.65] text-[var(--color-fg-secondary)]">{copy.when_choose_competitor}</p>
      </article>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompareWhenToChoose.astro
git commit -m "feat(compare): add CompareWhenToChoose component"
```

---

### Task 14: `CompareFaq.astro`

**Files:**
- Create: `src/components/compare/CompareFaq.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { CompareI18nData, CompetitorCopy } from '../../content.config';

interface Props {
  c: CompareI18nData;
  copy: CompetitorCopy;
}
const { c, copy } = Astro.props;
---
<section class="py-20 md:py-24">
  <div class="mx-auto max-w-3xl px-6">
    <h2 class="font-[family-name:var(--font-display)] font-bold text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.025em] text-[var(--color-fg-primary)]">
      {c.common.section_titles.faq}
    </h2>
    <div class="mt-10 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
      {copy.faq.map((item) => (
        <details class="group py-5">
          <summary class="list-none cursor-pointer flex justify-between items-start gap-4">
            <span class="text-[17px] font-semibold text-[var(--color-fg-primary)]">{item.q}</span>
            <span class="text-[var(--color-fg-secondary)] transition group-open:rotate-45 text-[20px] leading-none">+</span>
          </summary>
          <p class="mt-4 text-[15px] leading-[1.7] text-[var(--color-fg-secondary)]">{item.a}</p>
        </details>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompareFaq.astro
git commit -m "feat(compare): add CompareFaq component"
```

---

### Task 14b: `CompareSeeAlso.astro` (3 related-competitor links)

**Files:**
- Create: `src/components/compare/CompareSeeAlso.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { CompetitorData, CompareI18nData } from '../../content.config';
import type { Locale } from '../../config/site';
import { pathFor } from '../../lib/i18n';
import { compareSlug } from '../../lib/compare';
import CompetitorBadge from './CompetitorBadge.astro';

interface Props {
  current: CompetitorData;
  all: CompetitorData[];
  c: CompareI18nData;
  locale: Locale;
}
const { current, all, c, locale } = Astro.props;

// Pick up to 3 same-region competitors that are not the current one.
const related = all
  .filter((x) => x.slug !== current.slug && x.region === current.region)
  .slice(0, 3);
---
{related.length > 0 && (
  <section class="py-16 md:py-20 bg-[var(--color-surface-secondary)]">
    <div class="mx-auto max-w-5xl px-6">
      <h2 class="text-[11px] uppercase tracking-[0.12em] text-[var(--color-accent-primary)] font-semibold">
        {c.common.section_titles.see_also}
      </h2>
      <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map((r) => (
          <a
            href={pathFor(locale, compareSlug(r.slug))}
            class="block rounded-xl border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-accent-primary)]"
          >
            <CompetitorBadge name={r.displayName} size="sm" />
            <p class="mt-3 text-[13px] text-[var(--color-fg-secondary)]">MoneyWise {c.common.hero.versus_label} {r.displayName}</p>
          </a>
        ))}
      </div>
    </div>
  </section>
)}
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompareSeeAlso.astro
git commit -m "feat(compare): add CompareSeeAlso component"
```

---

## Phase F — Page Assembly

### Task 15: `views/ComparePage.astro`

**Files:**
- Create: `src/views/ComparePage.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { Locale } from '../config/site';
import { getI18n } from '../lib/i18n';
import { getCompetitor, getSelf, getAllCompetitors, getCompareI18n, getCompetitorCopy, compareSlug, interpolate } from '../lib/compare';
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import PrivacyFirst from '../components/PrivacyFirst.astro';
import Pricing from '../components/Pricing.astro';
import DownloadCta from '../components/DownloadCta.astro';
import Footer from '../components/Footer.astro';
import CompareHero from '../components/compare/CompareHero.astro';
import CompareTable from '../components/compare/CompareTable.astro';
import CompareAdvantages from '../components/compare/CompareAdvantages.astro';
import CompareAiDeepDive from '../components/compare/CompareAiDeepDive.astro';
import CompareWhenToChoose from '../components/compare/CompareWhenToChoose.astro';
import CompareFaq from '../components/compare/CompareFaq.astro';
import CompareSeeAlso from '../components/compare/CompareSeeAlso.astro';

interface Props {
  locale: Locale;
  competitorSlug: string;
}
const { locale, competitorSlug } = Astro.props;

const [t, c, self, competitor, all] = await Promise.all([
  getI18n(locale),
  getCompareI18n(locale),
  getSelf(),
  getCompetitor(competitorSlug),
  getAllCompetitors(),
]);
const copy = getCompetitorCopy(c, competitorSlug);
const slug = compareSlug(competitorSlug);
const title = interpolate(c.common.meta.title_template, { competitor: competitor.displayName });
const description = interpolate(c.common.meta.description_template, { competitor: competitor.displayName });
---
<BaseLayout title={title} description={description} locale={locale} slug={slug}>
  <Nav locale={locale} slug={slug} t={t} />
  <main>
    <CompareHero self={self} competitor={competitor} c={c} copy={copy} />
    <CompareTable self={self} competitor={competitor} c={c} />
    <CompareAdvantages c={c} />
    <CompareAiDeepDive c={c} />
    <PrivacyFirst locale={locale} t={t} />
    <CompareWhenToChoose self={self} competitor={competitor} c={c} copy={copy} />
    <Pricing t={t} />
    <DownloadCta t={t} />
    <CompareFaq c={c} copy={copy} />
    <CompareSeeAlso current={competitor} all={all} c={c} locale={locale} />
  </main>
  <Footer locale={locale} slug={slug} t={t} />
</BaseLayout>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/views/ComparePage.astro
git commit -m "feat(compare): add ComparePage view"
```

---

### Task 16: Default-locale page wrapper

**Files:**
- Create: `src/pages/moneywise-vs-[competitor].astro`

- [ ] **Step 1: Create the file.**

```astro
---
import { getCollection } from 'astro:content';
import ComparePage from '../views/ComparePage.astro';

export async function getStaticPaths() {
  const all = await getCollection('competitors');
  return all
    .filter((e) => !e.data.hideFromIndex)
    .map((e) => ({ params: { competitor: e.data.slug } }));
}

const { competitor } = Astro.params;
---
<ComparePage locale="en" competitorSlug={competitor!} />
```

- [ ] **Step 2: Build.**

Run: `pnpm run build`
Expected: PASS. The build should now produce `dist/moneywise-vs-ynab/index.html`.

- [ ] **Step 3: Verify locally — start dev server and open the YNAB page.**

Run: `pnpm run dev` (in a background shell or new terminal)
Open: http://localhost:4321/moneywise-vs-ynab/
Verify: hero shows "MoneyWise vs YNAB", table shows pricing/platforms/features, all 9 sections render in order, no console errors.

Stop the dev server when verified.

- [ ] **Step 4: Commit.**

```bash
git add src/pages/moneywise-vs-[competitor].astro
git commit -m "feat(compare): add default-locale comparison page wrapper"
```

---

## Phase G — Other-Locale Page Wrappers (YNAB Smoke Test Path)

### Task 17: Stub the other 4 locales' compare i18n with English copy

To get the page wrappers building before full translation, copy English to the other 4 locale files (translation pass happens in Phase J).

**Files:**
- Create: `src/content/i18n/compare/zh.json`
- Create: `src/content/i18n/compare/zh-Hant.json`
- Create: `src/content/i18n/compare/ja.json`
- Create: `src/content/i18n/compare/ko.json`

- [ ] **Step 1: Copy `compare/en.json` to the other 4 locale filenames verbatim.**

```bash
cp src/content/i18n/compare/en.json src/content/i18n/compare/zh.json
cp src/content/i18n/compare/en.json src/content/i18n/compare/zh-Hant.json
cp src/content/i18n/compare/en.json src/content/i18n/compare/ja.json
cp src/content/i18n/compare/en.json src/content/i18n/compare/ko.json
```

- [ ] **Step 2: Build.**

Run: `pnpm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/content/i18n/compare/
git commit -m "chore(compare): stub other locales with en copy (translate later)"
```

---

### Task 18: Create per-locale page wrappers

**Files:**
- Create: `src/pages/zh/moneywise-vs-[competitor].astro`
- Create: `src/pages/zh-Hant/moneywise-vs-[competitor].astro`
- Create: `src/pages/ja/moneywise-vs-[competitor].astro`
- Create: `src/pages/ko/moneywise-vs-[competitor].astro`

- [ ] **Step 1: For each locale, create a wrapper file with this content (substitute `<LOCALE>` with the locale code).**

```astro
---
import { getCollection } from 'astro:content';
import ComparePage from '../../views/ComparePage.astro';

export async function getStaticPaths() {
  const all = await getCollection('competitors');
  return all
    .filter((e) => !e.data.hideFromIndex)
    .map((e) => ({ params: { competitor: e.data.slug } }));
}

const { competitor } = Astro.params;
---
<ComparePage locale="<LOCALE>" competitorSlug={competitor!} />
```

Replace `<LOCALE>` with `zh`, `zh-Hant`, `ja`, `ko` in each file respectively.

- [ ] **Step 2: Build and verify all 5 YNAB pages exist.**

Run: `pnpm run build`
Expected: `dist/` contains:
- `moneywise-vs-ynab/index.html`
- `zh/moneywise-vs-ynab/index.html`
- `zh-Hant/moneywise-vs-ynab/index.html`
- `ja/moneywise-vs-ynab/index.html`
- `ko/moneywise-vs-ynab/index.html`

Verify: `ls dist/moneywise-vs-ynab dist/zh/moneywise-vs-ynab dist/zh-Hant/moneywise-vs-ynab dist/ja/moneywise-vs-ynab dist/ko/moneywise-vs-ynab`

- [ ] **Step 3: Smoke test in browser.**

Run: `pnpm run dev`
Open each: `/moneywise-vs-ynab/`, `/zh/moneywise-vs-ynab/`, `/zh-Hant/moneywise-vs-ynab/`, `/ja/moneywise-vs-ynab/`, `/ko/moneywise-vs-ynab/`.
Verify: locale switcher in nav goes between them without 404. `<html lang>` matches locale. `<link rel="alternate" hreflang>` tags exist for all 5.

- [ ] **Step 4: Commit.**

```bash
git add src/pages/zh/moneywise-vs-[competitor].astro src/pages/zh-Hant/moneywise-vs-[competitor].astro src/pages/ja/moneywise-vs-[competitor].astro src/pages/ko/moneywise-vs-[competitor].astro
git commit -m "feat(compare): add per-locale comparison page wrappers"
```

---

## Phase H — `/compare/` Index

### Task 19: `CompareIndexCard.astro`

**Files:**
- Create: `src/components/compare/CompareIndexCard.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { CompetitorData, CompetitorCopy } from '../../content.config';
import type { Locale } from '../../config/site';
import { pathFor } from '../../lib/i18n';
import { compareSlug } from '../../lib/compare';
import CompetitorBadge from './CompetitorBadge.astro';

interface Props {
  competitor: CompetitorData;
  copy: CompetitorCopy | undefined;
  locale: Locale;
  cardCta: string;
}
const { competitor, copy, locale, cardCta } = Astro.props;
const href = pathFor(locale, compareSlug(competitor.slug));
---
<a href={href} class="block rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-[0_8px_24px_rgba(30,51,34,0.06)] hover:border-[var(--color-accent-primary)]">
  <CompetitorBadge name={competitor.displayName} size="sm" />
  {copy?.one_liner && (
    <p class="mt-4 text-[14px] leading-[1.55] text-[var(--color-fg-secondary)]">{copy.one_liner}</p>
  )}
  <p class="mt-4 text-[13px] font-semibold text-[var(--color-accent-primary)]">{cardCta}</p>
</a>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/compare/CompareIndexCard.astro
git commit -m "feat(compare): add CompareIndexCard component"
```

---

### Task 20: `views/CompareIndex.astro`

**Files:**
- Create: `src/views/CompareIndex.astro`

- [ ] **Step 1: Create the file.**

```astro
---
import type { Locale } from '../config/site';
import { getI18n } from '../lib/i18n';
import { getAllCompetitors, getCompareI18n } from '../lib/compare';
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import CompareIndexCard from '../components/compare/CompareIndexCard.astro';

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;

const [t, c, competitors] = await Promise.all([
  getI18n(locale),
  getCompareI18n(locale),
  getAllCompetitors(),
]);

const regions = ['western', 'chinese', 'japanese', 'korean', 'ios_focused'] as const;
const grouped = regions.map((r) => ({
  region: r,
  label: c.common.index.region_labels[r],
  items: competitors.filter((x) => x.region === r),
}));
---
<BaseLayout title={c.common.index.title} description={c.common.index.subtitle} locale={locale} slug="compare">
  <Nav locale={locale} slug="compare" t={t} />
  <main class="mx-auto max-w-6xl px-6 py-20 md:py-24">
    <h1 class="font-[family-name:var(--font-display)] font-bold text-[40px] md:text-[60px] leading-[1.02] tracking-[-0.035em] text-[var(--color-fg-primary)]">
      {c.common.index.title}
    </h1>
    <p class="mt-5 max-w-2xl text-[17px] leading-[1.6] text-[var(--color-fg-secondary)]">
      {c.common.index.subtitle}
    </p>
    {grouped.map((g) => g.items.length > 0 && (
      <section class="mt-16">
        <h2 class="text-[11px] uppercase tracking-[0.12em] text-[var(--color-accent-primary)] font-semibold">{g.label}</h2>
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {g.items.map((competitor) => (
            <CompareIndexCard
              competitor={competitor}
              copy={c.competitors[competitor.slug]}
              locale={locale}
              cardCta={c.common.index.card_cta}
            />
          ))}
        </div>
      </section>
    ))}
  </main>
  <Footer locale={locale} slug="compare" t={t} />
</BaseLayout>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm astro check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/views/CompareIndex.astro
git commit -m "feat(compare): add CompareIndex view"
```

---

### Task 21: `/compare/` page wrappers

**Files:**
- Create: `src/pages/compare.astro`
- Create: `src/pages/zh/compare.astro`
- Create: `src/pages/zh-Hant/compare.astro`
- Create: `src/pages/ja/compare.astro`
- Create: `src/pages/ko/compare.astro`

- [ ] **Step 1: Create `src/pages/compare.astro`.**

```astro
---
import CompareIndex from '../views/CompareIndex.astro';
---
<CompareIndex locale="en" />
```

- [ ] **Step 2: Create the four locale variants.**

Each `src/pages/<LOCALE>/compare.astro`:

```astro
---
import CompareIndex from '../../views/CompareIndex.astro';
---
<CompareIndex locale="<LOCALE>" />
```

Replace `<LOCALE>` with `zh`, `zh-Hant`, `ja`, `ko` respectively.

- [ ] **Step 3: Build and verify.**

Run: `pnpm run build`
Expected: `dist/compare/index.html`, `dist/zh/compare/index.html`, `dist/zh-Hant/compare/index.html`, `dist/ja/compare/index.html`, `dist/ko/compare/index.html` all present.

- [ ] **Step 4: Smoke test.**

Run: `pnpm run dev`
Open: `/compare/`. Verify YNAB card appears under "Global / English" and clicking it navigates to `/moneywise-vs-ynab/`.

- [ ] **Step 5: Commit.**

```bash
git add src/pages/compare.astro src/pages/zh/compare.astro src/pages/zh-Hant/compare.astro src/pages/ja/compare.astro src/pages/ko/compare.astro
git commit -m "feat(compare): add /compare/ index pages in all locales"
```

---

## Phase I — Footer Link

### Task 22: Add `footer.compare` to i18n schema and all 5 locale files

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/content/i18n/en.json`
- Modify: `src/content/i18n/zh.json`
- Modify: `src/content/i18n/zh-Hant.json`
- Modify: `src/content/i18n/ja.json`
- Modify: `src/content/i18n/ko.json`

- [ ] **Step 1: Add `compare` to the `footer` object in the existing `i18nSchema` in `src/content.config.ts`.**

Find the `footer:` block:

```ts
footer: z.object({
  tagline: z.string(),
  links_header: z.string(),
  copyright: z.string(),
  contact: z.string(),
}),
```

Replace with:

```ts
footer: z.object({
  tagline: z.string(),
  links_header: z.string(),
  copyright: z.string(),
  contact: z.string(),
  compare: z.string(),
}),
```

- [ ] **Step 2: Add the `compare` key to all 5 i18n files' `footer` block.**

In each of `src/content/i18n/{en,zh,zh-Hant,ja,ko}.json`, locate the `footer` block and add:

- `en.json`: `"compare": "Compare alternatives"`
- `zh.json`: `"compare": "竞品对比"`
- `zh-Hant.json`: `"compare": "競品對比"`
- `ja.json`: `"compare": "他社比較"`
- `ko.json`: `"compare": "다른 앱과 비교"`

- [ ] **Step 3: Build to verify schema accepts all 5 files.**

Run: `pnpm run build`
Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add src/content.config.ts src/content/i18n/en.json src/content/i18n/zh.json src/content/i18n/zh-Hant.json src/content/i18n/ja.json src/content/i18n/ko.json
git commit -m "feat(compare): add footer.compare i18n key in all 5 locales"
```

---

### Task 23: Add the link to `Footer.astro`

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Edit `src/components/Footer.astro`. Add a new `<li>` to the links list, after the `terms` link.**

Find this line:

```astro
<li><a href={pathFor(locale, 'terms')} class="hover:text-[var(--color-accent-primary)]">Terms</a></li>
```

Add immediately after:

```astro
<li><a href={pathFor(locale, 'compare')} class="hover:text-[var(--color-accent-primary)]">{t.footer.compare}</a></li>
```

- [ ] **Step 2: Build and verify the link appears.**

Run: `pnpm run build && pnpm run dev`
Open: `/` (home page). Verify "Compare alternatives" appears in the footer links column. Click it — verify it goes to `/compare/`.

- [ ] **Step 3: Commit.**

```bash
git add src/components/Footer.astro
git commit -m "feat(compare): add Compare alternatives link to footer"
```

---

## Phase J — MVP Review Gate

### Task 24: Full build + Lighthouse smoke test on YNAB page

**Files:** none (verification only)

- [ ] **Step 1: Run a clean production build.**

Run: `rm -rf dist && pnpm run build`
Expected: build succeeds with no schema/Zod errors.

- [ ] **Step 2: Inspect the sitemap for the new pages.**

Run: `cat dist/sitemap-0.xml | grep -E '(moneywise-vs-ynab|/compare/)'`
Expected: 5 `moneywise-vs-ynab` URLs (one per locale) and 5 `/compare/` URLs.

- [ ] **Step 3: Inspect the YNAB page HTML for SEO basics.**

Run: `cat dist/moneywise-vs-ynab/index.html | grep -E '(<title>|<meta name="description"|hreflang)'`
Expected: title contains "MoneyWise vs YNAB", description has YNAB, 5 `hreflang` alternates + 1 `x-default`.

- [ ] **Step 4: Manual browser pass.**

Run: `pnpm run preview` (serves the built `dist/`).
Open the YNAB page in en, zh, zh-Hant, ja, ko. Verify:
- Hero, table, advantages, AI deep-dive, privacy, when-to-choose, pricing, CTA, FAQ all render
- Locale switcher works between all 5 versions of the YNAB page
- Footer "Compare alternatives" link works
- `/compare/` shows the YNAB card

- [ ] **Step 5: STOP — request review from Airing.**

Tell Airing: "MVP comparison page is live for YNAB across all 5 locales. Please review the YNAB page (especially the comparison table accuracy, hero copy, and 'when to choose' tone) before I bulk-fill the remaining 20 competitors."

Wait for explicit approval before continuing to Phase K.

---

## Phase K — Bulk Fill Remaining 20 Competitors

For each competitor below, complete one task with the same 4-step recipe. Each task is independent and commits separately.

### Recipe (per competitor)

For competitor `<slug>` with `<displayName>` in region `<region>`:

- [ ] **Step 1: Research from official sources** (pricing page, App Store listing, public docs). Cite source URLs in `sources[]`.
- [ ] **Step 2: Write `src/content/competitors/<slug>.json`** following the YNAB exemplar (Task 6). Set `verificationConfidence` to `high` / `medium` / `low` honestly.
- [ ] **Step 3: Add a `competitors.<slug>` entry to all 5 `compare/<locale>.json`** files with the schema from Task 5 (`one_liner`, `positioning`, `when_choose_competitor`, `when_choose_moneywise`, `faq` × 3-8). For non-English locales, write the copy in that locale's language. The `faq` array can be 3-8 questions; aim for 5-6.
- [ ] **Step 4: Build, smoke-test the page in the locale most relevant to the competitor, commit.**

```bash
pnpm run build
git add src/content/competitors/<slug>.json src/content/i18n/compare/
git commit -m "feat(compare): add <displayName> competitor"
```

### Task 25: Mint (`mint`, region `western`)
- [ ] Apply the recipe. Note: Mint shut down in 2024 — `verificationConfidence: 'medium'`, mark `lastVerified` and explain in `pricing.notes` ("Discontinued; included for SEO of legacy searches"). Highlight migration paths in FAQ.

### Task 26: Copilot Money (`copilot-money`, region `western`)
- [ ] Apply the recipe. Source: https://copilot.money

### Task 27: Monarch Money (`monarch-money`, region `western`)
- [ ] Apply the recipe. Source: https://www.monarchmoney.com

### Task 28: Rocket Money (`rocket-money`, region `western`)
- [ ] Apply the recipe. Source: https://www.rocketmoney.com (formerly Truebill)

### Task 29: Empower / Personal Capital (`empower`, region `western`)
- [ ] Apply the recipe. Source: https://www.empower.com (the "Personal Wealth" / former Personal Capital app)

### Task 30: Spendee (`spendee`, region `western`)
- [ ] Apply the recipe. Source: https://www.spendee.com

### Task 31: PocketGuard (`pocketguard`, region `western`)
- [ ] Apply the recipe. Source: https://pocketguard.com

### Task 32: 随手记 (`suishouji`, region `chinese`)
- [ ] Apply the recipe. Source: https://www.feidee.com — confirm pricing in CNY, USD-normalize, keep CNY in `notes`. Confidence likely `medium`.

### Task 33: 鲨鱼记账 (`shayu`, region `chinese`)
- [ ] Apply the recipe. App Store listing primary source. Confidence likely `medium` to `low` — flag for Airing review.

### Task 34: 钱迹 (`qianji`, region `chinese`)
- [ ] Apply the recipe. Source: official site / App Store listing.

### Task 35: MoneyKeeper (`moneykeeper`, region `chinese`)
- [ ] Apply the recipe.

### Task 36: 一木记账 (`yimu`, region `chinese`)
- [ ] Apply the recipe.

### Task 37: Zaim (`zaim`, region `japanese`)
- [ ] Apply the recipe. Source: https://zaim.net

### Task 38: Money Forward ME (`money-forward-me`, region `japanese`)
- [ ] Apply the recipe. Source: https://moneyforward.com

### Task 39: マネーツリー / Moneytree (`moneytree`, region `japanese`)
- [ ] Apply the recipe. Source: https://moneytree.jp

### Task 40: 뱅크샐러드 / Banksalad (`banksalad`, region `korean`)
- [ ] Apply the recipe. Source: https://www.banksalad.com

### Task 41: 편한가계부 (`pyeonhan`, region `korean`)
- [ ] Apply the recipe. App Store listing primary source. Confidence likely `medium`.

### Task 42: Money Pro (`money-pro`, region `ios_focused`)
- [ ] Apply the recipe. Source: https://www.ibearmoney.com

### Task 43: 1Money (`1money`, region `ios_focused`)
- [ ] Apply the recipe. Source: https://1moneyapp.com

### Task 44: MoneyCoach (`moneycoach`, region `ios_focused`)
- [ ] Apply the recipe. Source: https://moneycoach.ai

---

## Phase L — Translation Pass

### Task 45: Translate `compare/zh.json` `common` block into Simplified Chinese

**Files:**
- Modify: `src/content/i18n/compare/zh.json`

- [ ] **Step 1: Translate every string under `common` from English to Simplified Chinese.** Keep the `{competitor}` and `{one_liner}` placeholders intact. Do not translate the `competitors.*` block (already added per-competitor in Phase K's recipe).

- [ ] **Step 2: Build.**

Run: `pnpm run build`
Expected: PASS.

- [ ] **Step 3: Smoke test on the Chinese YNAB page.**

Run: `pnpm run dev`
Open: `/zh/moneywise-vs-ynab/`
Verify: section titles, table headers, FAQ heading, "back to index" all in Simplified Chinese.

- [ ] **Step 4: Commit.**

```bash
git add src/content/i18n/compare/zh.json
git commit -m "i18n(compare): translate common strings into Simplified Chinese"
```

### Task 46: Translate `compare/zh-Hant.json` `common` block into Traditional Chinese
- [ ] Apply the same recipe as Task 45 against Traditional Chinese.

### Task 47: Translate `compare/ja.json` `common` block into Japanese
- [ ] Apply the same recipe as Task 45 against Japanese.

### Task 48: Translate `compare/ko.json` `common` block into Korean
- [ ] Apply the same recipe as Task 45 against Korean.

---

## Phase M — Final Verification

### Task 49: Full build, sitemap audit, and link check

**Files:** none (verification only)

- [ ] **Step 1: Clean build.**

Run: `rm -rf dist && pnpm run build`
Expected: PASS with all 21 competitors × 5 locales generated.

- [ ] **Step 2: Sitemap audit — count URLs.**

Run: `grep -c '<loc>' dist/sitemap-0.xml`
Expected: ≥ 110 (21 × 5 = 105 comparison pages + 5 compare index pages, plus existing pages)

- [ ] **Step 3: hreflang audit — sample one page.**

Run: `grep -c 'hreflang' dist/moneywise-vs-ynab/index.html`
Expected: 6 (5 alternates + 1 `x-default`).

- [ ] **Step 4: Find any unfilled `competitors.<slug>` keys across locales.**

Run:
```bash
for locale in en zh zh-Hant ja ko; do
  echo "=== $locale ==="
  python3 -c "import json; d=json.load(open('src/content/i18n/compare/$locale.json')); print(sorted(d['competitors'].keys()))"
done
```

Expected: All 5 locale files list the same 21 competitor slugs (no missing entries).

- [ ] **Step 5: Browser smoke test — random 5 competitors across locales.**

Run: `pnpm run preview`
Open 5 random pages (e.g., `/moneywise-vs-mint/`, `/zh/moneywise-vs-suishouji/`, `/ja/moneywise-vs-zaim/`, `/ko/moneywise-vs-banksalad/`, `/zh-Hant/moneywise-vs-copilot-money/`). Verify each renders without errors.

- [ ] **Step 6: Lighthouse SEO check.**

Open Chrome DevTools → Lighthouse → run on `/moneywise-vs-ynab/`.
Expected: SEO score ≥ 95.

- [ ] **Step 7: Final commit + push.**

If anything was tweaked during verification:
```bash
git add -A
git commit -m "chore(compare): post-bulk verification fixes"
```

Push when Airing approves the final review.

---

### Task 50: Add competitor data freshness check script (optional, deferrable)

Implements spec §7.3 staleness warning.

**Files:**
- Create: `scripts/check-competitor-freshness.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/check-competitor-freshness.mjs`.**

```js
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/content/competitors';
const STALE_DAYS = 90;
const today = new Date();

let staleCount = 0;
let lowConfidenceCount = 0;
const issues = [];

for (const file of readdirSync(dir)) {
  if (!file.endsWith('.json')) continue;
  const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const verifiedAt = new Date(data.lastVerified);
  const days = Math.floor((today - verifiedAt) / (1000 * 60 * 60 * 24));
  if (days > STALE_DAYS) {
    issues.push(`STALE  ${data.slug.padEnd(20)} verified ${days} days ago (${data.lastVerified})`);
    staleCount++;
  }
  if (data.verificationConfidence !== 'high') {
    issues.push(`LOW    ${data.slug.padEnd(20)} confidence=${data.verificationConfidence}`);
    lowConfidenceCount++;
  }
}

if (issues.length === 0) {
  console.log(`✓ All ${readdirSync(dir).filter((f) => f.endsWith('.json')).length} competitors are fresh and high-confidence.`);
} else {
  console.warn(`⚠ Competitor data needs attention:`);
  for (const i of issues) console.warn('  ' + i);
  console.warn(`  ${staleCount} stale, ${lowConfidenceCount} low/medium confidence`);
}
```

- [ ] **Step 2: Add a script entry to `package.json`.**

In the `scripts` block, add:

```json
"check:competitors": "node scripts/check-competitor-freshness.mjs"
```

- [ ] **Step 3: Run it.**

Run: `pnpm run check:competitors`
Expected: prints status; non-zero issues are warnings only (script always exits 0 — this is informational, not a build gate).

- [ ] **Step 4: Commit.**

```bash
git add scripts/check-competitor-freshness.mjs package.json
git commit -m "chore(compare): add competitor data freshness check script"
```
