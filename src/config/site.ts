export const LOCALES = ['en', 'zh', 'zh-Hant', 'ja'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const SITE = {
  url: 'https://moneywise.airingdeng.com',
  name: 'MoneyWise',
  appStoreId: '6762085775',
  appStoreUrl: 'https://apps.apple.com/app/id6762085775',
  appStoreAvailable: false, // flip to true after App Store approval
  umamiScriptUrl: 'https://analytics.ursb.me/script.js',
  umamiWebsiteId: 'fa8052bb-dd85-4287-9c63-da9b2f97fdef',
  contactEmail: 'bellehou2026@gmail.com',
  githubUrl: 'https://github.com/airingursb/moneywise',
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
} as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  'en': 'English',
  'zh': '简体中文',
  'zh-Hant': '繁體中文',
  'ja': '日本語',
};

export const PRICING = {
  free: {
    priceMonthly: 0,
    priceAnnual: 0,
  },
  pro: {
    priceMonthly: 4.99,   // TBD from Adapty, update when final
    priceAnnual: 39.99,   // TBD
    currency: 'USD',
  },
} as const;
