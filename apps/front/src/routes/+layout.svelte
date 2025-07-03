<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { isLoading } from 'svelte-i18n';
	import { Loader2 } from 'lucide-svelte';
	import Navbar from '@/components/tadflix/layout/navbar/Navbar.svelte';
	import { page } from '$app/state';
	import { locale } from 'svelte-i18n';
	import { i18nReady } from '$lib/i18n';

	let ready = $state(false);

	// Set initial locale from localStorage before rendering
	if (typeof window !== 'undefined') {
		const savedLang = localStorage.getItem('lang');
		if (savedLang) locale.set(savedLang);
	}

	i18nReady?.then(() => {
		ready = true;
	});
</script>

<ModeWatcher defaultMode={'dark'} />

{#if $isLoading || !ready}
	<Loader2 class="size-4 animate-spin" />
{:else}
	<Navbar data={page.data} />
{/if}

<main class="flex h-full min-h-screen w-full flex-col">
	{#if $isLoading || !ready}
		<Loader2 class="size-4 animate-spin" />
	{:else}
		{@render children?.()}
	{/if}
</main>
