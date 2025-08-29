<script lang="ts">
	import { isLoading } from 'svelte-i18n';
	import { Loader2 } from 'lucide-svelte';
	import { i18nReady } from '$lib/i18n';
	
	let { children } = $props();
	
	let ready = $state(false);

	i18nReady?.then(() => {
		ready = true;
	});
</script>

<div class="min-h-screen bg-cover bg-center bg-no-repeat relative" style="background-image: url('/img/netflix-background.jpg');">
	<div class="absolute inset-0 bg-black/50"></div>
	<div class="relative z-10 flex flex-1 items-center justify-center min-h-screen">
		{#if $isLoading || !ready}
			<div class="flex items-center justify-center">
				<Loader2 class="size-8 animate-spin text-white" />
			</div>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
