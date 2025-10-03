<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import * as Tabs from '@/components/ui/tabs';
	import { Skeleton } from '@/components/ui/skeleton';
	import { Input } from '@/components/ui/input';
	import { Badge } from '@/components/ui/badge';
	import { Checkbox } from '@/components/ui/checkbox';
	import { Trash2, Download, Calendar, HardDrive, AlertTriangle, Search, Film, Database, CheckSquare, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';
	import { page } from '$app/state';

	const { data } = $props();

	interface DownloadedMovie {
		id: number;
		tmdbId: number;
		title: string | null;
		downloadStatus: string;
		conversionStatus: string;
		resolution480pReady: boolean;
		resolution720pReady: boolean;
		resolution1080pReady: boolean;
		lastAccessedAt: string | null;
		createdAt: string;
		updatedAt: string;
		sizeInBytes?: number;
	}

	interface IndexedMovie {
		id: number;
		tmdbId: number;
		title: string | null;
		torrentAvailable: boolean | null;
		createdAt: string;
		updatedAt: string;
	}

	let movies: DownloadedMovie[] = $state([]);
	let indexedMovies: IndexedMovie[] = $state([]);
	let isLoading = $state(true);
	let isLoadingIndexed = $state(true);
	let error = $state<string | null>(null);
	let selectedMovies = $state<Set<number>>(new Set());
	let isDeleting = $state(false);
	let isDeletingIndexed = $state(false);
	let searchTerm = $state('');
	let searchTermIndexed = $state('');
	let totalSize = $state(0);
	
	// Global statistics for header
	let globalTotalMovies = $state(0);
	let globalTotalSize = $state(0);
	
	// Pagination state from server (downloaded movies)
	let currentPage = $state(1);
	let itemsPerPage = $state(10);
	let totalPages = $state(1);
	let totalMovies = $state(0); // Filtered count for pagination
	let hasNextPage = $state(false);
	let hasPrevPage = $state(false);

	// Pagination state for indexed movies
	let currentPageIndexed = $state(1);
	let itemsPerPageIndexed = $state(10);
	let totalPagesIndexed = $state(1);
	let totalIndexedMovies = $state(0);
	let hasNextPageIndexed = $state(false);
	let hasPrevPageIndexed = $state(false);

	// Search debouncing
	let searchTimeout: NodeJS.Timeout;
	let searchTimeoutIndexed: NodeJS.Timeout;
	let lastSearchTerm = $state('');
	let lastSearchTermIndexed = $state('');

	// Sorting state
	let sortField = $state<'lastAccessedAt' | 'createdAt' | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('desc');

	// Sorting state for indexed movies
	let sortFieldIndexed = $state<'createdAt' | null>(null);
	let sortDirectionIndexed = $state<'asc' | 'desc'>('desc');

	// Fetch movies list with pagination
	async function fetchMovies(page: number, limit: number, search: string = '', sort: string = '', direction: string = '') {
		isLoading = true;
		error = null;
		
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString()
			});
			
			if (search.trim()) {
				params.append('search', search.trim());
			}

			if (sort && direction) {
				params.append('sortBy', sort);
				params.append('sortDirection', direction);
			}

			const response = await fetch(`/api/admin/movies?${params}`, {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error($_('admin.errors.http_error', { values: { status: response.status } }));
			}

			const result = await response.json();
			if (result.success) {
				movies = result.movies;
				totalSize = result.totalSize; // Size of current page
				
				// Update global statistics for header
				globalTotalMovies = result.globalStats.totalMovies;
				globalTotalSize = result.globalStats.totalSize;
				
				// Update pagination info
				currentPage = result.pagination.currentPage;
				totalPages = result.pagination.totalPages;
				totalMovies = result.pagination.totalMovies; // Filtered count
				hasNextPage = result.pagination.hasNextPage;
				hasPrevPage = result.pagination.hasPrevPage;
			} else {
				throw new Error($_('admin.errors.fetch_failed'));
			}
		} catch (err) {
			error = err instanceof Error ? err.message : $_('admin.errors.unknown_error');
			console.error('Error fetching movies:', err);
		} finally {
			isLoading = false;
		}
	}

	// Fetch indexed movies (without download status)
	async function fetchIndexedMovies(page: number, limit: number, search: string = '') {
		isLoadingIndexed = true;
		
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString()
			});
			
			if (search.trim()) {
				params.append('search', search.trim());
			}

			const response = await fetch(`/api/admin/movies-without-status?${params}`, {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error($_('admin.errors.http_error', { values: { status: response.status } }));
			}

			const result = await response.json();
			if (result.success) {
				indexedMovies = result.movies;
				
				// Update pagination info for indexed movies
				currentPageIndexed = result.pagination.currentPage;
				totalPagesIndexed = result.pagination.totalPages;
				totalIndexedMovies = result.pagination.totalMovies;
				hasNextPageIndexed = result.pagination.hasNextPage;
				hasPrevPageIndexed = result.pagination.hasPrevPage;
			} else {
				throw new Error($_('admin.errors.fetch_failed'));
			}
		} catch (err) {
			error = err instanceof Error ? err.message : $_('admin.errors.unknown_error');
			console.error('Error fetching indexed movies:', err);
		} finally {
			isLoadingIndexed = false;
		}
	}

	// Delete single movie
	async function deleteMovie(tmdbId: number) {
		if (!confirm($_('admin.confirm_delete_single'))) return;

		isDeleting = true;
		try {
			const response = await fetch(`/api/admin/movies/${tmdbId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error($_('admin.errors.http_error', { values: { status: response.status } }));
			}

			const result = await response.json();
			if (result.success) {
				// Refresh the list to update statistics and current page
				await fetchMovies(currentPage, itemsPerPage, lastSearchTerm, sortField || '', sortDirection);
				selectedMovies.delete(tmdbId);
				selectedMovies = new Set(selectedMovies); // Trigger reactivity
			} else {
				throw new Error(result.message || $_('admin.errors.delete_failed'));
			}
		} catch (err) {
			error = err instanceof Error ? err.message : $_('admin.errors.unknown_error');
			console.error('Error deleting movie:', err);
		} finally {
			isDeleting = false;
		}
	}

	// Delete all movies
	async function deleteAllMovies() {
		// Check if any movies are being converted
		const convertingMovies = movies.filter(movie => isMovieBeingConverted(movie));
		if (convertingMovies.length > 0) {
			error = `${$_('admin.cannot_delete_converting')}\n${convertingMovies.map(m => m.title || $_('admin.unknown_title')).join('\n')}`;
			return;
		}

		if (!confirm($_('admin.confirm_delete_all'))) return;

		isDeleting = true;
		try {
			const response = await fetch('/api/admin/movies', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error($_('admin.errors.http_error', { values: { status: response.status } }));
			}

			const result = await response.json();
			if (result.success) {
				// Refresh the entire list to update all statistics
				await fetchMovies(1, itemsPerPage, lastSearchTerm, sortField || '', sortDirection);
				selectedMovies = new Set(); // Clear and trigger reactivity
				
				// Show warning if some movies couldn't be deleted
				if (result.errors > 0 && result.errorMessages) {
					error = `${result.message}\n\n${$_('admin.delete_partial_success')}\n${result.errorMessages.join('\n')}`;
				}
			} else {
				throw new Error(result.message || $_('admin.errors.delete_all_failed'));
			}
		} catch (err) {
			error = err instanceof Error ? err.message : $_('admin.errors.unknown_error');
			console.error('Error deleting all movies:', err);
		} finally {
			isDeleting = false;
		}
	}

	// Delete selected movies
	async function deleteSelectedMovies() {
		if (selectedMovies.size === 0) return;
		
		// Double-check that no selected movies are being converted (should not happen due to UI restrictions)
		const selectedMoviesData = movies.filter(m => selectedMovies.has(m.tmdbId));
		const convertingSelectedMovies = selectedMoviesData.filter(movie => isMovieBeingConverted(movie));
		if (convertingSelectedMovies.length > 0) {
			error = `${$_('admin.movie_being_converted')}\n\n${convertingSelectedMovies.map(m => m.title || $_('admin.unknown_title')).join('\n')}`;
			return;
		}
		
		if (!confirm($_('admin.confirm_delete_selected', { values: { count: selectedMovies.size } }))) return;

		isDeleting = true;
		const errors: string[] = [];

		for (const tmdbId of selectedMovies) {
			try {
				const response = await fetch(`/api/admin/movies/${tmdbId}`, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				});

				if (!response.ok) {
					throw new Error($_('admin.errors.http_error', { values: { status: response.status } }));
				}

				const result = await response.json();
				if (!result.success) {
					throw new Error(result.message || $_('admin.errors.delete_failed'));
				}
			} catch (err) {
				const movie = movies.find(m => m.tmdbId === tmdbId);
				errors.push(`${movie?.title || tmdbId}: ${err instanceof Error ? err.message : $_('admin.errors.delete_unknown')}`);
			}
		}

		// Refresh the list
		await fetchMovies(currentPage, itemsPerPage, lastSearchTerm, sortField || '', sortDirection);
		selectedMovies = new Set(); // Clear and trigger reactivity

		if (errors.length > 0) {
			error = `${$_('admin.errors.delete_selected_failed')}\n${errors.join('\n')}`;
		}

		isDeleting = false;
	}

	// Utility functions
	function formatBytes(bytes?: number): string {
		if (!bytes) return $_('admin.not_available');
		const sizes = [$_('admin.bytes'), 'KB', 'MB', 'GB', 'TB'];
		if (bytes === 0) return `0 ${$_('admin.bytes')}`;
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return $_('admin.never');
		return new Date(dateString).toLocaleDateString();
	}

	function getResolutionBadges(movie: DownloadedMovie): string[] {
		const resolutions: string[] = [];
		if (movie.resolution480pReady) resolutions.push('480p');
		if (movie.resolution720pReady) resolutions.push('720p');
		if (movie.resolution1080pReady) resolutions.push('1080p');
		return resolutions;
	}

	function toggleMovieSelection(tmdbId: number) {
		const movie = movies.find(m => m.tmdbId === tmdbId);
		if (movie && isMovieBeingConverted(movie)) {
			return; // Don't allow selection of movies being converted
		}

		if (selectedMovies.has(tmdbId)) {
			selectedMovies.delete(tmdbId);
			selectedMovies = new Set(selectedMovies); // Trigger reactivity
		} else {
			selectedMovies.add(tmdbId);
			selectedMovies = new Set(selectedMovies); // Trigger reactivity
		}
	}

	function selectAll() {
		const selectableMovies = movies.filter(m => !isMovieBeingConverted(m));
		if (selectedMovies.size === selectableMovies.length && selectableMovies.length > 0) {
			selectedMovies = new Set(); // Clear and trigger reactivity
		} else {
			// Only select movies that are not being converted
			selectedMovies = new Set(selectableMovies.map(m => m.tmdbId));
		}
	}

	function isMovieBeingConverted(movie: DownloadedMovie): boolean {
		return movie.conversionStatus === 'converting';
	}

	// Pagination functions
	async function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			await fetchMovies(page, itemsPerPage, lastSearchTerm, sortField || '', sortDirection);
		}
	}

	async function nextPage() {
		if (hasNextPage && currentPage < totalPages) {
			const nextPageNum = currentPage + 1;
			await fetchMovies(nextPageNum, itemsPerPage, lastSearchTerm, sortField || '', sortDirection);
		}
	}

	async function prevPage() {
		if (hasPrevPage && currentPage > 1) {
			const prevPageNum = currentPage - 1;
			await fetchMovies(prevPageNum, itemsPerPage, lastSearchTerm, sortField || '', sortDirection);
		}
	}

	async function changeItemsPerPage(newItemsPerPage: number) {
		itemsPerPage = newItemsPerPage;
		await fetchMovies(1, newItemsPerPage, lastSearchTerm, sortField || '', sortDirection); // Reset to first page
	}

	// Search with debouncing
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			if (searchTerm !== lastSearchTerm) {
				lastSearchTerm = searchTerm;
				await fetchMovies(1, itemsPerPage, searchTerm, sortField || '', sortDirection); // Reset to first page on search
			}
		}, 500); // 500ms debounce
	}

	// Clear search function
	async function clearSearch() {
		searchTerm = '';
		lastSearchTerm = '';
		await fetchMovies(1, itemsPerPage, '', sortField || '', sortDirection); // Reset to first page with no search
	}

	// Search with debouncing for indexed movies
	function handleSearchInputIndexed() {
		clearTimeout(searchTimeoutIndexed);
		searchTimeoutIndexed = setTimeout(async () => {
			if (searchTermIndexed !== lastSearchTermIndexed) {
				lastSearchTermIndexed = searchTermIndexed;
				await fetchIndexedMovies(1, itemsPerPageIndexed, searchTermIndexed); // Reset to first page on search
			}
		}, 500); // 500ms debounce
	}

	// Clear search function for indexed movies
	async function clearSearchIndexed() {
		searchTermIndexed = '';
		lastSearchTermIndexed = '';
		await fetchIndexedMovies(1, itemsPerPageIndexed, ''); // Reset to first page with no search
	}

	// Pagination functions for indexed movies
	async function goToPageIndexed(page: number) {
		if (page >= 1 && page <= totalPagesIndexed) {
			await fetchIndexedMovies(page, itemsPerPageIndexed, lastSearchTermIndexed);
		}
	}

	async function nextPageIndexed() {
		if (hasNextPageIndexed && currentPageIndexed < totalPagesIndexed) {
			const nextPageNum = currentPageIndexed + 1;
			await fetchIndexedMovies(nextPageNum, itemsPerPageIndexed, lastSearchTermIndexed);
		}
	}

	async function prevPageIndexed() {
		if (hasPrevPageIndexed && currentPageIndexed > 1) {
			const prevPageNum = currentPageIndexed - 1;
			await fetchIndexedMovies(prevPageNum, itemsPerPageIndexed, lastSearchTermIndexed);
		}
	}

	async function changeItemsPerPageIndexed(newItemsPerPage: number) {
		itemsPerPageIndexed = newItemsPerPage;
		await fetchIndexedMovies(1, newItemsPerPage, lastSearchTermIndexed); // Reset to first page
	}

	// Sorting function
	async function handleSort(field: 'lastAccessedAt' | 'createdAt') {
		if (sortField === field) {
			// Toggle direction if same field
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// New field, default to desc
			sortField = field;
			sortDirection = 'desc';
		}
		
		await fetchMovies(currentPage, itemsPerPage, lastSearchTerm, sortField, sortDirection);
	}

	// Sorting function for indexed movies
	async function handleSortIndexed(field: 'createdAt') {
		if (sortFieldIndexed === field) {
			// Toggle direction if same field
			sortDirectionIndexed = sortDirectionIndexed === 'asc' ? 'desc' : 'asc';
		} else {
			// New field, default to desc
			sortFieldIndexed = field;
			sortDirectionIndexed = 'desc';
		}
		
		await fetchIndexedMovies(currentPageIndexed, itemsPerPageIndexed, lastSearchTermIndexed);
	}

	// Delete single indexed movie
	async function deleteIndexedMovie(tmdbId: number) {
		if (!confirm($_('admin.confirm_delete_single'))) return;

		isDeletingIndexed = true;
		try {
			const response = await fetch(`/api/admin/movies/${tmdbId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error($_('admin.errors.http_error', { values: { status: response.status } }));
			}

			const result = await response.json();
			if (result.success) {
				// Refresh the indexed movies list
				await fetchIndexedMovies(currentPageIndexed, itemsPerPageIndexed, lastSearchTermIndexed);
			} else {
				throw new Error(result.message || $_('admin.errors.delete_failed'));
			}
		} catch (err) {
			error = err instanceof Error ? err.message : $_('admin.errors.unknown_error');
			console.error('Error deleting indexed movie:', err);
		} finally {
			isDeletingIndexed = false;
		}
	}

	// Initial load
	$effect(() => {
		fetchMovies(1, 10, '', '', ''); // Explicit initial values
		fetchIndexedMovies(1, 10, ''); // Load indexed movies too
	});
</script>

<svelte:head>
	<title>{$_('admin.title')} - Datflix</title>
</svelte:head>

<!-- Netflix-style background -->
<div 
	class="min-h-screen bg-cover bg-center bg-no-repeat relative py-16 text-white"
	style="background-image: url('/img/netflix-background.jpg')"
>
	<!-- Dark overlay -->
	<div class="absolute inset-0 bg-black/50"></div>
	
	<!-- Content -->
	<div class="relative z-10 container mx-auto px-4 py-8">
		<!-- Hero Header -->
		<div class="mb-12 text-center">
			<h1 class="text-6xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
				{$_('admin.title')}
			</h1>
			<p class="text-xl text-gray-300 max-w-2xl mx-auto">
				{$_('admin.subtitle')}
			</p>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<Card.Root class="bg-black/40 border-gray-700 backdrop-blur-sm">
				<Card.Content class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-400">{$_('admin.stats.total_movies')}</p>
							<p class="text-3xl font-bold text-white">{globalTotalMovies}</p>
						</div>
						<Film class="h-8 w-8 text-red-500" />
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="bg-black/40 border-gray-700 backdrop-blur-sm">
				<Card.Content class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-400">{$_('admin.stats.storage_used')}</p>
							<p class="text-3xl font-bold text-white">{formatBytes(globalTotalSize)}</p>
						</div>
						<Database class="h-8 w-8 text-blue-500" />
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="bg-black/40 border-gray-700 backdrop-blur-sm">
				<Card.Content class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-400">{$_('admin.stats.selected')}</p>
							<p class="text-3xl font-bold text-white">{selectedMovies.size}</p>
						</div>
						<CheckSquare class="h-8 w-8 text-green-500" />
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		{#if error}
			<Card.Root class="mb-6 border-red-500 bg-red-900/40 backdrop-blur-sm">
				<Card.Content class="p-4">
					<div class="flex items-center gap-2 text-red-300">
						<AlertTriangle size={20} />
						<span>{error}</span>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Movies Management with Tabs -->
		<Card.Root class="bg-black/40 border-gray-700 backdrop-blur-sm">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 pb-6 text-white">
					<Film class="h-5 w-5 text-red-500" />
					Movies Management
				</Card.Title>
			</Card.Header>
			<Card.Content class="p-0">
				<Tabs.Root value="downloaded" class="w-full">
					<Tabs.List class="grid w-full grid-cols-2 bg-black/20 border-b border-gray-700">
						<Tabs.Trigger value="downloaded" class="flex items-center gap-2 text-white data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
							<Download class="h-4 w-4" />
							{$_('admin.downloaded_movies')}
						</Tabs.Trigger>
						<Tabs.Trigger value="indexed" class="flex items-center gap-2 text-white data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
							<Database class="h-4 w-4" />
							{$_('admin.indexed_movies')}
						</Tabs.Trigger>
					</Tabs.List>

					<!-- Downloaded Movies Tab -->
					<Tabs.Content value="downloaded" class="mt-0">
						<!-- Controls for Downloaded Movies -->
						<div class="p-6 border-b border-gray-700">
							<div class="flex flex-col lg:flex-row gap-4 mb-6">
								<!-- Search -->
								<div class="flex-1 relative">
									<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
									<Input
										bind:value={searchTerm}
										oninput={handleSearchInput}
										placeholder={$_('admin.search_placeholder')}
										class="pl-10 bg-black/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
									/>
								</div>

								<!-- Action Buttons -->
								<div class="flex gap-2">
									<Button 
										onclick={() => fetchMovies(currentPage, itemsPerPage, lastSearchTerm, sortField || '', sortDirection)} 
										variant="outline" 
										disabled={isLoading}
										class="border-gray-600 text-white hover:bg-white/10"
									>
										<RefreshCw class="h-4 w-4 mr-2 {isLoading ? 'animate-spin' : ''}" />
										{$_('admin.refresh')}
									</Button>

									{#if movies.length > 0}
										<Button
											onclick={selectAll}
											variant="ghost"
											disabled={isDeleting}
											class="text-white hover:bg-white/10"
										>
											{selectedMovies.size === movies.filter(m => !isMovieBeingConverted(m)).length && movies.filter(m => !isMovieBeingConverted(m)).length > 0 ? $_('admin.deselect_all') : $_('admin.select_all')}
										</Button>

										{#if selectedMovies.size > 0}
											<Button
												onclick={deleteSelectedMovies}
												variant="destructive"
												disabled={isDeleting}
												class="bg-red-600 hover:bg-red-700"
											>
												<Trash2 size={16} class="mr-2" />
												{$_('admin.delete_selected', { values: { count: selectedMovies.size } })}
											</Button>
										{/if}

										<Button
											onclick={deleteAllMovies}
											variant="destructive"
											disabled={isDeleting}
											class="bg-red-600 hover:bg-red-700"
										>
											<Trash2 size={16} class="mr-2" />
											{$_('admin.delete_all')}
										</Button>
									{/if}
								</div>
							</div>

							<!-- Summary Info -->
							<div class="flex flex-wrap gap-4 text-sm text-gray-300">
								<span class="flex items-center gap-1">
									<Film class="h-4 w-4" />
									{$_('admin.showing_results', { values: { count: movies.length, total: totalMovies } })}
								</span>
								{#if totalSize > 0}
									<span class="flex items-center gap-1">
										<HardDrive class="h-4 w-4" />
										{$_('admin.total_storage')}: {formatBytes(totalSize)}
									</span>
								{/if}
							</div>
						</div>
						{#if isLoading}
							<div class="p-6 space-y-4">
								{#each Array(5) as _}
									<div class="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg">
										<Skeleton class="h-4 w-4" />
										<Skeleton class="h-4 flex-1" />
										<Skeleton class="h-4 w-24" />
										<Skeleton class="h-4 w-32" />
										<Skeleton class="h-8 w-16" />
									</div>
								{/each}
							</div>
						{:else if movies.length === 0}
							<div class="text-center py-16">
								{#if searchTerm}
									<Search size={48} class="mx-auto mb-4 text-gray-500" />
									<h3 class="text-xl font-medium mb-2 text-white">{$_('admin.no_search_results')}</h3>
									<p class="text-gray-400">{$_('admin.try_different_search')}</p>
									<Button 
										onclick={clearSearch} 
										variant="outline" 
										class="mt-4 border-gray-600 text-white hover:bg-white/10"
									>
										{$_('admin.clear_search')}
									</Button>
								{:else}
									<Download size={48} class="mx-auto mb-4 text-gray-500" />
									<h3 class="text-xl font-medium mb-2 text-white">{$_('admin.no_movies')}</h3>
									<p class="text-gray-400">{$_('admin.no_movies_description')}</p>
								{/if}
							</div>
						{:else}
							<!-- Responsive Table -->
							<div class="overflow-x-auto">
								<table class="w-full">
									<thead class="bg-black/60">
										<tr class="border-b border-gray-700">
											<th class="text-left p-4 w-12">
												<Checkbox
													checked={selectedMovies.size === movies.filter(m => !isMovieBeingConverted(m)).length && movies.filter(m => !isMovieBeingConverted(m)).length > 0}
													onCheckedChange={selectAll}
													class="border-gray-600"
												/>
											</th>
											<th class="text-left p-4 text-white font-medium">{$_('admin.table.title')}</th>
											<th class="text-left p-4 text-white font-medium">{$_('admin.table.status')}</th>
											<th class="text-left p-4 text-white font-medium">{$_('admin.table.resolutions')}</th>
											<th class="text-left p-4 text-white font-medium">{$_('admin.table.size')}</th>
											<th class="text-left p-4 text-white font-medium">
												<button 
													onclick={() => handleSort('lastAccessedAt')}
													class="flex items-center gap-2 hover:text-red-400 transition-colors"
												>
													{$_('admin.table.last_accessed')}
													{#if sortField === 'lastAccessedAt'}
														{#if sortDirection === 'asc'}
															<ArrowUp class="h-4 w-4" />
														{:else}
															<ArrowDown class="h-4 w-4" />
														{/if}
													{:else}
														<ArrowUpDown class="h-4 w-4 opacity-50" />
													{/if}
												</button>
											</th>
											<th class="text-left p-4 text-white font-medium">
												<button 
													onclick={() => handleSort('createdAt')}
													class="flex items-center gap-2 hover:text-red-400 transition-colors"
												>
													{$_('admin.table.created')}
													{#if sortField === 'createdAt'}
														{#if sortDirection === 'asc'}
															<ArrowUp class="h-4 w-4" />
														{:else}
															<ArrowDown class="h-4 w-4" />
														{/if}
													{:else}
														<ArrowUpDown class="h-4 w-4 opacity-50" />
													{/if}
												</button>
											</th>
											<th class="text-center p-4 text-white font-medium">{$_('admin.table.actions')}</th>
										</tr>
									</thead>
									<tbody>
										{#each movies as movie, index}
											<tr class="border-b border-gray-800/50 transition-colors {isMovieBeingConverted(movie) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/20'}">
												<td class="p-4">
													<Checkbox
														checked={selectedMovies.has(movie.tmdbId)}
														onCheckedChange={() => toggleMovieSelection(movie.tmdbId)}
														disabled={isMovieBeingConverted(movie)}
														class="border-gray-600 {isMovieBeingConverted(movie) ? 'cursor-not-allowed' : ''}"
													/>
												</td>
												<td class="p-4">
													<div>
														<div class="font-medium text-white">{movie.title || $_('admin.unknown_title')}</div>
														<div class="text-xs text-gray-400">TMDB ID: {movie.tmdbId}</div>
													</div>
												</td>
												<td class="p-4">
													<div class="space-y-2">
														<Badge 
															variant={movie.downloadStatus === 'completed' ? 'default' : 
															       movie.downloadStatus === 'failed' ? 'destructive' : 'secondary'}
															class="text-xs"
														>
															{$_(`admin.status.download.${movie.downloadStatus}`)}
														</Badge>
														<Badge 
															variant={movie.conversionStatus === 'completed' ? 'default' : 
															       movie.conversionStatus === 'failed' ? 'destructive' : 'secondary'}
															class="text-xs {movie.conversionStatus === 'converting' ? 'animate-pulse bg-yellow-600' : ''}"
														>
															{$_(`admin.status.conversion.${movie.conversionStatus}`)}
														</Badge>
													</div>
												</td>
												<td class="p-4">
													<div class="flex gap-1 flex-wrap">
														{#each getResolutionBadges(movie) as resolution}
															<Badge variant="outline" class="text-xs border-blue-500 text-blue-300">
																{resolution}
															</Badge>
														{/each}
													</div>
												</td>
												<td class="p-4">
													<div class="flex items-center gap-1 text-gray-300">
														<HardDrive size={14} />
														<span class="text-sm">{formatBytes(movie.sizeInBytes)}</span>
													</div>
												</td>
												<td class="p-4">
													<div class="flex items-center gap-1 text-gray-300">
														<Calendar size={14} />
														<span class="text-sm">{formatDate(movie.lastAccessedAt)}</span>
													</div>
												</td>
												<td class="p-4">
													<div class="flex items-center gap-1 text-gray-300">
														<Calendar size={14} />
														<span class="text-sm">{formatDate(movie.createdAt)}</span>
													</div>
												</td>
												<td class="p-4 text-center">
													<Button
														onclick={() => deleteMovie(movie.tmdbId)}
														variant="destructive"
														size="sm"
														disabled={isDeleting || isMovieBeingConverted(movie)}
														class="bg-red-600 hover:bg-red-700 {isMovieBeingConverted(movie) ? 'cursor-not-allowed opacity-50' : ''}"
														title={isMovieBeingConverted(movie) ? $_('admin.movie_being_converted') : ''}
													>
														<Trash2 size={14} />
													</Button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>

							<!-- Pagination Controls -->
							<div class="border-t border-gray-700 px-6 py-4 pb-6">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4">
										<span class="text-sm text-gray-400">
											{$_('admin.showing_page', { values: { current: currentPage, total: totalPages } })}
										</span>
										
										<div class="flex items-center gap-2">
											<span class="text-sm text-gray-400">{$_('admin.items_per_page')}:</span>
											<select 
												bind:value={itemsPerPage} 
												onchange={() => changeItemsPerPage(itemsPerPage)}
												class="bg-black/50 border border-gray-600 rounded px-2 py-1 text-white text-sm"
											>
												<option value={5}>5</option>
												<option value={10}>10</option>
												<option value={25}>25</option>
												<option value={50}>50</option>
											</select>
										</div>
									</div>

									{#if totalPages > 1}
										<div class="flex items-center gap-2">
											<Button
												onclick={() => goToPage(1)}
												variant="outline"
												size="sm"
												disabled={!hasPrevPage || isLoading}
												class="border-gray-600 text-white hover:bg-white/10"
											>
												<ChevronsLeft class="h-4 w-4" />
											</Button>
											
											<Button
												onclick={prevPage}
												variant="outline"
												size="sm"
												disabled={!hasPrevPage || isLoading}
												class="border-gray-600 text-white hover:bg-white/10"
											>
												<ChevronLeft class="h-4 w-4" />
											</Button>

											<span class="px-3 py-1 text-sm text-white">
												{currentPage} / {totalPages}
											</span>

											<Button
												onclick={nextPage}
												variant="outline"
												size="sm"
												disabled={!hasNextPage || isLoading}
												class="border-gray-600 text-white hover:bg-white/10"
											>
												<ChevronRight class="h-4 w-4" />
											</Button>
											
											<Button
												onclick={() => goToPage(totalPages)}
												variant="outline"
												size="sm"
												disabled={!hasNextPage || isLoading}
												class="border-gray-600 text-white hover:bg-white/10"
											>
												<ChevronsRight class="h-4 w-4" />
											</Button>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</Tabs.Content>

					<!-- Indexed Movies Tab -->
					<Tabs.Content value="indexed" class="mt-0">
						<!-- Search for indexed movies -->
						<div class="p-6 border-b border-gray-700">
							<div class="flex flex-col lg:flex-row gap-4">
								<!-- Search -->
								<div class="flex-1 relative">
									<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
									<Input
										bind:value={searchTermIndexed}
										oninput={handleSearchInputIndexed}
										placeholder={$_('admin.search_placeholder')}
										class="pl-10 bg-black/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
									/>
								</div>

								<!-- Action Buttons -->
								<div class="flex gap-2">
									<Button 
										onclick={() => fetchIndexedMovies(currentPageIndexed, itemsPerPageIndexed, lastSearchTermIndexed)} 
										variant="outline" 
										disabled={isLoadingIndexed}
										class="border-gray-600 text-white hover:bg-white/10"
									>
										<RefreshCw class="h-4 w-4 mr-2 {isLoadingIndexed ? 'animate-spin' : ''}" />
										{$_('admin.refresh')}
									</Button>
								</div>
							</div>

							<!-- Summary Info for indexed movies -->
							<div class="flex flex-wrap gap-4 text-sm text-gray-300 mt-4">
								<span class="flex items-center gap-1">
									<Database class="h-4 w-4" />
									{$_('admin.showing_results', { values: { count: indexedMovies.length, total: totalIndexedMovies } })}
								</span>
							</div>
						</div>

				{#if isLoadingIndexed}
					<div class="p-6 space-y-4">
						{#each Array(5) as _}
							<div class="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg">
								<Skeleton class="h-4 flex-1" />
								<Skeleton class="h-4 w-24" />
								<Skeleton class="h-4 w-32" />
							</div>
						{/each}
					</div>
				{:else if indexedMovies.length === 0}
					<div class="text-center py-16">
						{#if searchTermIndexed}
							<Search size={48} class="mx-auto mb-4 text-gray-500" />
							<h3 class="text-xl font-medium mb-2 text-white">{$_('admin.no_search_results')}</h3>
							<p class="text-gray-400">{$_('admin.try_different_search')}</p>
							<Button 
								onclick={clearSearchIndexed} 
								variant="outline" 
								class="mt-4 border-gray-600 text-white hover:bg-white/10"
							>
								{$_('admin.clear_search')}
							</Button>
						{:else}
							<Database size={48} class="mx-auto mb-4 text-gray-500" />
							<h3 class="text-xl font-medium mb-2 text-white">{$_('admin.no_indexed_movies')}</h3>
							<p class="text-gray-400">{$_('admin.no_indexed_movies_description')}</p>
						{/if}
					</div>
				{:else}
					<!-- Responsive Table for Indexed Movies -->
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-black/60">
								<tr class="border-b border-gray-700">
									<th class="text-left p-4 text-white font-medium">{$_('admin.table.title')}</th>
									<th class="text-left p-4 text-white font-medium">{$_('admin.table.torrent_status')}</th>
									<th class="text-left p-4 text-white font-medium">
										<button 
											onclick={() => handleSortIndexed('createdAt')}
											class="flex items-center gap-2 hover:text-red-400 transition-colors"
										>
											{$_('admin.table.created')}
											{#if sortFieldIndexed === 'createdAt'}
												{#if sortDirectionIndexed === 'asc'}
													<ArrowUp class="h-4 w-4" />
												{:else}
													<ArrowDown class="h-4 w-4" />
												{/if}
											{:else}
												<ArrowUpDown class="h-4 w-4 opacity-50" />
											{/if}
										</button>
									</th>
									<th class="text-center p-4 text-white font-medium">{$_('admin.table.actions')}</th>
								</tr>
							</thead>
							<tbody>
								{#each indexedMovies as movie, index}
									<tr class="border-b border-gray-800/50 hover:bg-black/20 transition-colors">
										<td class="p-4">
											<div>
												<div class="font-medium text-white">{movie.title || $_('admin.unknown_title')}</div>
												<div class="text-xs text-gray-400">TMDB ID: {movie.tmdbId}</div>
											</div>
										</td>
										<td class="p-4">
											<Badge 
												variant={movie.torrentAvailable ? 'default' : 'destructive'}
												class="text-xs"
											>
												{movie.torrentAvailable ? $_('admin.torrent_available') : $_('admin.torrent_unavailable')}
											</Badge>
										</td>
										<td class="p-4">
											<div class="flex items-center gap-1 text-gray-300">
												<Calendar size={14} />
												<span class="text-sm">{formatDate(movie.createdAt)}</span>
											</div>
										</td>
										<td class="p-4 text-center">
											<Button
												onclick={() => deleteIndexedMovie(movie.tmdbId)}
												variant="destructive"
												size="sm"
												disabled={isDeletingIndexed}
												class="bg-red-600 hover:bg-red-700"
											>
												<Trash2 size={14} />
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Pagination Controls for Indexed Movies -->
					<div class="border-t border-gray-700 px-6 py-4 pb-6">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<span class="text-sm text-gray-400">
									{$_('admin.showing_page', { values: { current: currentPageIndexed, total: totalPagesIndexed } })}
								</span>
								
								<div class="flex items-center gap-2">
									<span class="text-sm text-gray-400">{$_('admin.items_per_page')}:</span>
									<select 
										bind:value={itemsPerPageIndexed} 
										onchange={() => changeItemsPerPageIndexed(itemsPerPageIndexed)}
										class="bg-black/50 border border-gray-600 rounded px-2 py-1 text-white text-sm"
									>
										<option value={5}>5</option>
										<option value={10}>10</option>
										<option value={25}>25</option>
										<option value={50}>50</option>
									</select>
								</div>
							</div>

							{#if totalPagesIndexed > 1}
								<div class="flex items-center gap-2">
									<Button
										onclick={() => goToPageIndexed(1)}
										variant="outline"
										size="sm"
										disabled={!hasPrevPageIndexed || isLoadingIndexed}
										class="border-gray-600 text-white hover:bg-white/10"
									>
										<ChevronsLeft class="h-4 w-4" />
									</Button>
									
									<Button
										onclick={prevPageIndexed}
										variant="outline"
										size="sm"
										disabled={!hasPrevPageIndexed || isLoadingIndexed}
										class="border-gray-600 text-white hover:bg-white/10"
									>
										<ChevronLeft class="h-4 w-4" />
									</Button>

									<span class="px-3 py-1 text-sm text-white">
										{currentPageIndexed} / {totalPagesIndexed}
									</span>

									<Button
										onclick={nextPageIndexed}
										variant="outline"
										size="sm"
										disabled={!hasNextPageIndexed || isLoadingIndexed}
										class="border-gray-600 text-white hover:bg-white/10"
									>
										<ChevronRight class="h-4 w-4" />
									</Button>
									
									<Button
										onclick={() => goToPageIndexed(totalPagesIndexed)}
										variant="outline"
										size="sm"
										disabled={!hasNextPageIndexed || isLoadingIndexed}
										class="border-gray-600 text-white hover:bg-white/10"
									>
										<ChevronsRight class="h-4 w-4" />
									</Button>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</Card.Content>
</Card.Root>
	</div>
</div>