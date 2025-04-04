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
</script>

<Card.Root class="mb-5">
	<Card.Content class="flex items-center justify-between">
		<a href="/">
			<Icon />
		</a>
		<div class="flex items-center gap-4">
			<Select.Root bind:value={$locale} type="single">
				<Select.Trigger class="flex gap-2"
					><img src="/icons/langage.svg" class="w-[13px]" />{$locale == 'fr-FR'
						? 'Français'
						: 'English'}</Select.Trigger
				>
				<Select.Content>
					{#each $locales as locale_item}
						<Select.Item value={locale_item}
							>{locale_item == 'fr-FR' ? 'Français' : 'English'}</Select.Item
						>
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
