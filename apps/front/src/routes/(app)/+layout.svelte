<script lang="ts">
	let { children } = $props();
	import { page } from '$app/stores';

	import { enhance } from '$app/forms';
	import Icon from '$lib/assets/tadflix.svelte';

	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { locale, locales } from 'svelte-i18n';
	import { _ } from 'svelte-i18n';
	import { tick } from 'svelte';

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
			default:
				return lang;
		}
	};
</script>

<Card.Root class="mb-5">
	<Card.Content class="flex items-center justify-between">
		<a href="/">
			<Icon />
		</a>
		<div class="flex items-center gap-4">
			<Select.Root bind:value={$locale} type="single">
				<Select.Trigger class="flex gap-2"
					><img src="/icons/langage.svg" class="w-[13px]" alt="language" />{getLangName(
						$locale
					)}</Select.Trigger
				>
				<Select.Content>
					{#each $locales as locale_item}
						<Select.Item value={locale_item}>{getLangName(locale_item)}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if !$page.data.user}
				<a href="/login">
					<Button>{$_('sign_in')}</Button>
				</a>
			{/if}

			{#if $page.data.user}
				<form action="/logout" method="POST" use:enhance>
					<Button type="submit">{$_('log_out')}</Button>
				</form>
			{/if}
		</div>
	</Card.Content>
</Card.Root>

{@render children?.()}
