<script lang="ts">
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import {
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselPrevious,
		CarouselNext
	} from '@/components/ui/carousel';
	import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
	import { Skeleton } from '@/components/ui/skeleton';

	import { getBackdropImage } from '@/services/api';
	import type { BackDropImage, MovieGenre } from '@hypertube/shared';
	import type { Action } from 'svelte/action';

	import { writable } from 'svelte/store';
	import { MovieCard } from '$lib/components/tadflix/movie-card.svelte';

	export const visibleSlides = writable<number[]>([]);
	function handleVisibility(index: number, visible: boolean) {
		if (visible) visibleSlides.update((visibleSlides) => [...visibleSlides, index]);
	}

	export let movies_genres: MovieGenre[] = [];
	export let genre: MovieGenre;

	const loadBackdropImage = async (movieId: any, size: string): Promise<BackDropImage> => {
		const backdrop_image_data = await getBackdropImage(movieId, size);
		if (backdrop_image_data)
			movies_genres.forEach((genre) => {
				genre.movies.forEach((movie) => {
					if (movie.id === movieId) {
						movie.backdrop_image = backdrop_image_data;
					}
				});
			});
		return backdrop_image_data;
	};

	export const inView: Action<HTMLElement, (visible: boolean) => void> = (node, callback) => {
		const observer = new IntersectionObserver(([entry]) => {
			callback(entry.isIntersecting);
		});

		observer.observe(node);

		return {
			destroy() {
				observer.unobserve(node);
			}
		};
	};
</script>

<Carousel
	opts={{
		align: 'start',
		loop: true,
		slidesToScroll: 2,
		startIndex: 0,
		breakpoints: {
			// Tailwind's breakpoints in pixels
			'(min-width: 640px)': { slidesToScroll: 3 }, // sm
			'(min-width: 768px)': { slidesToScroll: 4 }, // md
			'(min-width: 1024px)': { slidesToScroll: 5 }, // lg
			'(min-width: 1280px)': { slidesToScroll: 6 } // xl
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
		{#each genre.movies as movie, index}
			<CarouselItem class="lg:basis-1/7 xl:basis-1/8 basis-1/4 p-[3px] sm:basis-1/5 md:basis-1/6">
				<div use:inView={(visible) => handleVisibility(index, visible)}>
					<HoverCard openDelay={100} closeDelay={100}>
						<HoverCardTrigger href="/movie/{movie.id}" target="_blank" rel="noreferrer noopener">
							{#if movie.backdrop_image}
								<Card
									class="jystify-end flex aspect-[5/3] flex-row rounded-[2px] border-none p-0"
									style="background-size: cover; background-position: center; background-image: url({movie
										.backdrop_image.url});"
								>
									{#if !movie.backdrop_image.langFound}
										<CardHeader class="bg-black bg-opacity-50 p-4">
											<CardTitle>{movie.title}</CardTitle>
										</CardHeader>
									{/if}
								</Card>
							{:else if $visibleSlides.includes(index)}
								{#await loadBackdropImage(movie.id, 'small')}
									<Card class="flex aspect-[5/3] flex-row rounded-[2px] border-none p-0">
										<div class="h-full w-full">
											<Skeleton class="h-full w-full rounded-[2px]" />
										</div>
									</Card>
								{:then updatedBackdropImage}
									<Card
										class="jystify-end flex aspect-[5/3] flex-row rounded-[2px] border-none p-0"
										style="background-size: cover; background-position: center; background-image: url({updatedBackdropImage?.url});"
									>
										{#if !updatedBackdropImage?.langFound}
											<CardHeader class="bg-black bg-opacity-50 p-4">
												<CardTitle>{movie.title}</CardTitle>
											</CardHeader>
										{/if}
									</Card>
								{/await}
							{:else}
								<Card class="flex aspect-[5/3] flex-row rounded-[2px] border-none p-0">
									<div class="h-full w-full">
										<Skeleton class="h-full w-full rounded-[2px]" />
									</div>
								</Card>
							{/if}
						</HoverCardTrigger>
						<HoverCardContent
							hideWhenDetached={true}
							avoidCollisions={false}
							side="bottom"
							sideOffset={-231}
							class="mt-0 w-[300px] overflow-hidden rounded-[8px] border-none p-0"
						>
							<MovieCard {movie} />
						</HoverCardContent>
					</HoverCard>
				</div>
			</CarouselItem>
		{/each}
	</CarouselContent>
	<CarouselPrevious
		class="left-[calc(75%/4)] h-[100%]
			w-[calc(100%/16)] 
			rounded-[0]
			border-none
			p-[3px]
			opacity-75 
			sm:left-[calc(75%/5)]
			sm:w-[calc(100%/20)]
			md:left-[calc(75%/6)]
			md:w-[calc(100%/24)]
			lg:left-[calc(75%/7)]
			lg:w-[calc(100%/28)]
			xl:left-[75%/8]
			xl:w-[calc(100%/32)]"
	/>
	<CarouselNext
		class="right-[calc(75%/4)] h-[100%]
			w-[calc(100%/16)] 
			rounded-[0]
			border-none
			p-[3px]
			opacity-75 
			sm:right-[calc(75%/5)]
			sm:w-[calc(100%/20)]
			md:right-[calc(75%/6)]
			md:w-[calc(100%/24)]
			lg:right-[calc(75%/7)]
			lg:w-[calc(100%/28)]
			xl:right-[75%/8]
			xl:w-[calc(100%/32)]"
	/>
</Carousel>
