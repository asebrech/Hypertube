<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
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

	const getBackdropImage = async (movieId: any) => {
		const config = {
			method: 'get',
			url: `${PUBLIC_BACK_URL}/movies/backdropImage`,
			params: {
				tmdb_movie_id: movieId,
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
	<div class="mb-8">
		<h2 class="mb-4 ml-4 text-xl font-bold">{genre.name}</h2>
		<Carousel.Root
			opts={{
				align: 'start',
				loop: true
			}}
		>
			<Carousel.Content>
				{#each genre.movies as movie}
					<Carousel.Item class="basis-auto pl-1">
						<div class="p-1">
							<Card.Root>
								<Card.Content class="h-45 w-75 flex aspect-square items-center justify-center p-6">
									{#await getBackdropImage(movie.id) then backdropImage}
										<img
											src={backdropImage.url}
											alt="{movie.title} backdrop"
											class="h-full w-full object-cover"
										/>
										<p class="mt-2 block text-center text-2xl font-semibold">{movie.title}</p>
									{:catch error}
										<span class="text-2xl font-semibold">{movie.title}</span>
									{/await}
								</Card.Content>
							</Card.Root>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<!-- <Carousel.Previous /> -->
			<!-- <Carousel.Next /> -->
		</Carousel.Root>
	</div>
{/each}
