import { useSyncExternalStore } from 'react';

import type { Locale } from '../i18n/index.js';
import { getLocale, setLocale, subscribe, t } from '../i18n/index.js';

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getLocale);
  return { locale, setLocale, t };
}

export { setLocale, t };
export type { Locale };
