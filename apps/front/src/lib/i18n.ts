import { register, init, getLocaleFromNavigator } from 'svelte-i18n';
import { lang } from '@hypertube/shared';

for (const locale of Object.values(lang)) {
	register(locale.iso_639_1, () => import(`$lib/locales/${locale.iso}.json`));
}

let savedLocale: string | null = null;
if (typeof window !== 'undefined') {
	savedLocale = localStorage.getItem('lang');
}

// Export the initialization promise
export const i18nReady = init({
	fallbackLocale: 'en-GB',
	initialLocale: savedLocale || getLocaleFromNavigator()
});
