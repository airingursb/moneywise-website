import { getEntry } from 'astro:content';
import type { Locale } from '../config/site';
import { DEFAULT_LOCALE, LOCALES } from '../config/site';

export function getLocaleFromUrl(url: URL): Locale {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  if (seg && (LOCALES as readonly string[]).includes(seg)) {
    return seg as Locale;
  }
  return DEFAULT_LOCALE;
}

export async function getI18n(locale: Locale) {
  const entry = await getEntry('i18n', locale);
  if (!entry) throw new Error(`i18n entry missing for locale: ${locale}`);
  return entry.data;
}

export function pathFor(locale: Locale, slug: string = ''): string {
  const clean = slug.replace(/^\/+|\/+$/g, '');
  if (locale === DEFAULT_LOCALE) {
    return clean ? `/${clean}/` : '/';
  }
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}

export function alternateLinks(currentSlug: string): Array<{ locale: Locale; href: string }> {
  return LOCALES.map((l) => ({
    locale: l,
    href: pathFor(l, currentSlug),
  }));
}
