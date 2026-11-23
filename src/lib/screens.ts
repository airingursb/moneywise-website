import type { ImageMetadata } from 'astro';
import type { Locale } from '../config/site';
import { LOCALE_FALLBACK, SLOTS, type Device, type SlotId } from '../config/screenshots';

// Every image under src/assets/screens is known at build time.
const FILES = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/screens/**/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

function find(template: string, locale: Locale): ImageMetadata | undefined {
  for (const l of LOCALE_FALLBACK[locale]) {
    const key = `/src/assets/screens/${template.replaceAll('{locale}', l)}`;
    if (FILES[key]) return FILES[key].default;
  }
  return undefined;
}

export interface ResolvedScreen {
  device: Device;
  light: ImageMetadata;
  dark?: ImageMetadata;
}

export function resolveScreen(id: SlotId, locale: Locale): ResolvedScreen {
  const slot = SLOTS[id] as { device: Device; src: string; dark?: string };
  if (!slot) throw new Error(`[screens] unknown slot "${id}"`);
  const light = find(slot.src, locale);
  if (!light) {
    throw new Error(`[screens] slot "${id}": no file for "${slot.src}" (locale ${locale}) under src/assets/screens/`);
  }
  const dark = slot.dark ? find(slot.dark, locale) : undefined;
  if (slot.dark && !dark) {
    throw new Error(`[screens] slot "${id}": no dark file for "${slot.dark}" (locale ${locale})`);
  }
  return { device: slot.device, light, dark };
}
