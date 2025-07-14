<script lang="ts">
	import { getMovieSearch } from '@/services/api';
	import type { Movie } from '@hypertube/shared';
	import { searchQuery } from '@/services/store';
	import { MovieCarousel } from '@/components/tadflix/movie-carousel';

	let searchResults: Movie[] = $state([]);
	let isLoading: boolean = $state(false);
	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);

	let abortController: AbortController | null = null;

	const loadSearchResults = async () => {
		if (!hasMorePages || !searchQuery) return;

		// Abort previous request if any
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		try {
			isLoading = true;
			const response = await getMovieSearch($searchQuery, currentPage, 'movie', {
				signal: abortController.signal
			});
			if (response.movies.length === 0) {
				hasMorePages = false;
			} else {
				searchResults = response.movies;
				hasMorePages = response.hasMorePages;
			}
			isLoading = false;
		} catch (error) {
			isLoading = false;
		}
	};

	$effect(() => {
		if ($searchQuery) {
			loadSearchResults();
		} else {
			// Abort any ongoing request if query is cleared
			if (abortController) {
				abortController.abort();
			}
		}
	});
</script>

<div class="h-[200px] pt-[300px]">
	<p>HELLO, search for : {$searchQuery}</p>

	<MovieCarousel movies={searchResults} variant="default" />
</div>
