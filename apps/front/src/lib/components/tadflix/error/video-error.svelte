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
	let accordionOpen = $state(false);
	
	onMount(() => {
		mounted = true;
	});
</script>

<div class="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
	<div class="text-center max-w-md">
		<!-- Animated Error Icon -->
		<div class="mb-8">
			<div class="text-red-600 text-8xl font-bold {mounted ? 'animate-bounce' : ''}">!</div>
		</div>
		
		<!-- Error Title -->
		<h1 class="text-3xl font-bold text-red-600 mb-6">{title}</h1>
		
		<!-- Error Message -->
		<div class="mb-8 w-full">
			<button 
				onclick={() => accordionOpen = !accordionOpen}
				class="text-zinc-400 hover:text-white text-sm underline transition-colors duration-200"
			>
				{accordionOpen ? $_('video-player.hide-details') : $_('video-player.show-details')}
			</button>
			
			{#if accordionOpen}
				<div class="mt-4 p-4 bg-zinc-900/50 rounded text-left border-l-4 border-red-600 transition-all duration-300 ease-in-out">
					<p class="text-zinc-300 text-sm break-words">{message}</p>
				</div>
			{/if}
		</div>
		
		<!-- Go Home Button -->
		{#if showGoHome}
			<button 
				onclick={onGoHome}
				class="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105"
			>
				{$_('video-player.back-to-home')}
			</button>
		{/if}
	</div>
</div>
