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
