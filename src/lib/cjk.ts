/**
 * Line-break control for CJK headings.
 *
 * Browsers may break Chinese/Japanese text between any two characters, which
 * splits words in large headings ("默 / 认"). We mark the allowed break points
 * at build time with <wbr> and render CJK headings with `word-break: keep-all`
 * (see global.css), so lines only break between phrases.
 *
 *  - Text is split into clauses after punctuation (e.g. "离线，|默认如此。");
 *    each clause is kept on one line when it fits, otherwise it wraps
 *    between phrases.
 *  - Phrases come from BudouX (Google's ML phrase segmenter, run at build time —
 *    no client JS). Breaks next to Latin letters/digits are dropped so names
 *    like "iPhone" never split.
 *  - Korean separates words with spaces, so `keep-all` alone is enough.
 */
import {
  loadDefaultJapaneseParser,
  loadDefaultSimplifiedChineseParser,
  loadDefaultTraditionalChineseParser,
} from 'budoux';

const parsers = {
  zh: loadDefaultSimplifiedChineseParser(),
  'zh-Hant': loadDefaultTraditionalChineseParser(),
  ja: loadDefaultJapaneseParser(),
} as const;

const PUNCT = /([、，,：；！？。])/;
const LATIN = /[A-Za-z0-9]/;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function joinPhrases(parts: string[]): string {
  let out = '';
  parts.forEach((p, i) => {
    if (i > 0) {
      const prev = parts[i - 1];
      const latinJoin = LATIN.test(prev.slice(-1)) || LATIN.test(p[0]) || /\s$/.test(prev) || /^\s/.test(p);
      if (!latinJoin) out += '<wbr>';
    }
    out += esc(p);
  });
  return out;
}

export function phraseHtml(text: string, locale: string): string {
  const parser = parsers[locale as keyof typeof parsers];
  if (!parser || !text) return esc(text ?? '');
  // Split into clauses, keeping punctuation attached to the preceding clause.
  const clauses: string[] = [];
  for (const piece of text.split(PUNCT)) {
    if (!piece) continue;
    if (PUNCT.test(piece) && clauses.length) clauses[clauses.length - 1] += piece;
    else clauses.push(piece);
  }
  // Each clause is an inline-block: it moves to the next line as a whole when
  // it fits there, and only wraps inside (at phrase boundaries) when it is
  // wider than a full line.
  return clauses
    .map((c) => `<span class="cjk-clause">${joinPhrases(parser.parse(c)).replace(/・/g, '・<wbr>')}</span>`)
    .join('');
}

export function localeFromPath(pathname: string): string {
  const seg = pathname.split('/')[1];
  return ['zh', 'zh-Hant', 'ja', 'ko'].includes(seg) ? seg : 'en';
}
