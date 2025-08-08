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
		onGoHome = () => (window.location.href = '/')
	}: Props = $props();

	let mounted = $state(false);
	let accordionOpen = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-black p-8 text-white">
	<div class="max-w-md text-center">
		<div class="mb-8">
			<div class="text-8xl font-bold text-red-600 {mounted ? 'animate-bounce' : ''}">!</div>
		</div>

		<h1 class="mb-6 text-3xl font-bold text-red-600">{title}</h1>

		<div class="mb-8 w-full">
			<button
				onclick={() => (accordionOpen = !accordionOpen)}
				class="text-sm text-zinc-400 underline transition-colors duration-200 hover:text-white"
			>
				{accordionOpen ? $_('video-player.hide-details') : $_('video-player.show-details')}
			</button>

			{#if accordionOpen}
				<div
					class="mt-4 rounded border-l-4 border-red-600 bg-zinc-900/50 p-4 text-left transition-all duration-300 ease-in-out"
				>
					<p class="text-sm break-words text-zinc-300">{message}</p>
				</div>
			{/if}
		</div>

		{#if showGoHome}
			<button
				onclick={onGoHome}
				class="transform rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition-colors duration-200 hover:scale-105 hover:bg-red-700"
			>
				{$_('video-player.back-to-home')}
			</button>
		{/if}
	</div>
</div>
