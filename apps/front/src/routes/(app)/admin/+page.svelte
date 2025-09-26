<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { Input } from '@/components/ui/input';
	import { Badge } from '@/components/ui/badge';
	import { Checkbox } from '@/components/ui/checkbox';
	import { Trash2, Download, Calendar, HardDrive, AlertTriangle, Search, Film, Database, Users, RefreshCw } from 'lucide-svelte';
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

	let movies: DownloadedMovie[] = $state([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedMovies = $state<Set<number>>(new Set());
	let isDeleting = $state(false);
	let searchTerm = $state('');
	let totalSize = $state(0);

	// Filtered movies based on search
	let filteredMovies = $derived.by(() => {
		if (!searchTerm.trim()) return movies;
		return movies.filter(movie => 
			movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			movie.tmdbId.toString().includes(searchTerm)
		);
	});

	// Fetch movies list
	async function fetchMovies() {
		isLoading = true;
		error = null;
		
		try {
			const response = await fetch('/api/admin/movies', {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			if (result.success) {
				movies = result.movies;
				// Calculate total size
				totalSize = movies.reduce((total, movie) => total + (movie.sizeInBytes || 0), 0);
			} else {
				throw new Error('Failed to fetch movies');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred';
			console.error('Error fetching movies:', err);
		} finally {
			isLoading = false;
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
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			if (result.success) {
				// Remove the movie from the list
				movies = movies.filter(movie => movie.tmdbId !== tmdbId);
				selectedMovies.delete(tmdbId);
			} else {
				throw new Error(result.message || 'Failed to delete movie');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred';
			console.error('Error deleting movie:', err);
		} finally {
			isDeleting = false;
		}
	}

	// Delete all movies
	async function deleteAllMovies() {
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
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			if (result.success) {
				movies = [];
				selectedMovies.clear();
			} else {
				throw new Error(result.message || 'Failed to delete all movies');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred';
			console.error('Error deleting all movies:', err);
		} finally {
			isDeleting = false;
		}
	}

	// Delete selected movies
	async function deleteSelectedMovies() {
		if (selectedMovies.size === 0) return;
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
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const result = await response.json();
				if (!result.success) {
					throw new Error(result.message || 'Failed to delete movie');
				}
			} catch (err) {
				const movie = movies.find(m => m.tmdbId === tmdbId);
				errors.push(`${movie?.title || tmdbId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
			}
		}

		// Refresh the list
		await fetchMovies();
		selectedMovies.clear();

		if (errors.length > 0) {
			error = `Some movies could not be deleted:\n${errors.join('\n')}`;
		}

		isDeleting = false;
	}

	// Utility functions
	function formatBytes(bytes?: number): string {
		if (!bytes) return 'N/A';
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes === 0) return '0 Bytes';
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Never';
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
		if (selectedMovies.has(tmdbId)) {
			selectedMovies.delete(tmdbId);
		} else {
			selectedMovies.add(tmdbId);
		}
	}

	function selectAll() {
		if (selectedMovies.size === filteredMovies.length) {
			selectedMovies.clear();
		} else {
			selectedMovies = new Set(filteredMovies.map(m => m.tmdbId));
		}
	}

	$effect(() => {
		fetchMovies();
	});
</script>

<svelte:head>
	<title>{$_('admin.title')} - HyperTube</title>
</svelte:head>

<!-- Netflix-style background -->
<div 
	class="min-h-screen bg-cover bg-center bg-no-repeat relative text-white"
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
							<p class="text-3xl font-bold text-white">{movies.length}</p>
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
							<p class="text-3xl font-bold text-white">{formatBytes(totalSize)}</p>
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
						<Users class="h-8 w-8 text-green-500" />
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

		<!-- Controls -->
		<Card.Root class="mb-8 bg-black/40 border-gray-700 backdrop-blur-sm">
			<Card.Content class="p-6">
				<!-- Search and Actions Row -->
				<div class="flex flex-col lg:flex-row gap-4 mb-6">
					<!-- Search -->
					<div class="flex-1 relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<Input
							bind:value={searchTerm}
							placeholder={$_('admin.search_placeholder')}
							class="pl-10 bg-black/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
						/>
					</div>

					<!-- Action Buttons -->
					<div class="flex gap-2">
						<Button 
							onclick={fetchMovies} 
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
								{selectedMovies.size === filteredMovies.length ? $_('admin.deselect_all') : $_('admin.select_all')}
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
						{$_('admin.showing_results', { values: { count: filteredMovies.length, total: movies.length } })}
					</span>
					{#if totalSize > 0}
						<span class="flex items-center gap-1">
							<HardDrive class="h-4 w-4" />
							{$_('admin.total_storage')}: {formatBytes(totalSize)}
						</span>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Movies Grid/Table -->
		<Card.Root class="bg-black/40 border-gray-700 backdrop-blur-sm">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-white">
					<Download class="h-5 w-5 text-red-500" />
					{$_('admin.downloaded_movies')}
				</Card.Title>
			</Card.Header>
			<Card.Content class="p-0">
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
				{:else if filteredMovies.length === 0}
					<div class="text-center py-16">
						{#if searchTerm}
							<Search size={48} class="mx-auto mb-4 text-gray-500" />
							<h3 class="text-xl font-medium mb-2 text-white">{$_('admin.no_search_results')}</h3>
							<p class="text-gray-400">{$_('admin.try_different_search')}</p>
							<Button 
								onclick={() => searchTerm = ''} 
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
											checked={selectedMovies.size === filteredMovies.length && filteredMovies.length > 0}
											onCheckedChange={selectAll}
											class="border-gray-600"
										/>
									</th>
									<th class="text-left p-4 text-white font-medium">{$_('admin.table.title')}</th>
									<th class="text-left p-4 text-white font-medium">{$_('admin.table.status')}</th>
									<th class="text-left p-4 text-white font-medium">{$_('admin.table.resolutions')}</th>
									<th class="text-left p-4 text-white font-medium">{$_('admin.table.size')}</th>
									<th class="text-left p-4 text-white font-medium">{$_('admin.table.last_accessed')}</th>
									<th class="text-left p-4 text-white font-medium">{$_('admin.table.created')}</th>
									<th class="text-center p-4 text-white font-medium">{$_('admin.table.actions')}</th>
								</tr>
							</thead>
							<tbody>
								{#each filteredMovies as movie, index}
									<tr class="border-b border-gray-800/50 hover:bg-black/20 transition-colors">
										<td class="p-4">
											<Checkbox
												checked={selectedMovies.has(movie.tmdbId)}
												onCheckedChange={() => toggleMovieSelection(movie.tmdbId)}
												class="border-gray-600"
											/>
										</td>
										<td class="p-4">
											<div>
												<div class="font-medium text-white">{movie.title || 'Unknown Title'}</div>
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
													class="text-xs"
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
												disabled={isDeleting}
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
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>