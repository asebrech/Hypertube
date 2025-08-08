<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		size?: 'sm' | 'md' | 'lg';
	}
	
	let { size = 'md' }: Props = $props();
	
	let mounted = $state(false);
	
	const sizeClasses = {
		sm: 'h-8 w-8',
		md: 'h-12 w-12', 
		lg: 'h-16 w-16'
	};
	
	onMount(() => {
		mounted = true;
	});
</script>

<div class="flex items-center justify-center">
	<div class="relative">
		<div class="{sizeClasses[size]} rounded-full border-2 border-zinc-700"></div>
		<div 
			class="absolute inset-0 {sizeClasses[size]} rounded-full border-2 border-transparent border-t-red-600 {mounted ? 'animate-spin' : ''}"
		></div>
	</div>
</div>
