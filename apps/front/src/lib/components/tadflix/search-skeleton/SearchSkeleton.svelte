<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton';

	let { count = 18 }: { count?: number } = $props();
</script>

<div class="
	ml-[10%] w-[80%]
	sm:ml-[10.714%] sm:w-[78.571%]
	md:ml-[8.333%] md:w-[83.333%]
	lg:ml-[6.818%] lg:w-[86.364%]
	xl:ml-[5.769%] xl:w-[88.462%]
">
	<div class="ml-0 flex flex-wrap gap-[0px]" style="row-gap: 5.5vw;">
		{#each Array(count) as _}
			<div class="basis-1/2 p-[3px] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
				<Skeleton class="aspect-[5/3] w-full rounded-[2px]" />
			</div>
		{/each}
	</div>
</div>