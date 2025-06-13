<script lang="ts">
	import { onMount } from 'svelte';
	import type { MovieGenre } from '@hypertube/shared';
	import { getMovies } from '@/services/api';

	import { MovieCarousel } from '@/components/tadflix/movie-carousel';

	export let hasMorePages: boolean = true;
	export let currentPage: number = 1;
	export let isLoading: boolean;
	export let movies_genres: MovieGenre[] = [];

	const loadMoviePage = async () => {
		if (!hasMorePages) return;
		try {
			isLoading = true;
			const getMovieResponse = await getMovies(currentPage);
			movies_genres = movies_genres.concat(getMovieResponse.movies);
			hasMorePages = getMovieResponse.hasMorePages;
			currentPage++;
			isLoading = false;
		} catch (error) {
			console.error('Error loading movies', error);
		}
	};

	onMount(async () => {
		isLoading = true;
		await loadMoviePage();
		isLoading = false;
		observeSentinel();
	});

	let sentinel: HTMLDivElement;

	const observeSentinel = () => {
		const observer = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMorePages && !isLoading) {
					await loadMoviePage();
				}
			},
			{ rootMargin: '200px' }
		);
		if (sentinel) {
			observer.observe(sentinel);
		}
	};
</script>

{#if isLoading}
	<div>Loading...</div>
{/if}

{#each movies_genres as genre}
	<div class="flex w-full flex-col gap-[15px] overflow-hidden pb-[46px] pt-[20px]">
		<h2 class="text-l ml-[58px] font-medium">{genre.name}</h2>
		<MovieCarousel movies={genre.movies} />
	</div>
{/each}

<div bind:this={sentinel}></div>
