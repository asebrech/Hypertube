<script lang="ts">
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import {
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselPrevious,
		CarouselNext
	} from '@/components/ui/carousel';
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { PUBLIC_BACK_URL } from '$env/static/public';
	import { locale } from 'svelte-i18n';
	import { Skeleton } from '@/components/ui/skeleton';
	import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
	import { Badge } from '$lib/components/ui/badge/index.js';

	type BackDropImage = {
		url: string;
		langFound: boolean;
	};

	type MovieGenre = {
		id: number;
		name: string;
		movies: {
			id: number;
			title: string;
			overview: string;
			poster_path: string;
			release_date: string;
			vote_average: number;
			backdrop_image: BackDropImage | null | undefined;
		}[];
	};

	type MovieDetails = {
		adult: boolean;
		backdrop_path: string | null;
		belongs_to_collection?: {
			id: number;
			name: string;
			poster_path: string | null;
			backdrop_path: string | null;
		};
		budget: number;
		genres: {
			id: number;
			name: string;
		}[];
		homepage: string | null;
		id: number;
		imdb_id: string | null;
		origin_country: string[];
		original_language: string;
		original_title: string;
		overview: string;
		popularity: number;
		poster_path: string | null;
		production_companies: {
			id: number;
			logo_path: string | null;
			name: string;
			origin_country: string;
		}[];
		production_countries: {
			iso_3166_1: string;
			name: string;
		}[];
		release_date: string;
		revenue: number;
		runtime: number | null;
		spoken_languages: {
			english_name: string;
			iso_639_1: string;
			name: string;
		}[];
		status: string;
		tagline: string;
		title: string;
		video: boolean;
		vote_average: number;
		vote_count: number;
	};

	export let hasMorePages: boolean;
	export let currentPage: number = 1;
	export let isLoading: boolean;
	export let isLoadingDetails: boolean;
	export let movies_genres: MovieGenre[] = [];
	export let movieDetails: MovieDetails[];

	const getMovies = async (page_to_load: number) => {
		const config = {
			method: 'get',
			url: `${PUBLIC_BACK_URL}/movies`,
			params: {
				page: page_to_load,
				lang: $locale
			}
		};
		try {
			const response = await axios(config);
			console.log('response', response.data);
			return response.data;
		} catch (error) {
			console.error('Error fetching movies:', error);
			throw error;
		}
	};

	const getMovieDetails = async (movieId: number) => {
		const config = {
			method: 'get',
			url: `${PUBLIC_BACK_URL}/movies/${movieId}`,
			params: {
				lang: $locale
			}
		};
		try {
			const response = await axios(config);
			return response.data;
		} catch (error) {
			console.error('Error fetching movie details:', error);
			throw error;
		}
	};

	const getBackdropImage = async (movieId: any, size: string) => {
		const config = {
			method: 'get',
			url: `${PUBLIC_BACK_URL}/movies/backdropImage`,
			params: {
				tmdb_movie_id: movieId,
				size: size,
				lang: $locale
			}
		};
		try {
			const response = await axios(config);
			return response.data;
		} catch (error) {
			console.error('Error fetching movies:', error);
			throw error;
		}
	};

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

	const loadMoviePage = async (page: number) => {
		try {
			isLoading = true;
			const getMovieResponse = await getMovies(page);
			movies_genres = movies_genres.concat(getMovieResponse.movies);
			hasMorePages = getMovieResponse.hasMorePages;
			if (hasMorePages) {
				currentPage = page + 1;
			}
			isLoading = false;
		} catch (error) {
			console.error('Error loading movies', error);
		}
	};

	const loadMovieDetails = async (movieId: number): Promise<MovieDetails> => {
		const movieDetailsResponse = await getMovieDetails(movieId);
		return movieDetailsResponse;
	};

	onMount(async () => {
		if (currentPage === 1) {
			isLoading = true;
			await loadMoviePage(1);
			isLoading = false;
		}
	});

	let sentinel: HTMLDivElement;

	const observeSentinel = () => {
		const observer = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMorePages && !isLoading) {
					await loadMoviePage(currentPage);
				}
			},
			{ rootMargin: '200px' }
		);
		if (sentinel) {
			observer.observe(sentinel);
		}
	};

	onMount(() => {
		observeSentinel();
	});
</script>

{#if isLoading}
	<div>Loading...</div>
{/if}

{#each movies_genres as genre}
	<div class="flex flex-col gap-[15px] pb-[46px] pt-[20px]">
		<h2 class="text-l ml-[58px] font-medium">{genre.name}</h2>
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
			class="w-[calc(100vw + 160px)] ml-[-160px]"
		>
			<CarouselContent class="ml-0 flex gap-[6px]">
				{#each genre.movies as movie}
					<CarouselItem class="basis-auto p-0">
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
								{:else}
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
								{/if}
							</HoverCardTrigger>
							<HoverCardContent
								hideWhenDetached={true}
								avoidCollisions={false}
								side="bottom"
								sideOffset={-231}
								class="mt-0 w-[300px] overflow-hidden rounded-[8px] border-none p-0"
							>
								<a href="/movie/{movie.id}" target="_blank" rel="noreferrer noopener" class="block">
									{#await loadMovieDetails(movie.id)}
										<Skeleton class="h-full w-full" />
									{:then movieDetails}
										<div class="flex flex-col items-center">
											{#if movieDetails.backdrop_path}
												<img
													src={`https://image.tmdb.org/t/p/w500${movieDetails.backdrop_path}`}
													alt={movieDetails.title}
													class="w-[300px] rounded-[2px] object-cover"
												/>
											{/if}
											<div class="m-2 p-4">
												<h3 class="line-clamp-1 font-medium">{movieDetails.title}</h3>
												<p class="line-clamp-3 text-sm text-gray-500">{movieDetails.overview}</p>
												{#if movieDetails.runtime}
													<p class="text-sm text-gray-500">
														{Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m
													</p>
												{/if}
												{#if movieDetails.genres.length > 0}
													<div class="flex flex-wrap justify-center">
														{#each movieDetails.genres as genre}
															<Badge
																class="m-1 rounded-[2px] bg-gray-200 px-2 py-1 text-sm text-gray-700"
																key={genre.id}
															>
																{genre.name}
															</Badge>
														{/each}
													</div>
												{/if}
											</div>
										</div>
									{/await}
								</a>
							</HoverCardContent>
						</HoverCard>
					</CarouselItem>
				{/each}
			</CarouselContent>
			<CarouselPrevious
				class="left-[160px] h-[123px] w-[58px] rounded-[0] border-none opacity-75"
			/>
			<CarouselNext class="right-0 h-[123px] w-[58px] rounded-[0] border-none opacity-75" />
		</Carousel>
	</div>
{/each}

<div bind:this={sentinel}></div>
