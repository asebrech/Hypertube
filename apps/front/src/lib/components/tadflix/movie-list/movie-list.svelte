<script lang="ts">
	import {
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselPrevious,
		CarouselNext
	} from '@/components/ui/carousel';
	import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
	import type { Movie } from '@hypertube/shared';
	import type { Action } from 'svelte/action';
	import { MoviePreview } from '@/components/tadflix/movie-preview';
	import { MovieCard } from '@/components/tadflix/movie-card';
	import { TopTenCard } from '@/components/tadflix/top-ten-card';

	let visibleSlides = $state<number[]>([]);
	let loadedSlides = $state<number[]>([]);

	function handleVisibility(index: number, visible: boolean) {
		loadedSlides = [...loadedSlides, index];
		visibleSlides = visible
			? visibleSlides.includes(index)
				? visibleSlides
				: [...visibleSlides, index]
			: [...visibleSlides.filter((idx) => idx !== index)];
	}

	let { movies, variant = 'default' }: { movies: Movie[]; variant?: 'default' | 'top-ten' } =
		$props();

	function computeAlign(index: number) {
		if (index === 0) return 'start';
		if (index === movies.length - 1) return 'end';
		return 'center';
	}
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
				<HoverCard openDelay={100} closeDelay={100}>
					<HoverCardTrigger>
						{#if variant === 'top-ten'}
							<TopTenCard
								movie_id={movie.id}
								isVisible={true}
								title={movie.title}
								orderNumber={index || 10}
								type={movie.media_type}
							/>
						{:else}
							<MovieCard
								movieId={movie.id}
								isVisible={true}
								title={movie.title}
								type={movie?.media_type}
							/>
						{/if}
					</HoverCardTrigger>
					<HoverCardContent
						hideWhenDetached={true}
						collisionPadding={0}
						avoidCollisions={false}
						align={computeAlign(index)}
						side="bottom"
						sideOffset={-200}
						class="m-0 w-[300px] overflow-hidden rounded-[8px] border-none p-0"
					>
						<MoviePreview movieId={movie.id} type={movie.media_type} />
					</HoverCardContent>
				</HoverCard>
			</div>
		{/each}
	</div>
</div>
