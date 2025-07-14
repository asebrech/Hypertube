<script lang="ts">
	import { getMovieSearch } from '@/services/api';
	import type { Movie } from '@hypertube/shared';
	import { searchQuery } from '@/services/store';
	import { MovieList } from '@/components/tadflix/movie-list';
	import { onMount } from 'svelte';

	let searchResults: Movie[] = $state([]);
	let isLoading: boolean = $state(false);
	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);

	let abortController: AbortController | null = null;

	const loadSearchResults = async () => {
		if (!hasMorePages || !searchQuery) return;

		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		try {
			console.log('Loading search results for:', $searchQuery);
			await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate delay
			isLoading = true;
			const response = await getMovieSearch($searchQuery, currentPage, 'movie', {
				signal: abortController.signal
			});
			if (response.movies.length === 0) {
				hasMorePages = false;
			} else {
				searchResults = searchResults.concat(response.movies);
				hasMorePages = response.hasMorePages;
				currentPage++;
			}
			isLoading = false;
		} catch (error) {
			isLoading = false;
		}
	};

	onMount(() => {
		observeSentinel();
	});

	$effect(() => {
		if ($searchQuery) {
			resetResults();
			loadSearchResults();
		} else {
			// Abort any ongoing request if query is cleared
			if (abortController) {
				abortController.abort();
			}
		}
	});
	let sentinel: HTMLDivElement;

	const observeSentinel = () => {
		const observer = new IntersectionObserver(
			async (entries) => {
				console.log('Sentinel intersected', entries);
				if (entries[0].isIntersecting && hasMorePages && !isLoading) {
					await loadSearchResults();
				}
			},
			{ rootMargin: '200px' }
		);
		if (sentinel) {
			observer.observe(sentinel);
		}
	};

	function resetResults() {
		hasMorePages = true;
		currentPage = 1;
		searchResults = [];
	}
</script>

<div class="py-[150px]">
	<MovieList movies={searchResults} variant="default" />
</div>

<div bind:this={sentinel}></div>
