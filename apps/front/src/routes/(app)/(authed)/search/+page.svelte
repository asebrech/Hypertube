<script lang="ts">
	import { getMovieSearch } from '@/services/api';
	import type { Movie } from '@hypertube/shared';
	import { searchQuery } from '@/services/store';
	import { MovieList } from '@/components/tadflix/movie-list';
	import { MovieModal } from '@/components/tadflix/movie-modal';
	import { Skeleton } from '@/components/ui/skeleton';
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

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

{#snippet searchSkeleton()}
	<div class="
		ml-[10%] w-[80%]
		sm:ml-[10.714%] sm:w-[78.571%]
		md:ml-[8.333%] md:w-[83.333%]
		lg:ml-[6.818%] lg:w-[86.364%]
		xl:ml-[5.769%] xl:w-[88.462%]
	">
		<div class="ml-0 flex flex-wrap gap-[0px]" style="row-gap: 5.5vw;">
			{#each Array(18) as _}
				<div class="basis-1/2 p-[3px] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
					<Skeleton class="aspect-[5/3] w-full rounded-[2px]" />
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#if isLoading && searchResults.length === 0}
	<div class="flex flex-col gap-8 py-[150px]">
		{@render searchSkeleton()}
	</div>
{:else if searchResults.length === 0 && !isLoading}
	<div class="flex h-[80vh] items-center justify-center" transition:fade={{ duration: 200 }}>
		<p class="text-lg text-gray-500">{$_('search.noresults')}</p>
	</div>
{:else if searchResults.length > 0}
	<div class="flex flex-col gap-8 py-[150px]">
		<div transition:fade={{ duration: 200 }}>
			<MovieList movies={searchResults} data={data} />
		</div>
		{#if isLoading}
			{@render searchSkeleton()}
		{/if}
	</div>
{/if}

<div bind:this={sentinel}></div>

<!-- Movie Modal -->
<MovieModal data={data} />
