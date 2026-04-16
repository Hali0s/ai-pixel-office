import { en } from './en.js';
import { ru } from './ru.js';

export type Locale = 'en' | 'ru';

export const locales: Record<Locale, typeof en> = { en, ru };

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};

const STORAGE_KEY = 'ai-pixel-office-locale';

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    // ignore
  }
  return 'ru';
}

let currentLocale: Locale = getStoredLocale();
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key: keyof typeof en, vars?: Record<string, string>): string {
  let str = locales[currentLocale][key] ?? en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}
