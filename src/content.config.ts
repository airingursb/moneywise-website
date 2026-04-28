import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const i18nSchema = z.object({
  meta: z.object({
    title: z.string(),
    description: z.string(),
  }),
  nav: z.object({
    features: z.string(),
    privacy: z.string(),
    pricing: z.string(),
    download: z.string(),
  }),
  hero: z.object({
    headline_part1: z.string(),
    headline_italic: z.string(),
    subhead: z.string(),
    cta_primary: z.string(),
    cta_secondary: z.string(),
    stat_offline_label: z.string(),
    stat_ads_label: z.string(),
    stat_byok_label: z.string(),
    coming_soon: z.string(),
  }),
  features: z.object({
    eyebrow: z.string(),
    title: z.string(),
    items: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })).length(6),
  }),
  screenshots: z.object({
    eyebrow: z.string(),
    title: z.string(),
    captions: z.array(z.string()).length(9),
  }),
  privacyFirst: z.object({
    eyebrow: z.string(),
    title: z.string(),
    subhead: z.string(),
    pillars: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })).length(3),
    learn_more: z.string(),
  }),
  pricing: z.object({
    eyebrow: z.string(),
    title: z.string(),
    subhead: z.string(),
    free_name: z.string(),
    free_tagline: z.string(),
    free_features: z.array(z.string()),
    pro_name: z.string(),
    pro_tagline: z.string(),
    pro_features: z.array(z.string()),
    per_month: z.string(),
    per_year: z.string(),
    free_trial: z.string(),
    or_monthly_prefix: z.string(),
    cta_free: z.string(),
    cta_pro: z.string(),
  }),
  downloadCta: z.object({
    title: z.string(),
    subhead: z.string(),
    cta: z.string(),
    small_print: z.string(),
  }),
  footer: z.object({
    tagline: z.string(),
    links_header: z.string(),
    copyright: z.string(),
    contact: z.string(),
  }),
  featuresPage: z.object({
    title: z.string(),
    subhead: z.string(),
    modules: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      screenshot: z.string(),
      bullets: z.array(z.string()),
    })),
  }),
});

const i18n = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/i18n' }),
  schema: i18nSchema,
});

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

export const collections = { i18n, competitors, 'compare-i18n': compareI18n };
export type I18nData = z.infer<typeof i18nSchema>;
