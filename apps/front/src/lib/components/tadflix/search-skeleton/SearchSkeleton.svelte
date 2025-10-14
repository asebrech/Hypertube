<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton';
	import { onMount } from 'svelte';

	let totalCount = $state<number>(2); // Default mobile value

	function updateTotalCount() {
		const width = window.innerWidth;
		
		if (width >= 1280) {
			totalCount = 6;
		} else if (width >= 1024) {
			totalCount = 5;
		} else if (width >= 768) {
			totalCount = 4;
		} else if (width >= 640) {
			totalCount = 3;
		} else {
			totalCount = 2;
		}
	}

	onMount(() => {
		updateTotalCount();
		window.addEventListener('resize', updateTotalCount);
		return () => window.removeEventListener('resize', updateTotalCount);
	});
</script>

<div class="
	ml-[10%] w-[80%]
	sm:ml-[10.714%] sm:w-[78.571%]
	md:ml-[8.333%] md:w-[83.333%]
	lg:ml-[6.818%] lg:w-[86.364%]
	xl:ml-[5.769%] xl:w-[88.462%]
">
	<div class="ml-0 flex flex-wrap gap-[0px]" style="row-gap: 5.5vw;">
		{#each Array(totalCount) as _, index}
			<div class="basis-1/2 p-[3px] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
				<Skeleton 
					class="aspect-[5/3] w-full rounded-[2px] animate-skeleton-wave overflow-hidden relative" 
					style="animation-delay: {index * 300}ms;"
				/>
			</div>
		{/each}
	</div>
</div>