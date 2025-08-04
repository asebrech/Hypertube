<script lang="ts">
	import { Dialog, DialogContent } from '@/components/ui/dialog';
	import { movieModal, movieModalActions, movieDataCache } from '@/services/store';
	import { getMovieDetails, getMovieVideos, getLogoImage, getSimilarMovies, getPosterImage } from '@/services/api';
	import type { BackDropImage, MovieDetails, MovieVideo, MovieType, Movie } from '@hypertube/shared';
	import { X, Plus, ThumbsUp, ArrowLeft, Play } from 'lucide-svelte';
	import { SimilarMovieCard } from '../similar-movie-card';
	import MovieBanner from '../movie-banner/MovieBanner.svelte';
	import ButtonPreview from '../buttons/button-preview/button-preview.svelte';
	import { Button } from '@/components/ui/button';
	import { Skeleton } from '@/components/ui/skeleton';
	import { _ } from 'svelte-i18n';
	import { get } from 'svelte/store';

	// Store subscription
	let modalData = $state({
		isOpen: false,
		movieId: undefined as number | undefined,
		type: undefined as MovieType | undefined,
		history: [] as Array<{ movieId: number; type: MovieType }>,
		isLoading: false
	});

	// Movie data
	let movie: MovieDetails | undefined = $state(undefined);
	let movieVideo: MovieVideo | undefined = $state(undefined);
	let movieLogo: BackDropImage | undefined = $state(undefined);
	let similarMovies: Movie[] = $state([]);
	let currentMovieId: number | undefined = $state(undefined);

	// Subscribe to modal store
	$effect(() => {
		const unsubscribe = movieModal.subscribe((value) => {
			modalData = {
				isOpen: value.isOpen,
				movieId: value.movieId,
				type: value.type,
				history: value.history,
				isLoading: value.isLoading
			};
		});
		return unsubscribe;
	});

	// Load movie data when modal opens
	$effect(() => {
		if (modalData.movieId && modalData.type) {
			// If this is a different movie, clear the current data immediately
			if (currentMovieId !== modalData.movieId) {
				currentMovieId = modalData.movieId;
				movie = undefined;
				movieVideo = undefined;
				movieLogo = undefined;
				similarMovies = [];
			}

			const cacheKey = `${modalData.movieId}_${modalData.type}`;
			// Get current cache value directly from store (not reactive)
			const currentCache = get(movieDataCache);
			const cachedData = currentCache[cacheKey];

			if (cachedData && cachedData.details) {
				// Use cached data - instant loading
				movie = cachedData.details;
				// Handle cached video - if it's null in cache, that means no video exists
				movieVideo = cachedData.video === null ? undefined : cachedData.video;
				movieLogo = cachedData.logo;
				similarMovies = cachedData.similarMovies || [];
				
				// Set loading to false immediately since we have cached data
				setTimeout(() => movieModalActions.setLoading(false), 0);
				return; // Exit early to prevent duplicate loading
			}

			// Create AbortController for this effect's requests
			const abortController = new AbortController();
			const signal = abortController.signal;

			// Only proceed with API calls if we don't have cached data
			// Load fresh data and cache it
			const dataToCache: any = {};
			let loadedCount = 0;
			const totalLoads = 4; // details, video, logo, similar movies
			const currentMovieForThisEffect = modalData.movieId; // Capture the current movie ID

			const checkAllLoaded = () => {
				loadedCount++;
				if (loadedCount >= totalLoads) {
					// Only set loading to false if we're still on the same movie and not aborted
					if (modalData.movieId === currentMovieForThisEffect && !signal.aborted) {
						movieModalActions.setLoading(false);
					}
				}
			};

			getMovieDetails(modalData.movieId, modalData.type)
				.then((data) => {
					// Only update if we're still on the same movie and not aborted
					if (!signal.aborted && modalData.movieId === currentMovieForThisEffect && modalData.movieId === currentMovieId) {
						movie = data;
						dataToCache.details = data;
						updateCache(cacheKey, dataToCache);
					}
				})
				.catch((error) => {
					if (!signal.aborted) {
						console.error('Error fetching movie details:', error);
					}
				})
				.finally(() => {
					// Only count as loaded if still on same movie and not aborted
					if (!signal.aborted && modalData.movieId === currentMovieForThisEffect) {
						checkAllLoaded();
					}
				});

			getMovieVideos(modalData.movieId, modalData.type)
				.then((data) => {
					// Only update if we're still on the same movie and not aborted
					if (!signal.aborted && modalData.movieId === currentMovieForThisEffect && modalData.movieId === currentMovieId) {
						// Only set movieVideo if data exists and has valid video
						if (data && data.key) {
							movieVideo = data;
							dataToCache.video = data;
						} else {
							movieVideo = undefined;
							dataToCache.video = null; // Cache that no video exists
						}
						updateCache(cacheKey, dataToCache);
					}
				})
				.catch((error) => {
					if (!signal.aborted) {
						console.error('Error fetching movie video:', error);
						if (modalData.movieId === currentMovieForThisEffect && modalData.movieId === currentMovieId) {
							movieVideo = undefined;
							dataToCache.video = null;
							updateCache(cacheKey, dataToCache);
						}
					}
				})
				.finally(() => {
					// Only count as loaded if still on same movie and not aborted
					if (!signal.aborted && modalData.movieId === currentMovieForThisEffect) {
						checkAllLoaded();
					}
				});

			getLogoImage(modalData.movieId, 'original', modalData.type)
				.then((data) => {
					// Only update if we're still on the same movie and not aborted
					if (!signal.aborted && modalData.movieId === currentMovieForThisEffect && modalData.movieId === currentMovieId) {
						movieLogo = data;
						dataToCache.logo = data;
						updateCache(cacheKey, dataToCache);
					}
				})
				.catch((error) => {
					if (!signal.aborted) {
						console.error('Error fetching movie logo:', error);
					}
				})
				.finally(() => {
					// Only count as loaded if still on same movie and not aborted
					if (!signal.aborted && modalData.movieId === currentMovieForThisEffect) {
						checkAllLoaded();
					}
				});

			getSimilarMovies(modalData.movieId, 1, modalData.type)
				.then((data) => {
					// Only update if we're still on the same movie and not aborted
					if (!signal.aborted && modalData.movieId === currentMovieForThisEffect && modalData.movieId === currentMovieId) {
						similarMovies = data.movies;
						dataToCache.similarMovies = data.movies;
						updateCache(cacheKey, dataToCache);
					}
				})
				.catch((error) => {
					if (!signal.aborted) {
						console.error('Error fetching similar movies:', error);
					}
				})
				.finally(() => {
					// Only count as loaded if still on same movie and not aborted
					if (!signal.aborted && modalData.movieId === currentMovieForThisEffect) {
						checkAllLoaded();
					}
				});

			// Return cleanup function to abort requests when effect re-runs
			return () => {
				abortController.abort();
			};
		}
	});

	function updateCache(cacheKey: string, newData: any) {
		movieDataCache.update(cache => ({
			...cache,
			[cacheKey]: { ...cache[cacheKey], ...newData }
		}));
	}

	function closeModal() {
		movieModalActions.close();
	}

	function goBack() {
		movieModalActions.goBack();
		
		// Scroll to top after going back
		setTimeout(() => {
			const modalContent = document.querySelector('[data-dialog-content]');
			if (modalContent) {
				modalContent.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}, 50);
	}
</script>

<Dialog open={modalData.isOpen} onOpenChange={(open) => !open && closeModal()}>
	<DialogContent
		class="h-full max-h-none w-full max-w-none gap-0 overflow-y-auto border-none bg-[#181818] p-0 md:max-h-[95vh] md:max-w-[850px] md:rounded-lg"
		showCloseButton={false}
		data-dialog-content
	>
		{#if modalData.isLoading || (modalData.movieId && modalData.movieId !== currentMovieId) || (modalData.movieId && !movie)}
			<!-- Loading State -->
			<div class="relative">
				<!-- Loading buttons -->
				<div class="absolute top-2 right-2 z-50 md:top-4 md:right-4 flex gap-2">
					{#if modalData.history.length > 0}
						<button
							onclick={goBack}
							class="flex h-8 w-8 items-center justify-center rounded-full border-none bg-[#2A2A2A] opacity-75 transition-opacity hover:opacity-100 md:h-9 md:w-9"
							aria-label="Go back to previous movie"
						>
							<ArrowLeft size={20} class="text-white md:size-[22px]" />
						</button>
					{/if}
					
					<button
						onclick={closeModal}
						class="flex h-8 w-8 items-center justify-center rounded-full border-none bg-[#2A2A2A] opacity-75 transition-opacity hover:opacity-100 md:h-9 md:w-9"
					>
						<X size={20} class="text-white md:size-[22px]" />
					</button>
				</div>

				<!-- Loading Banner -->
				<div class="relative max-h-[50vh] md:max-h-[60vh] bg-neutral-800">
					<Skeleton class="w-full h-full min-h-[300px] md:min-h-[400px] rounded-none" />
					
					<!-- Loading logo area -->
					<div class="absolute bottom-8 left-8 md:bottom-12 md:left-12">
						<Skeleton class="h-12 w-48 md:h-16 md:w-64 mb-4" />
						<div class="flex gap-2">
							<Skeleton class="h-10 w-24 rounded-md" />
							<Skeleton class="h-10 w-10 rounded-full" />
							<Skeleton class="h-10 w-10 rounded-full" />
						</div>
					</div>
				</div>
			</div>

			<!-- Loading Content -->
			<div class="p-4 md:p-8 lg:p-12">
				<div class="flex flex-col gap-8 lg:flex-row lg:gap-16">
					<!-- Left Column Loading -->
					<div class="flex-1">
						<div class="mb-4 flex flex-wrap items-center gap-2">
							<Skeleton class="h-4 w-8" />
							<Skeleton class="h-4 w-12" />
							<Skeleton class="h-4 w-10" />
							<Skeleton class="h-6 w-8" />
						</div>
						
						<div class="space-y-2">
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-3/4" />
						</div>
					</div>

					<!-- Right Column Loading -->
					<div class="w-full shrink-0 lg:w-60">
						<div class="mb-3">
							<Skeleton class="h-4 w-full" />
						</div>
						<Skeleton class="h-4 w-4/5" />
					</div>
				</div>

				<!-- Loading Similar Movies Section -->
				<div class="mt-12">
					<div class="flex items-center gap-4 mb-6">
						<Skeleton class="h-6 w-32" />
						<div class="flex-1 h-px bg-gray-700"></div>
					</div>
					<div class="grid gap-4 grid-cols-3">
						{#each Array(3) as _}
							<div class="w-full bg-neutral-800 rounded-lg overflow-hidden">
								<Skeleton class="w-full aspect-[2/3]" />
								<div class="p-3 space-y-2">
									<Skeleton class="h-4 w-3/4" />
									<div class="flex items-center gap-2">
										<Skeleton class="h-3 w-8" />
										<Skeleton class="h-4 w-6" />
									</div>
									<div class="space-y-1">
										<Skeleton class="h-3 w-full" />
										<Skeleton class="h-3 w-2/3" />
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{:else if movie}
			<!-- Actual Content -->
			<div class="relative">
				<div class="absolute top-2 right-2 z-50 md:top-4 md:right-4 flex gap-2">
					<!-- Back Button (only show if there's history) -->
					{#if modalData.history.length > 0}
						<button
							onclick={goBack}
							class="flex h-8 w-8 items-center justify-center rounded-full border-none bg-[#2A2A2A] opacity-75 transition-opacity hover:opacity-100 md:h-9 md:w-9"
							aria-label="Go back to previous movie"
						>
							<ArrowLeft size={20} class="text-white md:size-[22px]" />
						</button>
					{/if}
					
					<!-- Close Button -->
					<button
						onclick={closeModal}
						class="flex h-8 w-8 items-center justify-center rounded-full border-none bg-[#2A2A2A] opacity-75 transition-opacity hover:opacity-100 md:h-9 md:w-9"
					>
						<X size={20} class="text-white md:size-[22px]" />
					</button>
				</div>

				<!-- Reusable action buttons snippet -->
				{#snippet actionButtons()}
					<!-- Add Button -->
					<ButtonPreview variant="outline">
						<Plus size={16} />
					</ButtonPreview>

					<!-- Like Button -->
					<ButtonPreview variant="outline">
						<ThumbsUp size={16} />
					</ButtonPreview>
				{/snippet}

				<!-- MovieBanner Component -->
				{#key `${movie.id}_${modalData.movieId}_${movieVideo?.key || 'no-video'}_${movie.backdrop_path || 'no-backdrop'}_${movie.poster_path || 'no-poster'}_${movieLogo?.url || 'no-logo'}`}
					{#if movie.backdrop_path}
						<MovieBanner
							{movie}
							logo={movieLogo}
							{movieVideo}
							showDescription={false}
							showMoreInfoButton={false}
							showVoteAverage={false}
							class="max-h-[50vh] md:max-h-[60vh] [&>div:first-child]:rounded-none"
						>
							{#snippet customActions()}
								{@render actionButtons()}
							{/snippet}
						</MovieBanner>
					{:else}
						<!-- Fallback Banner when no backdrop image -->
						<div class="relative max-h-[50vh] md:max-h-[60vh] flex items-end overflow-hidden">
							{#if movie.poster_path}
								<!-- Use poster as background if available -->
								<img 
									src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
									alt={movie.title || movie.name}
									class="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
								/>
								<!-- Dark overlay for poster background -->
								<div class="absolute inset-0 bg-black/60"></div>
							{:else}
								<!-- Pure gradient fallback when no images available -->
								<div class="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900"></div>
							{/if}
							
							<!-- Bottom gradient overlay (always present) -->
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
							
							<!-- Fallback content -->
							<div class="relative z-10 p-8 md:p-12 w-full">
								<!-- Movie Logo or Title -->
								{#if movieLogo?.url}
									<img 
										src={movieLogo.url} 
										alt={movie.title || movie.name}
										class="h-16 md:h-20 mb-6 max-w-xs object-contain"
									/>
								{:else}
									<h1 class="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-2xl drop-shadow-lg">
										{movie.title || movie.name}
									</h1>
								{/if}

								<!-- Action Buttons -->
								<div class="flex items-center gap-3">
									<!-- Play Button (same as MovieBanner) -->
									<Button
										class="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-[4px]"
									>
										<Play fill={'black'} />Lecture
									</Button>

									{@render actionButtons()}
								</div>
							</div>
						</div>
					{/if}
				{/key}
			</div>

			<!-- Movie Info Section -->
			<div class="p-4 md:p-8 lg:p-12">
				<div class="flex flex-col gap-8 lg:flex-row lg:gap-16">
					<!-- Left Column - Main Info -->
					<div class="flex-1">
						<!-- Movie Details -->
						<div class="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#BCBCBC] md:text-sm">
							{#if movie.vote_average}
								<span class="font-medium text-[#46D369]">New</span>
							{/if}
							{#if movie.runtime}
								<span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
							{/if}
							{#if movie.release_date}
								<span>{new Date(movie.release_date).getFullYear()}</span>
							{/if}
							<div class="border border-[#808080] px-1.5 py-0.5 text-xs">
								<span class="text-[#E5E5E5]">HD</span>
							</div>
						</div>

						<!-- Description -->
						{#if movie.overview}
							<p class="mb-4 text-sm leading-relaxed text-white md:text-base">
								{movie.overview}
							</p>
						{/if}
					</div>

					<!-- Right Column - Cast & Genres -->
					<div class="w-full shrink-0 lg:w-60">
						{#if movie.genres && movie.genres.length > 0}
							<div class="mb-3">
								<span class="text-sm text-[#777777]">Genres: </span>
								<span class="text-sm text-white">
									{movie.genres.map((g: any) => g.name).join(', ')}
								</span>
							</div>
						{/if}

						<!-- Additional info could go here -->
						<div class="text-sm text-[#777777]">This show is: Dark, Suspenseful, Exciting</div>
					</div>
				</div>

				<!-- Similar Movies Section -->
				{#if similarMovies.length > 0}
					<div class="mt-12">
						<div class="flex items-center gap-4 mb-6">
							<h3 class="text-xl font-bold text-white">More Like This</h3>
							<div class="flex-1 h-px bg-gray-700"></div>
						</div>
						<div class="grid gap-4 grid-cols-3">
							{#each similarMovies as similarMovie}
								<SimilarMovieCard 
									movie={similarMovie} 
									posterUrl={similarMovie.poster_path ? `https://image.tmdb.org/t/p/w500${similarMovie.poster_path}` : undefined}
								/>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</DialogContent>
</Dialog>
