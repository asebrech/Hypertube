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
	let lastSearchQuery = $state('');
	let debounceTimer: NodeJS.Timeout;

	const loadSearchResults = async () => {
		if (!hasMorePages || !searchQuery || isLoading) return;
		isLoading = true;
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		try {
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

	onMount(async () => {
		if ($searchQuery) {
			await loadSearchResults();
			// await new Promise((resolve) => setTimeout(resolve, 300));
			observeSentinel();
		}
	});

	$effect(() => {
		if ($searchQuery && $searchQuery !== lastSearchQuery) {
			clearTimeout(debounceTimer);

			debounceTimer = setTimeout(() => {
				lastSearchQuery = $searchQuery;
				resetResults();
				loadSearchResults();
			}, 300);
		}
	});

	let sentinel: HTMLDivElement;

	const observeSentinel = () => {
		const observer = new IntersectionObserver(
			async (entries) => {
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
