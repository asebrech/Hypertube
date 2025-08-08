<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		message?: string;
	}

	let { message = 'Loading...' }: Props = $props();

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-black">
	<div class="flex flex-col items-center space-y-6">
		<div class="relative">
			<div class="h-16 w-16 rounded-full border-4 border-zinc-800"></div>
			<div
				class="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-red-600 {mounted
					? 'animate-spin'
					: ''}"
			></div>
		</div>

		<p class="text-xl font-medium text-white">
			{message}
		</p>
	</div>
</div>
