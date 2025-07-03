<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { isLoading } from 'svelte-i18n';
	import { Loader2 } from 'lucide-svelte';
	import Navbar from '@/components/tadflix/layout/navbar/Navbar.svelte';
	import { page } from '$app/state';
</script>

<ModeWatcher defaultMode={'dark'} />

{#if $isLoading}
	<Loader2 class="size-4 animate-spin" />
{:else}
	<Navbar data={page.data} />
{/if}

<main class="flex h-full min-h-screen w-full flex-col pt-16">
	{#if $isLoading}
		<Loader2 class="size-4 animate-spin" />
	{:else}
		{@render children?.()}
	{/if}
</main>
