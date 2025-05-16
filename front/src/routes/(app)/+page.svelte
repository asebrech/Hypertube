<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '@/components/ui/card';
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
	export let hasMorePages: boolean;
	export let currentPage: number = 1;
	export let isLoading: boolean;
	export let movies_genres: MovieGenre[] = [];

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
			console.log('moviePage', getMovieResponse.movies);
			console.log('hasMorePagesResponse', getMovieResponse.hasMorePages);
			movies_genres = [...movies_genres, ...getMovieResponse.movies];
			console.log('movies_genres', movies_genres);
			// movies_genres = movies_genres.concat(getMovieResponse.movies);
			hasMorePages = getMovieResponse.hasMorePages;
			if (hasMorePages) {
				currentPage = page + 1;
			}
			isLoading = false;
		} catch (error) {
			console.error('Error loading movies', error);
		}
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
				slidesToScroll: 5
			}}
			class="w-[calc(100vw + 160px)] ml-[-160px]"
		>
			<CarouselContent class="ml-0 flex gap-[6px]">
				{#each genre.movies as movie}
					<CarouselItem class="basis-auto p-0">
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
