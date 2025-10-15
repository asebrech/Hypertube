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

	if (typeof window !== 'undefined') {
		const savedLang = localStorage.getItem('lang');
		if (savedLang) locale.set(savedLang);
	}

	i18nReady?.then(() => {
		ready = true;
	});

	let isMoviePlayerRoute = $derived(page.route?.id?.includes('/movie/') ?? false);
	let isAuthRoute = $derived(page.route?.id?.includes('/(auth)/') ?? false);
</script>

<ModeWatcher defaultMode={'dark'} />

{#if !isMoviePlayerRoute && !isAuthRoute}
	<Navbar data={page.data} showSkeleton={$isLoading || !ready} />
{/if}

<main class="flex h-full min-h-screen w-full flex-col bg-[#141414]">
	{#if $isLoading || !ready}
		<div class="mt-20 flex w-full">
			<Loader2 class="mx-auto h-8 w-8 animate-spin text-red-500" />
		</div>
	{:else}
		{@render children?.()}
	{/if}
</main>
