<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { PUBLIC_BACK_URL } from '$env/static/public';

	const getRandomNumber = () => Math.floor(Math.random() * 30) + 1;

	export let hasMorePages: boolean;
	export let currentPage: number = 1;
	export let isLoading: boolean;
	export let movies: any[] = [];

	const getMovies = async (page_to_load: number) => {
		const config = {
			method: 'get',
			url: `${PUBLIC_BACK_URL}/movies`,
			params: {
				limit: 10,
				page: page_to_load
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
			movies = movies.concat(moviePage.data.movies);
			hasMorePages = moviePage.data.hasMorePages;
			isLoading = false;
		} catch {
			console.error('Error loading movies');
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

{#each Array(15) as _, i (i)}
	<div class="mb-8">
		<h2 class="mb-4 ml-4 text-xl font-bold">Carousel {i + 1}</h2>
		<Carousel.Root
			opts={{
				align: 'start',
				loop: true
			}}
		>
			<Carousel.Content>
				{#each Array(getRandomNumber()) as _, j (j)}
					<Carousel.Item class="basis-auto pl-1">
						<div class="p-1">
							<Card.Root>
								<Card.Content class="flex aspect-square h-45 w-75 items-center justify-center p-6">
									<span class="text-2xl font-semibold">{j + 1}</span>
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
