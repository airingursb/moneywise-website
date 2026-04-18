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
    captions: z.array(z.string()).length(8),
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

export const collections = { i18n };
export type I18nData = z.infer<typeof i18nSchema>;
