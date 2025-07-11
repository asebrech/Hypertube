import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

register('en-GB', () => import('$lib/locales/en.json'));
register('fr-FR', () => import('$lib/locales/fr.json'));
register('zh-CN', () => import('$lib/locales/zh.json'));

let savedLocale: string | null = null;
if (typeof window !== 'undefined') {
	savedLocale = localStorage.getItem('lang');
}

// Export the initialization promise
export const i18nReady = init({
	fallbackLocale: 'en-GB',
	initialLocale: savedLocale || getLocaleFromNavigator()
});
