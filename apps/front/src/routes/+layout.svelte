<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { isLoading } from 'svelte-i18n';
</script>

<ModeWatcher defaultMode={'dark'} />
{#if $isLoading}
	Please wait...
{:else}
	{@render children?.()}
{/if}
