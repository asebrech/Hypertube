import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

register('en-GB', () => import('$lib/locales/en.json'));
register('fr-FR', () => import('$lib/locales/fr.json'));

init({
    fallbackLocale: 'en-GB',
    initialLocale: getLocaleFromNavigator(),
});