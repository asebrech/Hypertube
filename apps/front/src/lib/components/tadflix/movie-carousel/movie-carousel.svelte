<script lang="ts">
	import {
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselPrevious,
		CarouselNext
	} from '@/components/ui/carousel';
	import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
	import type { MovieGenre, MovieType } from '@hypertube/shared';
	import type { Action } from 'svelte/action';
	import { MoviePreview } from '@/components/tadflix/movie-preview';
	import { MovieCard } from '@/components/tadflix/movie-card';
	import { TopTenCard } from '@/components/tadflix/top-ten-card';
	import { openHoverCardId } from '@/services/store';
	import { get } from 'svelte/store';

	let {
		movies,
		genreId,
		variant = 'default',
		type = 'movie'
	}: {
		movies: MovieGenre['movies'];
		genreId: number;
		variant?: 'default' | 'top-ten';
		type: MovieType;
	} = $props();

	let visibleSlides = $state<number[]>([]);
	let loadedSlides = $state<number[]>([]);

	async function handleMouseEnter(id: string) {
		openHoverCardId.set(String(genreId) + id);
	}

	function handleMouseLeave(id: string) {
		if (get(openHoverCardId) === String(genreId) + id) openHoverCardId.set(null);
	}

	function handleVisibility(index: number, visible: boolean) {
		loadedSlides = [...loadedSlides, index];
		visibleSlides = visible
			? visibleSlides.includes(index)
				? visibleSlides
				: [...visibleSlides, index]
			: [...visibleSlides.filter((idx) => idx !== index)];
	}

	export const inView: Action<HTMLElement, (visible: boolean) => void> = (node, callback) => {
		const observer = new IntersectionObserver(([entry]) => {
			callback(entry.isIntersecting);
		});
		observer.observe(node);
		return { destroy: () => observer.unobserve(node) };
	};

	function computeAlign(index: number, visible: number[]) {
		const sorted = [...visible].sort((a, b) => a - b);
		while (true) {
			if (sorted[0] + 1 === sorted[1]) sorted.push(sorted.shift()!);
			else {
				sorted.push(sorted.shift()!);
				break;
			}
		}
		const first = sorted[1];
		const last = sorted[sorted.length - 2];
		if (index === first) return 'start';
		if (index === last) return 'end';
		return 'center';
	}
</script>

<div>
	<Carousel
		opts={{
			align: 'start',
			loop: true,
			slidesToScroll: 2,
			startIndex: 0,
			breakpoints: {
				'(min-width: 640px)': { slidesToScroll: 3 },
				'(min-width: 768px)': { slidesToScroll: 4 },
				'(min-width: 1024px)': { slidesToScroll: 5 },
				'(min-width: 1280px)': { slidesToScroll: 6 }
			}
		}}
		class="
		ml-[-30%] w-[160%]
		sm:ml-[-21.429%] sm:w-[142.857%]
		md:ml-[-16.667%] md:w-[133.333%]
		lg:ml-[-13.636%] lg:w-[127.273%]
		xl:ml-[-11.538%] xl:w-[123.077%]
	"
	>
		<CarouselContent class="ml-0 flex gap-[0px]">
			{#each movies as movie, index}
				<CarouselItem class="lg:basis-1/7 xl:basis-1/8 basis-1/4 p-[4px] sm:basis-1/5 md:basis-1/6">
					<div use:inView={(visible) => handleVisibility(index, visible)}>
						<HoverCard open={$openHoverCardId === String(genreId) + String(movie.id)}>
							<HoverCardTrigger>
								<div
									role="button"
									tabindex="0"
									onmouseenter={async () => await handleMouseEnter(String(movie.id))}
								>
									{#if variant === 'top-ten'}
										<TopTenCard
											movie_id={movie.id}
											isVisible={visibleSlides.includes(index)}
											title={movie.title}
											orderNumber={index ? index : 10}
											{type}
										/>
									{:else}
										<MovieCard
											movieId={movie.id}
											isVisible={visibleSlides.includes(index)}
											title={movie.title}
											{type}
										/>
									{/if}
								</div>
							</HoverCardTrigger>
							<HoverCardContent
								hideWhenDetached={true}
								collisionPadding={0}
								avoidCollisions={false}
								align={computeAlign(index, visibleSlides)}
								side="bottom"
								sideOffset={-200}
								class="m-0 w-[300px] overflow-hidden rounded-[8px] border-none p-0"
							>
								<div
									role="button"
									tabindex="0"
									onmouseleave={() => handleMouseLeave(String(movie.id))}
									class={get(openHoverCardId) === null ||
									get(openHoverCardId) === String(genreId) + String(movie.id)
										? ''
										: 'hidden'}
								>
									<MoviePreview movieId={movie.id} {type} />
								</div>
							</HoverCardContent>
						</HoverCard>
					</div>
				</CarouselItem>
			{/each}
		</CarouselContent>

		<CarouselPrevious
			class="
		left-[calc(75%/4)]
			h-[calc(100%-6px)]
			w-[calc(-3px+100%/16)]
			rounded-l-none
			rounded-r-[2px]
			border-none
			opacity-75 
			sm:left-[calc(75%/5)]
			sm:w-[calc(-3px+100%/20)]
			md:left-[calc(75%/6)]
			md:w-[calc(-3px+100%/24)]
			lg:left-[calc(75%/7)]
			lg:w-[calc(-3px+100%/28)]
			xl:left-[calc(75%/8)]
			xl:w-[calc(-3px+100%/32)]"
		/>
		<CarouselNext
			class="right-[calc(75%/4)]
		h-[calc(100%-6px)]
			w-[calc(-3px+100%/16)]
			rounded-l-[2px]
			rounded-r-none
			border-none
			opacity-75 
			sm:right-[calc(75%/5)]
			sm:w-[calc(-3px+100%/20)]
			md:right-[calc(75%/6)]
			md:w-[calc(-3px+100%/24)]
			lg:right-[calc(75%/7)]
			lg:w-[calc(-3px+100%/28)]
			xl:right-[calc(75%/8)]
			xl:w-[calc(-3px+100%/32)]"
		/>
	</Carousel>
</div>
