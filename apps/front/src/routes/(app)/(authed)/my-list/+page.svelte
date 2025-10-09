<script lang="ts">
	import { onMount } from 'svelte';
	import MovieList from '@/components/tadflix/movie-list/movie-list.svelte';
	import { getUserMovies } from '@/services/api';
	import { _ } from 'svelte-i18n';
	import type { Movie, MovieType } from '@hypertube/shared';
	import { Bookmark, RefreshCw } from 'lucide-svelte';
	import Titlebar from '@/components/tadflix/layout/titlebar/Titlebar.svelte';
	import MovieModal from '@/components/tadflix/movie-modal/movie-modal.svelte';

	const { data } = $props();

	// State for bookmarked movies
	let bookmarkedMovies: any[] = $state(data.bookmarkedMovies || []);
	let bookmarkedPage = $state(1);
	let hasMoreBookmarked = $state(true);
	let isLoadingBookmarked = $state(false);

	// State for watched movies
	let watchedMovies: any[] = $state(data.watchedMovies || []);
	let watchedPage = $state(1);
	let hasMoreWatched = $state(true);
	let isLoadingWatched = $state(false);

	// Convert backend movie format to frontend format
	function formatMovieForDisplay(movie: any): Movie {
		return {
			id: movie.tmdbId,
			title: movie.title || 'Unknown Title',
			name: movie.title || 'Unknown Title',
			overview: '',
			poster_path: '',
			release_date: '',
			vote_average: 0,
			media_type: 'movie' as MovieType,
			backdrop_image: null,
			is_watched: movie.userInteraction?.isWatched || false,
			is_bookmarked: movie.userInteraction?.isBookmarked || false,
			watch_progress_seconds: movie.userInteraction?.watchProgressSeconds || 0,
			torrent_available: movie.torrent_available || false
		};
	}

	// Load more bookmarked movies
	async function loadMoreBookmarked() {
		if (!hasMoreBookmarked || isLoadingBookmarked) return;

		try {
			isLoadingBookmarked = true;
			const response = await getUserMovies(bookmarkedPage + 1, 20, undefined, true, data.token);
			
			if (response.success && response.movies.length > 0) {
				bookmarkedMovies = [...bookmarkedMovies, ...response.movies];
				bookmarkedPage = response.pagination.currentPage;
				hasMoreBookmarked = response.pagination.hasNextPage;
			} else {
				hasMoreBookmarked = false;
			}
		} catch {
			hasMoreBookmarked = false;
		} finally {
			isLoadingBookmarked = false;
		}
	}


	// Refresh bookmarked movies
	async function refreshBookmarked() {
		try {
			isLoadingBookmarked = true;
			const response = await getUserMovies(1, 20, undefined, true, data.token);
			
			if (response.success) {
				bookmarkedMovies = response.movies;
				bookmarkedPage = 1;
				hasMoreBookmarked = response.pagination.hasNextPage;
			}
		} catch {
		} finally {
			isLoadingBookmarked = false;
		}
	}



	// Set up intersection observers for infinite scroll
	let bookmarkedSentinel = $state<HTMLDivElement>();
	let watchedSentinel = $state<HTMLDivElement>();

	onMount(() => {
		// Update pagination state from server data
		if (data.bookmarkedPagination) {
			bookmarkedPage = data.bookmarkedPagination.currentPage || 1;
			hasMoreBookmarked = data.bookmarkedPagination.hasNextPage || false;
		}
		
		if (data.watchedPagination) {
			watchedPage = data.watchedPagination.currentPage || 1;
			hasMoreWatched = data.watchedPagination.hasNextPage || false;
		}

		// Set up intersection observer for bookmarked movies
		const bookmarkedObserver = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMoreBookmarked && !isLoadingBookmarked) {
					await loadMoreBookmarked();
				}
			},
			{ rootMargin: '200px' }
		);

		if (bookmarkedSentinel) {
			bookmarkedObserver.observe(bookmarkedSentinel);
		}


		return () => {
			bookmarkedObserver.disconnect();
		};
	});

	// Format movies for display using derived state
	const formattedBookmarkedMovies = $derived(bookmarkedMovies.map(formatMovieForDisplay));
	const formattedWatchedMovies = $derived(watchedMovies.map(formatMovieForDisplay));
</script>

<svelte:head>
	<title>{$_('mylist.title')} - Datflix</title>
</svelte:head>

<div class="min-h-screen bg-[#141414] text-white pb-8 pt-0 sm:pt-32">
	<!-- Header -->
	<Titlebar>
		<div class="container mx-auto">
			<h1 class="text-2xl mb-2">{$_('mylist.title')}</h1>
		</div>
	</Titlebar>
	<!-- Bookmarked Movies Section -->

	<div class="flex flex-col gap-8 mt-16">	
		{#if formattedBookmarkedMovies.length > 0}
			<div class="flex flex-col gap-8">
				<MovieList movies={formattedBookmarkedMovies} data={data} />
			</div>
			
			<!-- Loading indicator for bookmarked movies -->
			{#if isLoadingBookmarked}
				<div class="flex justify-center py-8">
					<div class="flex items-center gap-2">
						<RefreshCw class="h-5 w-5 animate-spin" />
						<span>{$_('common.loading')}</span>
					</div>
				</div>
			{/if}
			
			<!-- Intersection observer sentinel for bookmarked movies -->
			<div bind:this={bookmarkedSentinel} class="h-1"></div>
		{:else if formattedBookmarkedMovies.length === 0}
			<div class="text-center py-2">
				<Bookmark class="h-16 w-16 mx-auto mb-4 text-gray-500" />
				<h3 class="text-xl font-medium mb-2">{$_('mylist.no_bookmarked_movies')}</h3>
				<p class="text-gray-400">{$_('mylist.no_bookmarked_movies_description')}</p>
			</div>
		{/if}
	</div>
</div>

<!-- Movie Modal -->
<MovieModal data={data} />