<script lang="ts">
	import MovieList from '@/components/tadflix/movie-list/movie-list.svelte';
	import type { Movie } from '@hypertube/shared';
	import { getMovieDiscover } from '@/services/api';
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';

	let isLoading: boolean = $state(false);
	let movies: Movie[] = $state([]);
	let genreId: number[] = $state([]);
	let releaseYear: string | undefined = $state(undefined);
	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);
	let castId: number[] | undefined = $state(undefined);

	const loadDiscoverMovies = async () => {
		isLoading = true;
		try {
			const response = await getMovieDiscover(genreId, castId, currentPage, releaseYear, undefined);
			movies = movies.concat(response.movies);
			hasMorePages = response.hasMorePages;
			currentPage++;
		} catch (error) {
			console.error('Error loading discover movies:', error);
		} finally {
			isLoading = false;
		}
	};

	onMount(async () => {
		await loadDiscoverMovies();
		observeSentinel();
	});

	let sentinel: HTMLDivElement;

	const observeSentinel = () => {
		const observer = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMorePages && !isLoading) {
					await loadDiscoverMovies();
				}
			},
			{ rootMargin: '200px' }
		);
		if (sentinel) {
			observer.observe(sentinel);
		}
	};
</script>

{#if movies.length === 0 && !isLoading}
	<div class="flex h-[80vh] items-center justify-center">
		<p class="text-lg text-gray-500">{$_('search.noresults')}</p>
	</div>
{/if}

{#if movies.length > 0}
	<div class="flex flex-col gap-8 py-[150px]">
		<MovieList {movies} />
	</div>
{/if}

<div bind:this={sentinel}></div>
