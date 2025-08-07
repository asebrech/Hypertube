<script lang="ts">
	import { Dialog, DialogContent } from '@/components/ui/dialog';
	import { movieModal, movieModalActions, movieDataCache } from '@/services/store';
	import {
		getMovieDetails,
		getMovieVideos,
		getLogoImage,
		getSimilarMovies,
		getPosterImage,
		getMovieCredits
	} from '@/services/api';
	import type {
		BackDropImage,
		MovieDetails,
		MovieVideo,
		MovieType,
		Movie,
		MovieCredits
	} from '@hypertube/shared';
	import { X, Plus, ThumbsUp, ArrowLeft, Play } from 'lucide-svelte';
	import { SimilarMovieCard } from '../similar-movie-card';
	import { MovieBadges } from '../movie-badges';
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
	let movieCredits: MovieCredits | undefined = $state(undefined);
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
				movieCredits = undefined;
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
				movieCredits = cachedData.credits;
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
			const totalLoads = 5; // details, video, logo, credits, similar movies
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
					if (
						!signal.aborted &&
						modalData.movieId === currentMovieForThisEffect &&
						modalData.movieId === currentMovieId
					) {
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
					if (
						!signal.aborted &&
						modalData.movieId === currentMovieForThisEffect &&
						modalData.movieId === currentMovieId
					) {
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
						if (
							modalData.movieId === currentMovieForThisEffect &&
							modalData.movieId === currentMovieId
						) {
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
					if (
						!signal.aborted &&
						modalData.movieId === currentMovieForThisEffect &&
						modalData.movieId === currentMovieId
					) {
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

			getMovieCredits(modalData.movieId, modalData.type)
				.then((data) => {
					// Only update if we're still on the same movie and not aborted
					if (
						!signal.aborted &&
						modalData.movieId === currentMovieForThisEffect &&
						modalData.movieId === currentMovieId
					) {
						movieCredits = data;
						dataToCache.credits = data;
						updateCache(cacheKey, dataToCache);
					}
				})
				.catch((error) => {
					if (!signal.aborted) {
						console.error('Error fetching movie credits:', error);
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
					if (
						!signal.aborted &&
						modalData.movieId === currentMovieForThisEffect &&
						modalData.movieId === currentMovieId
					) {
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
		movieDataCache.update((cache) => ({
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
		class="h-full max-h-none w-full max-w-none gap-0 overflow-y-auto rounded-none border-none bg-[#181818] p-0 sm:max-w-[calc(100vw-2rem)] md:max-h-[95vh] md:max-w-[850px] md:rounded-lg"
		showCloseButton={false}
		data-dialog-content
	>
		{#if modalData.isLoading || (modalData.movieId && modalData.movieId !== currentMovieId) || (modalData.movieId && !movie)}
			<!-- Loading State -->
			<div class="relative">
				<!-- Loading buttons -->
				<div class="absolute top-2 right-2 z-50 flex gap-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
					{#if modalData.history.length > 0}
						<button
							onclick={goBack}
							class="flex h-8 w-8 items-center justify-center rounded-full border-none bg-[#2A2A2A] opacity-75 transition-opacity hover:opacity-100 md:h-9 md:w-9"
							aria-label={$_('movie-modal.go-back')}
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
				<div class="relative max-h-[50vh] bg-neutral-800 md:max-h-[60vh]">
					<Skeleton class="h-full min-h-[300px] w-full rounded-none md:min-h-[400px]" />

					<!-- Loading logo area -->
					<div
						class="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 lg:bottom-12 lg:left-12"
					>
						<Skeleton class="mb-4 h-12 w-48 md:h-16 md:w-64" />
						<div class="flex gap-2">
							<Skeleton class="h-10 w-24 rounded-md" />
							<Skeleton class="h-10 w-10 rounded-full" />
							<Skeleton class="h-10 w-10 rounded-full" />
						</div>
					</div>
				</div>
			</div>

			<!-- Loading Content -->
			<div class="p-3 sm:p-4 md:p-8 lg:p-12">
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
					<div class="mb-6 flex items-center gap-4">
						<Skeleton class="h-6 w-32" />
						<div class="h-px flex-1 bg-gray-700"></div>
					</div>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
						{#each Array(3) as _}
							<div class="w-full overflow-hidden rounded-lg bg-neutral-800">
								<Skeleton class="aspect-[2/3] w-full" />
								<div class="space-y-2 p-3">
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
				<div class="absolute top-2 right-2 z-50 flex gap-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
					<!-- Back Button (only show if there's history) -->
					{#if modalData.history.length > 0}
						<button
							onclick={goBack}
							class="flex h-8 w-8 items-center justify-center rounded-full border-none bg-[#2A2A2A] opacity-75 transition-opacity hover:opacity-100 md:h-9 md:w-9"
							aria-label={$_('movie-modal.go-back')}
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
					{#if modalData.type}
						<MovieBanner
							{movie}
							type={modalData.type}
							logo={movieLogo}
							{movieVideo}
							showDescription={false}
							showMoreInfoButton={false}
							showVoteAverage={false}
							class="[&>div:first-child]:max-h-[40vh] [&>div:first-child]:rounded-none sm:[&>div:first-child]:max-h-[45vh] md:[&>div:first-child]:max-h-[50vh]"
						>
							{#snippet customActions()}
								{@render actionButtons()}
							{/snippet}
						</MovieBanner>
					{/if}
				{/key}
			</div>

			<!-- Movie Info Section -->
			<div class="p-3 sm:p-4 md:p-8 lg:p-12">
				<div class="flex flex-col gap-8 lg:flex-row lg:gap-16">
					<!-- Left Column - Main Info -->
					<div class="flex-1">
						<!-- Movie Details -->
						<div class="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#BCBCBC] md:text-sm">
							{#if movie.release_date}
								{@const releaseDate = new Date(movie.release_date)}
								{@const thirtyDaysAgo = new Date()}
								{@const __ = thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)}
								{#if releaseDate > thirtyDaysAgo}
									<span class="font-medium text-[#46D369]">{$_('movie-modal.new')}</span>
								{/if}
							{/if}
							{#if movie.runtime}
								<span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
							{/if}
							{#if movie.release_date}
								<span>{new Date(movie.release_date).getFullYear()}</span>
							{/if}

							<MovieBadges {movie} />
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
								<span class="text-sm text-[#777777]">{$_('movie-modal.genres')}: </span>
								<span class="text-sm text-white">
									{movie.genres.map((g: any) => g.name).join(', ')}
								</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Similar Movies Section -->
				{#if similarMovies.length > 0}
					<div class="mt-12">
						<div class="mb-6 flex items-center gap-4">
							<h3 class="text-xl font-bold text-white">{$_('movie-modal.more-like-this')}</h3>
							<div class="h-px flex-1 bg-gray-700"></div>
						</div>
						<!-- Netflix-style scrollable grid with fixed height showing exactly 3 rows -->
						<div
							class="scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 overflow-y-auto"
							style="height: 650px;"
						>
							<div class="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:gap-4">
								{#each similarMovies as similarMovie}
									<SimilarMovieCard
										movie={similarMovie}
										posterUrl={similarMovie.poster_path
											? `https://image.tmdb.org/t/p/w500${similarMovie.poster_path}`
											: undefined}
									/>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- About Section -->
				{#if movie}
					<div class="mt-12">
						<div class="mb-6 flex items-center gap-4">
							<h3 class="text-xl font-bold text-white">{$_('movie-modal.about')}</h3>
							<span class="text-lg text-white">{movie.title || movie.name}</span>
						</div>

						<div class="space-y-3">
							<!-- Director -->
							{#if movieCredits?.crew}
								{@const directors = movieCredits.crew.filter((member) => member.job === 'Director')}
								{#if directors.length > 0}
									<div class="text-sm">
										<span class="text-[#777777]">{$_('movie-modal.director')}: </span>
										<span class="text-white">
											{directors.map((d) => d.name).join(', ')}
										</span>
									</div>
								{/if}
							{/if}

							<!-- Cast -->
							{#if movieCredits?.cast && movieCredits.cast.length > 0}
								<div class="text-sm">
									<span class="text-[#777777]">{$_('movie-modal.cast')}: </span>
									<span class="text-white">
										{movieCredits.cast
											.slice(0, 14)
											.map((actor) => actor.name)
											.join(', ')}
									</span>
								</div>
							{/if}

							<!-- Genres -->
							{#if movie.genres && movie.genres.length > 0}
								<div class="text-sm">
									<span class="text-[#777777]">{$_('movie-modal.genres')}: </span>
									<span class="text-white">
										{movie.genres.map((g) => g.name).join(', ')}
									</span>
								</div>
							{/if}

							<!-- Maturity Rating -->
							{#if movie.adult !== undefined}
								<div class="flex items-center gap-3 text-sm">
									<span class="text-[#777777]">{$_('movie-modal.maturity-rating')}:</span>
									<div class="flex items-center gap-2">
										<div class="rounded border border-[#BCBCBC] px-2 py-1 text-xs text-[#BCBCBC]">
											{movie.adult ? 'R' : 'PG-13'}
										</div>
										<span class="text-white">
											{movie.adult
												? $_('movie-modal.mature-audiences')
												: $_('movie-modal.audiences-13')}
										</span>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</DialogContent>
</Dialog>
