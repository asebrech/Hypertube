<script lang="ts">
	//recuperer la query de recherche
	import { onMount } from 'svelte';
	import { getMovieSearch } from '@/services/api';
	import { MovieCarousel } from '@/components/tadflix/movie-carousel';
	import type { Movie } from '@hypertube/shared';
	import { Skeleton } from '@/components/ui/skeleton';
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { searchQuery } from '@/services/store';

	let search = $page.url.searchParams.get('q') ?? '';
	console.log('Search query:', search);

	let searchResults: Movie[] = $state([]);
	let isLoading: boolean = $state(false);
	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);
	let sentinel: HTMLDivElement;
	let isSearching: boolean = $state(false);

	const loadSearchResults = async () => {
		if (!hasMorePages || !searchQuery) return;
		try {
			isLoading = true;
			const response = await getMovieSearch($searchQuery, currentPage, 'movie');
			if (response.movies.length === 0) {
				hasMorePages = false;
			} else {
				searchResults = searchResults.concat(response.movies);
				hasMorePages = response.hasMorePages;
				// currentPage++;
			}
			isLoading = false;
		} catch (error) {
			console.error('Error loading search results', error);
		}
	};

	// onMount(() => {
	// 	if (query) {
	// 		searchQuery = query;
	// 		isSearching = true;
	// 		loadSearchResults();
	// 	}
	// });
	$effect(() => {
		if ($searchQuery) {
			loadSearchResults();
		}
	});
</script>

<div class="h-[200px]">
	<p>HELLO, search for : {$searchQuery}</p>
</div>
