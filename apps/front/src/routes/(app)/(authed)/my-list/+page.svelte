<script lang="ts">
	import { onMount } from 'svelte';
	import MovieList from '@/components/tadflix/movie-list/movie-list.svelte';
	import { getUserMovies } from '@/services/api';
	import { _ } from 'svelte-i18n';
	import type { Movie, MovieType } from '@hypertube/shared';
	import { Button } from '@/components/ui/button';
	import { Bookmark, Eye, RefreshCw } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';

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
			watch_progress_seconds: movie.userInteraction?.watchProgressSeconds || 0
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
		} catch (error) {
			console.error('Error loading more bookmarked movies:', error);
			hasMoreBookmarked = false;
		} finally {
			isLoadingBookmarked = false;
		}
	}

	// Load more watched movies
	async function loadMoreWatched() {
		if (!hasMoreWatched || isLoadingWatched) return;

		try {
			isLoadingWatched = true;
			const response = await getUserMovies(watchedPage + 1, 20, true, undefined, data.token);
			
			if (response.success && response.movies.length > 0) {
				watchedMovies = [...watchedMovies, ...response.movies];
				watchedPage = response.pagination.currentPage;
				hasMoreWatched = response.pagination.hasNextPage;
			} else {
				hasMoreWatched = false;
			}
		} catch (error) {
			console.error('Error loading more watched movies:', error);
			hasMoreWatched = false;
		} finally {
			isLoadingWatched = false;
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
		} catch (error) {
			console.error('Error refreshing bookmarked movies:', error);
		} finally {
			isLoadingBookmarked = false;
		}
	}

	// Refresh watched movies
	async function refreshWatched() {
		try {
			isLoadingWatched = true;
			const response = await getUserMovies(1, 20, true, undefined, data.token);
			
			if (response.success) {
				watchedMovies = response.movies;
				watchedPage = 1;
				hasMoreWatched = response.pagination.hasNextPage;
			}
		} catch (error) {
			console.error('Error refreshing watched movies:', error);
		} finally {
			isLoadingWatched = false;
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

		// Set up intersection observer for watched movies
		const watchedObserver = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMoreWatched && !isLoadingWatched) {
					await loadMoreWatched();
				}
			},
			{ rootMargin: '200px' }
		);

		if (bookmarkedSentinel) {
			bookmarkedObserver.observe(bookmarkedSentinel);
		}

		if (watchedSentinel) {
			watchedObserver.observe(watchedSentinel);
		}

		return () => {
			bookmarkedObserver.disconnect();
			watchedObserver.disconnect();
		};
	});

	// Format movies for display using derived state
	const formattedBookmarkedMovies = $derived(bookmarkedMovies.map(formatMovieForDisplay));
	const formattedWatchedMovies = $derived(watchedMovies.map(formatMovieForDisplay));
</script>

<svelte:head>
	<title>{$_('mylist.title')} - Datflix</title>
</svelte:head>

<div class="min-h-screen bg-black text-white">
	<!-- Header -->
	<div class="py-8">
		<div class="container mx-auto px-4">
			<h1 class="text-4xl font-bold mb-2">{$_('mylist.title')}</h1>
			<p class="text-gray-400">{$_('mylist.subtitle')}</p>
		</div>
	</div>

	<!-- Bookmarked Movies Section -->
	<div class="py-8">
		<Card class="bg-gray-900/50 border-gray-700 backdrop-blur-sm mx-4">
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle class="flex items-center gap-2 text-white">
						<Bookmark class="h-5 w-5 text-yellow-500" />
						{$_('mylist.bookmarked_movies')}
						<span class="text-sm text-gray-400">({bookmarkedMovies.length})</span>
					</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onclick={refreshBookmarked}
						disabled={isLoadingBookmarked}
						class="border-gray-600 text-white hover:bg-white/10"
					>
						<RefreshCw class="h-4 w-4 mr-2 {isLoadingBookmarked ? 'animate-spin' : ''}" />
						{$_('common.refresh')}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{#if formattedBookmarkedMovies.length > 0}
					<MovieList movies={formattedBookmarkedMovies} data={data} />
					
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
				{:else}
					<div class="text-center py-16">
						<Bookmark class="h-16 w-16 mx-auto mb-4 text-gray-500" />
						<h3 class="text-xl font-medium mb-2">{$_('mylist.no_bookmarked_movies')}</h3>
						<p class="text-gray-400">{$_('mylist.no_bookmarked_movies_description')}</p>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Watched Movies Section -->
	<div class="py-8">
		<Card class="bg-gray-900/50 border-gray-700 backdrop-blur-sm mx-4">
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle class="flex items-center gap-2 text-white">
						<Eye class="h-5 w-5 text-green-500" />
						{$_('mylist.watched_movies')}
						<span class="text-sm text-gray-400">({watchedMovies.length})</span>
					</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onclick={refreshWatched}
						disabled={isLoadingWatched}
						class="border-gray-600 text-white hover:bg-white/10"
					>
						<RefreshCw class="h-4 w-4 mr-2 {isLoadingWatched ? 'animate-spin' : ''}" />
						{$_('common.refresh')}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{#if formattedWatchedMovies.length > 0}
					<MovieList movies={formattedWatchedMovies} data={data} />
					
					<!-- Loading indicator for watched movies -->
					{#if isLoadingWatched}
						<div class="flex justify-center py-8">
							<div class="flex items-center gap-2">
								<RefreshCw class="h-5 w-5 animate-spin" />
								<span>{$_('common.loading')}</span>
							</div>
						</div>
					{/if}
					
					<!-- Intersection observer sentinel for watched movies -->
					<div bind:this={watchedSentinel} class="h-1"></div>
				{:else}
					<div class="text-center py-16">
						<Eye class="h-16 w-16 mx-auto mb-4 text-gray-500" />
						<h3 class="text-xl font-medium mb-2">{$_('mylist.no_watched_movies')}</h3>
						<p class="text-gray-400">{$_('mylist.no_watched_movies_description')}</p>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
