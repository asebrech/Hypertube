<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Tadflix from '$lib/assets/tadflix.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '@/utils';
	import { t } from 'svelte-i18n';
	import { _ } from 'svelte-i18n';
	import LanguageSelector from '../LanguageSelector.svelte';

	function isLinkCurrentPage(link: Link): boolean {
		return page.url.pathname === link.href;
	}

	interface Link {
		label: string;
		href: string;
	}

	interface Props {
		data: any;
	}

	let links: Link[] = [
		{ label: 'home', href: '/' },
		{ label: 'shows', href: '/shows' },
		{ label: 'movies', href: '/movies' },
		{ label: 'news-popular', href: '/news' },
		{ label: 'my-list', href: '/my-list' }
	];

	let { data }: Props = $props();
</script>

<div
	class="fixed z-100 flex h-16 w-full items-center justify-between bg-gradient-to-b from-black to-transparent px-8 py-4"
>
	<a href="/">
		<Tadflix size="sm" />
	</a>
	<div class="flex gap-5">
		{#each links as link}
			{@render NavbarLink(link)}
		{/each}
	</div>
	<div class="flex items-center gap-4">
		<LanguageSelector />
		{#if !page.data.user}
			<a href="/login">
				<Button>{$_('sign_in')}</Button>
			</a>
		{/if}
		{#if page.data.user}
			<form action="/logout" method="POST" use:enhance>
				<Button type="submit">{$_('log_out')}</Button>
			</form>
		{/if}
	</div>
</div>

{#snippet NavbarLink(link: Link)}
	<a href={link.href} class={cn(isLinkCurrentPage(link) ? 'font-bold' : '')}>
		{$t(`navbar.${link.label}`)}
	</a>
{/snippet}
