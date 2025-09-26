import { register, init, getLocaleFromNavigator, waitLocale } from 'svelte-i18n';
import { lang } from '@hypertube/shared';

for (const locale of Object.values(lang)) {
	register(locale.iso_639_1, () => import(`$lib/locales/${locale.iso}.json`));
}

let savedLocale: string | null = null;
if (typeof window !== 'undefined') {
	savedLocale = localStorage.getItem('lang');
}

const targetLocale = savedLocale || getLocaleFromNavigator() || 'en-GB';

// Initialize and wait for the locale to be loaded
init({
	fallbackLocale: 'en-GB',
	initialLocale: targetLocale
});

// Export the initialization promise that waits for the locale to be fully loaded
export const i18nReady = waitLocale(targetLocale);
