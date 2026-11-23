---
title: Privacy Policy
effective: 2026-11-24
---

# Privacy Policy

**Effective date:** 2026-11-24

This policy explains what MoneyWise does with your data.

## Summary (TL;DR)

- All your financial records are stored **on your device** in a local database, protected by your device's built-in security (app sandbox and, where enabled, device encryption).
- The app sends **usage statistics** (screens and features used) to our self-hosted Umami server — you can turn this off in Settings › Account & Data › Security & Privacy — and **crash and performance reports** to Sentry so we can fix bugs. We don't run ads and don't sell your data.
- If you turn on **cloud sync** (Pro), your data is sent over encrypted connections (TLS) to our Supabase backend and stored in your account, separated from other users by row-level access rules. It is not end-to-end encrypted.
- If you use the **AI advisor** with your own API key, requests go directly from your device to the AI provider. We do not route, log, or relay those requests.
- On this website (`moneywise.ursb.me`), we use **Umami** for privacy-friendly, cookieless page view analytics. No IP addresses or identifiers are stored.

## What MoneyWise collects

**On your device** (not uploaded to our servers unless you enable sync; AI features send what they need to the provider you choose, as described below):
- Your accounts, balances, transactions, budgets, and investment holdings.
- Receipt images you choose to attach.
- Your AI provider API key (stored in your device's secure storage — the Keychain on iPhone and Mac, the Keystore on Android). It is never sent to our servers.

**When cloud sync is enabled** (Pro subscribers):
- Copies of the above, sent over TLS and stored in your account on our Supabase backend. Access is restricted to your account (and to members of a family workspace you join) by row-level security rules.
- Your Supabase account email (used only for login).
- Device identifiers needed to distinguish your phones from each other during sync.

**When you use AI features:**
- AI features always use your own Anthropic or OpenAI API key; MoneyWise does not provide pooled AI credits. Requests go directly from your device to the provider you chose, and include only what the feature needs (for example, aggregated spending figures for the monthly review, or your holdings for the investments daily report). Receipt photos you scan are sent to that provider to be read.

**In-app diagnostics:**
- Usage statistics: which screens and features are used, app version, language and device type, sent to our self-hosted Umami server. You can turn this off in Settings › Account & Data › Security & Privacy.
- Crash and performance reports: error details, device and OS information, and your IP address, sent to Sentry. The usage-statistics switch does not turn these off.

**If you connect an AI assistant via MCP extensions** (Pro):
- The assistant you authorise can read — and, if you allow it, create — data in your synced account through our MCP server, using the token or OAuth grant you create. You can revoke access at any time in the app.

**When you send feedback:**
- Bug reports and feature requests you submit in the app are stored in our issue tracker (Linear) together with your account email so we can follow up.

**On this website:**
- Umami records: page viewed, referrer, country (coarse), browser / OS (coarse), screen size. Nothing that identifies you personally.
- No cookies. No tracking pixels. No ad networks.

## What MoneyWise does **not** collect

- We do not collect your exact location.
- We do not share, sell, or rent data to third parties.
- We do not run advertising.
- We don't access your financial records except to provide support you ask for, or when required by law.

## Your controls

- **Export**: In-app, you can export all records to CSV.
- **Delete**: Delete your account in the app (Settings › My Account › Delete Account) to remove your cloud data; uninstalling the app removes local data. You can also email us at the contact below.
- **Stop sync**: Disabling cloud sync stops further uploads. Data already synced stays in your account until you delete your account.
- **Analytics**: Turn off usage statistics in Settings › Account & Data › Security & Privacy.

## Third parties

| Service | Purpose | Where |
|---|---|---|
| Supabase | Cloud sync backend, Auth, file storage | eu-west (Ireland) |
| Apple | App Store, in-app purchase, Sign in with Apple, iCloud Keychain | Apple |
| Google | Google Sign-In, Google Play billing | Google |
| Adapty | Subscription status and purchase validation | Adapty |
| Sentry | Crash and performance reports | US |
| Your chosen AI provider (Anthropic, OpenAI) | AI requests sent directly from your device using your key | US |
| Yahoo Finance (via our server) | Market quotes for the ticker symbols you hold | US |
| Linear | Bug reports and feature requests you submit | US |
| Umami (self-hosted) | Website analytics and in-app usage statistics | Our server |

## Contact

For privacy requests or questions: **moflowapp@gmail.com**

## Changes

If we change this policy, we'll update the effective date above and, for material changes, show a notice in-app at next launch.
