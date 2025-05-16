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

	const getRandomNumber = () => Math.floor(Math.random() * 30) + 1;

	//create type for movies_genres
	type MovieGenre = {
		id: number;
		name: number;
		movies: {
			id: number;
			title: string;
			overview: string;
			poster_path: string;
			release_date: string;
			vote_average: number;
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
			console.log('response', response.data);
			return response.data;
		} catch (error) {
			console.error('Error fetching movies:', error);
			throw error;
		}
	};

	const loadMoviePage = async (page: number) => {
		try {
			isLoading = true;
			const moviePage = await getMovies(page);
			movies_genres = movies_genres.concat(moviePage);
			// hasMorePages = moviePage.data.hasMorePages;
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
						{#await getBackdropImage(movie.id, 'small') then backdropImage}
							<Card
								class="jystify-end flex h-[123px] w-[218px] flex-row rounded-[2px] border-none p-0"
								style="background-size: cover; background-position: center; background-image: url({backdropImage.url});"
							>
								{#if !backdropImage.langFound}
									<CardHeader class="bg-black bg-opacity-50 p-4">
										<CardTitle>{movie.title}</CardTitle>
										<!-- <CardDescription>{movie.overview}</CardDescription> -->
									</CardHeader>
								{/if}
							</Card>
						{:catch error}
							<Card
								class="h-[123px] w-[218px] rounded-sm border-none p-0"
								style="background-size: cover; background-position: center; background-image: url('/fallback-image.jpg');"
							>
								<CardHeader
									class="relative flex flex-col items-start justify-between bg-black bg-opacity-50 p-4"
								>
									<CardTitle>{movie.title}</CardTitle>
									<!-- <CardDescription>{movie.overview}</CardDescription> -->
								</CardHeader>
							</Card>
						{/await}
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
