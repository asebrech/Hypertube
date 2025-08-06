<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	
	interface Props {
		title?: string;
		message: string;
		showGoHome?: boolean;
		onGoHome?: () => void;
	}
	
	let { 
		title = $_('video-player.error-title'), 
		message,
		showGoHome = true,
		onGoHome = () => window.location.href = '/'
	}: Props = $props();
	
	let mounted = $state(false);
	
	onMount(() => {
		mounted = true;
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-black">
	<div class="flex flex-col items-center space-y-8 text-center">
		<div class="relative">
			<div class="text-8xl font-bold text-zinc-800">!</div>
			<div 
				class="absolute inset-0 text-8xl font-bold text-red-600 {mounted ? 'animate-pulse' : ''}"
			>
				!
			</div>
		</div>
		
		<div class="space-y-4">
			<h1 class="text-3xl font-bold text-white">
				{title}
			</h1>
			<p class="max-w-md text-lg text-zinc-400">
				{message}
			</p>
		</div>
		
		{#if showGoHome}
			<button
				class="rounded bg-red-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-red-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
				onclick={onGoHome}
			>
				{$_('video-player.back-to-home')}
			</button>
		{/if}
	</div>
</div>
