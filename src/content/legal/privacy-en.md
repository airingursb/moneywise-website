---
title: Privacy Policy
effective: 2026-04-18
---

# Privacy Policy

**Effective date:** 2026-04-18

This policy explains what MoneyWise does with your data.

## Summary (TL;DR)

- All your financial records are stored **on your device** in an encrypted local database.
- We collect **no analytics about you personally** on the app itself — no crash reporters, no tracking SDKs.
- If you turn on **cloud sync**, your data is encrypted before leaving your device. We store the encrypted rows on Supabase and cannot read them.
- If you use the **AI advisor** with your own API key, requests go directly from your device to the AI provider. We do not route, log, or relay those requests.
- On this website (`moneywise.airingdeng.com`), we use **Umami** for privacy-friendly, cookieless page view analytics. No IP addresses or identifiers are stored.

## What MoneyWise collects

**On your device** (never transmitted unless you enable sync):
- Your accounts, balances, transactions, budgets, and investment holdings.
- Receipt images you choose to attach.
- Your AI provider API key (stored in the iOS keychain).

**When cloud sync is enabled** (Pro subscribers):
- Encrypted rows of the above, stored on Supabase servers we operate. The encryption key stays on your device.
- Your Supabase account email (used only for login).
- Device identifiers needed to distinguish your phones from each other during sync.

**When you use Pro's pooled AI credits** (future feature, not in v1):
- Your prompts and the advisor's responses will be routed through our Supabase Edge Function. Logs are kept for 7 days for abuse prevention, then deleted.

**On this website:**
- Umami records: page viewed, referrer, country (coarse), browser / OS (coarse), screen size. Nothing that identifies you personally.
- No cookies. No tracking pixels. No ad networks.

## What MoneyWise does **not** collect

- We do not collect your exact location.
- We do not share, sell, or rent data to third parties.
- We do not run advertising.
- We do not read your financial records. With cloud sync, the data is encrypted; we see only opaque bytes.

## Your controls

- **Export**: In-app, you can export all records to CSV.
- **Delete**: Uninstalling the app removes all local data. If you had cloud sync enabled, send us a deletion request at the contact below.
- **Stop sync**: Disable cloud sync in Settings; we delete your encrypted rows from our servers within 30 days.

## Third parties

| Service | Purpose | Where |
|---|---|---|
| Supabase | Cloud sync backend, Auth | eu-west (Ireland) |
| Apple | App Store, in-app purchase, iCloud Keychain | Apple |
| Your chosen AI provider (Anthropic, OpenAI) | AI advisor requests routed directly from your device using your key | US |
| Umami (self-hosted) | Anonymous website analytics | Our server |

## Contact

For privacy requests or questions: **moflowapp@gmail.com**

## Changes

If we change this policy, we'll update the effective date above and, for material changes, show a notice in-app at next launch.
