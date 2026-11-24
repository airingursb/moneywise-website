import { getEntry } from 'astro:content';
import type { Locale } from '../config/site';
import { SITE } from '../config/site';
import type { FaqData } from '../content.config';
import { pathFor } from './i18n';

export async function getFaq(locale: Locale): Promise<FaqData> {
  const entry = (await getEntry('faq', locale.toLowerCase())) ?? (await getEntry('faq', 'en'));
  if (!entry) throw new Error('faq content missing');
  return entry.data as FaqData;
}

/** Fill {privacy}/{account_deletion}/{email} placeholders; rewrite in-page anchors to /faq when needed. */
export function renderAnswer(html: string, locale: Locale, opts: { onFaqPage?: boolean } = {}): string {
  let out = html
    .replaceAll('{privacy}', pathFor(locale, 'privacy'))
    .replaceAll('{account_deletion}', pathFor(locale, 'account-deletion'))
    .replaceAll('{email}', SITE.contactEmail);
  if (!opts.onFaqPage) out = out.replaceAll('href="#', `href="${pathFor(locale, 'faq')}#`);
  return out;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
