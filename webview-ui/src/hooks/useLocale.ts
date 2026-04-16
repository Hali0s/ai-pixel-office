import { useSyncExternalStore } from 'react';

import { getLocale, setLocale, subscribe, t } from '../i18n/index.js';
import type { Locale } from '../i18n/index.js';

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getLocale);
  return { locale, setLocale, t };
}

export { t, setLocale };
export type { Locale };
