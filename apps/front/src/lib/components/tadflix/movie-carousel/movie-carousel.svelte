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
	import { Badge } from '@/components/ui/badge';

	import { getBackdropImage, getMovieDetails } from '@/services/api';
	import type { BackDropImage, MovieDetails, MovieGenre } from '@hypertube/shared';
	import type { Action } from 'svelte/action';

	import { writable } from 'svelte/store';
	import { MovieCard } from '$lib/components/tadflix/movie-card.svelte';

	export const visibleSlides = writable<number[]>([]);
	function handleVisibility(index: number, visible: boolean) {
		if (visible) visibleSlides.update((visibleSlides) => [...visibleSlides, index]);
	}

	// Props
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

	const loadMovieDetails = async (movieId: number): Promise<MovieDetails> => {
		const movieDetailsResponse = await getMovieDetails(movieId);
		return movieDetailsResponse;
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
	class="w-[calc(100% + 160px)] ml-[-160px]"
>
	<CarouselContent class="ml-0 flex gap-[6px]">
		{#each genre.movies as movie, index}
			<CarouselItem class="basis-auto p-0">
				<div use:inView={(visible) => handleVisibility(index, visible)}>
					<HoverCard openDelay={100} closeDelay={100}>
						<HoverCardTrigger href="/movie/{movie.id}" target="_blank" rel="noreferrer noopener">
							{#if movie.backdrop_image}
								<Card
									class="jystify-end flex h-[123px] w-[218px] flex-row rounded-[2px] border-none p-0"
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
									<Card class="flex h-[123px] w-[218px] flex-row rounded-[2px] border-none p-0">
										<div class="h-full w-full">
											<Skeleton class="h-full w-full rounded-[2px]" />
										</div>
									</Card>
								{:then updatedBackdropImage}
									<Card
										class="jystify-end flex h-[123px] w-[218px] flex-row rounded-[2px] border-none p-0"
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
								<Card class="flex h-[123px] w-[218px] flex-row rounded-[2px] border-none p-0">
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
	<CarouselPrevious class="left-[160px] h-[123px] w-[58px] rounded-[0] border-none opacity-75" />
	<CarouselNext class="right-0 h-[123px] w-[58px] rounded-[0] border-none opacity-75" />
</Carousel>
