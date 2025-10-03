<script lang="ts">
	import { getMovieSearch } from '@/services/api';
	import type { Movie } from '@hypertube/shared';
	import { searchQuery } from '@/services/store';
	import { MovieList } from '@/components/tadflix/movie-list';
	import { MovieModal } from '@/components/tadflix/movie-modal';
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';

	const { data } = $props();

	let searchResults: Movie[] = $state([]);
	let isLoading: boolean = $state(false);
	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);
	let abortController: AbortController | null = null;
	let lastSearchQuery = $state('');
	let debounceTimer: NodeJS.Timeout;

	const loadSearchResults = async () => {
		if (!hasMorePages || !$searchQuery || isLoading) return;
		isLoading = true;
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		try {
			const response = await getMovieSearch($searchQuery, currentPage, 'movie', data.token, {
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
			observeSentinel();
		} else {
			goto('/');
		}
	});

	$effect(() => {
		if ($searchQuery && $searchQuery !== lastSearchQuery) {
			clearTimeout(debounceTimer);
			if (abortController) {
				abortController.abort();
			}

			debounceTimer = setTimeout(() => {
				lastSearchQuery = $searchQuery;
				resetResults();
				loadSearchResults().then(() => {
					// Re-observe sentinel after loading new content
					setTimeout(() => observeSentinel(), 100);
				});
			}, 500);
		}
	});

	let sentinel: HTMLDivElement;
	let observer: IntersectionObserver | null = null;

	const observeSentinel = () => {
		// Disconnect existing observer
		if (observer) {
			observer.disconnect();
		}

		observer = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMorePages && !isLoading) {
					await loadSearchResults();
				}
			},
			{ rootMargin: '200px' }
		);
		
		if (sentinel) {
			observer.observe(sentinel);
			
			// Check if sentinel is already visible and trigger load if needed
			setTimeout(() => {
				if (sentinel && hasMorePages && !isLoading) {
					const rect = sentinel.getBoundingClientRect();
					const isVisible = rect.top < window.innerHeight + 200; // 200px rootMargin
					if (isVisible) {
						loadSearchResults();
					}
				}
			}, 100);
		}
	};

	function resetResults() {
		hasMorePages = true;
		currentPage = 1;
		searchResults = [];
	}

	onDestroy(() => {
		if (observer) {
			observer.disconnect();
		}
		if (abortController) {
			abortController.abort();
		}
		clearTimeout(debounceTimer);
	});
</script>

{#if searchResults.length === 0 && !isLoading}
	<div class="flex h-[80vh] items-center justify-center">
		<p class="text-lg text-gray-500">{$_('search.noresults')}</p>
	</div>
{/if}

{#if searchResults.length > 0}
	<div class="flex flex-col gap-8 py-[150px]">
		<MovieList movies={searchResults} data={data} />
	</div>
{/if}

<div bind:this={sentinel}></div>

<!-- Movie Modal -->
<MovieModal data={data} />
