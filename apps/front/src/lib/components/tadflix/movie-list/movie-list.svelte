<script lang="ts">
	import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
	import type { Movie } from '@hypertube/shared';
	import { MoviePreview } from '@/components/tadflix/movie-preview';
	import { MovieCard } from '@/components/tadflix/movie-card';
	import { onMount } from 'svelte';
	import { openHoverCardId } from '@/services/store';
	import { get } from 'svelte/store';

	let {
		movies,
		data,
	}: {
		movies: Movie[];
		data: any
	} = $props();

	let itemsPerRow: number = $state(2);

	function updateItemsPerRow() {
		const width = window.innerWidth;
		if (width >= 1280) itemsPerRow = 6;
		else if (width >= 1024) itemsPerRow = 5;
		else if (width >= 768) itemsPerRow = 4;
		else if (width >= 640) itemsPerRow = 3;
		else itemsPerRow = 2;
	}

	onMount(() => {
		updateItemsPerRow();
		window.addEventListener('resize', updateItemsPerRow);
		return () => window.removeEventListener('resize', updateItemsPerRow);
	});

	function computeAlign(index: number) {
		const posInRow = index % itemsPerRow;
		if (posInRow === 0) return 'start';
		if (posInRow === itemsPerRow - 1) return 'end';
		return 'center';
	}

	let triggerWrapper = $state<HTMLElement | null>(null);
	let triggerHeight = $state<number>(10);
	let triggerWidth = $state<number>(10);

	function updateWidthandHeight() {
		if (triggerWrapper) {
			triggerWidth = triggerWrapper.clientWidth;
			triggerHeight = triggerWrapper.clientHeight;
		}
	}
	async function handleMouseEnter(id: string) {
		openHoverCardId.set(id);
	}
	function handleMouseLeave(id: string) {
		if (get(openHoverCardId) === id) openHoverCardId.set(null);
	}

	onMount(() => {
		updateWidthandHeight();
		window.addEventListener('resize', updateWidthandHeight);
		return () => window.removeEventListener('resize', updateWidthandHeight);
	});
</script>

<div
	class="
		ml-[10%] w-[80%]
		sm:ml-[10.714%] sm:w-[78.571%]
		md:ml-[8.333%] md:w-[83.333%]
		lg:ml-[6.818%] lg:w-[86.364%]
		xl:ml-[5.769%] xl:w-[88.462%]
	"
>
	<div class="ml-0 flex flex-wrap gap-[0px]" style="row-gap: 5.5vw;">
		{#each movies as movie, index}
			<div class="basis-1/2 p-[3px] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
				<div bind:this={triggerWrapper} class="w-full">
					<HoverCard openDelay={100} closeDelay={100}>
						<HoverCardTrigger>
							<div
								role="button"
								tabindex="0"
								onmouseenter={async () => await handleMouseEnter(String(movie.id))}
							>
								<MovieCard
									movieId={movie.id}
									isVisible={true}
									title={movie.title}
									type={movie?.media_type}
									data={data}
								/>
							</div>
						</HoverCardTrigger>
						<HoverCardContent
							hideWhenDetached={true}
							collisionPadding={0}
							avoidCollisions={false}
							align={computeAlign(index)}
							side="bottom"
							sideOffset={triggerWrapper ? -triggerHeight - 40 : 0}
							class="m-0 w-full overflow-hidden rounded-[8px] border-none p-0"
						>
							<div
								role="button"
								tabindex="0"
								onmouseleave={() => handleMouseLeave(String(movie.id))}
								class={get(openHoverCardId) === null || get(openHoverCardId) === String(movie.id)
									? ''
									: 'hidden'}
							>
								<div style="width: {triggerWidth * 1.5}px;">
									<MoviePreview movieId={movie.id} type={movie.media_type} data={data} />
								</div>
							</div>
						</HoverCardContent>
					</HoverCard>
				</div>
			</div>
		{/each}
	</div>
</div>
