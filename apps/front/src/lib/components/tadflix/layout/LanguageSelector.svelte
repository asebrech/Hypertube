<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { tick } from 'svelte';
	import { locale, locales } from 'svelte-i18n';
	import { _ } from 'svelte-i18n';
	import { isLoading } from 'svelte-i18n';

	let previousLocale = $locale;

	$effect(() => {
		if ($locale !== previousLocale) {
			previousLocale = $locale;
			// Persist the new language
			localStorage.setItem('lang', $locale ?? 'en-GB');
			// Wait for DOM to update, then reload the page
			tick().then(() => {
				location.reload();
			});
		}
	});

	const getLangName = (lang: string | null | undefined) => {
		switch (lang) {
			case 'fr-FR':
				return 'Français';
			case 'en-GB':
				return 'English';
			case 'zh-CN':
				return '简体中文';
			case 'es-ES':
				return 'Español';
			case 'ar-SA':
				return 'العربية';
			default:
				return lang;
		}
	};

	let language = $derived(getLangName($locale));
</script>

{#if $isLoading}{:else}
	<Select.Root bind:value={$locale!} type="single">
		<Select.Trigger class="bg-secondary/20 flex gap-2"
			><img src="/icons/langage.svg" class="w-[13px]" alt="language" />{language}</Select.Trigger
		>
		<Select.Content>
			{#each $locales as locale_item}
				<Select.Item value={locale_item}>{getLangName(locale_item)}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
{/if}
