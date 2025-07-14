<script lang="ts">
	import { getMovieSearch } from '@/services/api';
	import type { Movie } from '@hypertube/shared';
	import { searchQuery } from '@/services/store';

	let searchResults: Movie[] = $state([]);
	let isLoading: boolean = $state(false);
	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);

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

	$effect(() => {
		if ($searchQuery) {
			loadSearchResults();
		}
	});
</script>

<div class="h-[200px]">
	<p>HELLO, search for : {$searchQuery}</p>
</div>
