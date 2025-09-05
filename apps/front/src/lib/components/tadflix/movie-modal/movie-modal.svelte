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
	import { goto } from '$app/navigation';
	import { CommentContainer } from '../comments';

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
	let showAllSimilarMovies = $state(false);
	let isExpanding = $state(false);
	
	// Reference to the scrollable container
	let scrollContainer: HTMLElement;

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
				showAllSimilarMovies = false; // Reset show more state
				isExpanding = false; // Reset expansion state

				// Scroll to top when movie changes
				setTimeout(() => {
					if (scrollContainer) {
						scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
					}
				}, 50);
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

	function navigateToGenre(genreId: number) {
		closeModal(); // Close modal first
		goto(`/browse?genre=${genreId}`);
	}

	function navigateToCast(castId: number) {
		closeModal(); // Close modal first
		goto(`/browse?cast=${castId}`);
	}

	function goBack() {
		movieModalActions.goBack();

		// Scroll to top after going back
		setTimeout(() => {
			if (scrollContainer) {
				scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}, 50);
	}

	function toggleSimilarMovies() {
		if (showAllSimilarMovies) {
			// Collapsing - instant
			showAllSimilarMovies = false;
			isExpanding = false;
		} else {
			// Expanding - with animation
			isExpanding = true;
			setTimeout(() => {
				showAllSimilarMovies = true;
			}, 50);
		}
	}
</script>

<Dialog open={modalData.isOpen} onOpenChange={(open) => !open && closeModal()}>
	<DialogContent
		class="fixed inset-0 top-0 left-0 h-screen max-h-none w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-none bg-black/70 p-0"
		showCloseButton={false}
		data-dialog-content
	>
		<div
			class="h-full w-full overflow-x-hidden overflow-y-auto p-4 md:p-8"
			bind:this={scrollContainer}
			role="button"
			tabindex="0"
			onclick={(e) => {
				// Close modal if clicking on the padding area (not on the modal content)
				if (e.target === e.currentTarget) {
					closeModal();
				}
			}}
			onkeydown={(e) => {
				// Close modal on Escape key
				if (e.key === 'Escape' && e.target === e.currentTarget) {
					closeModal();
				}
			}}
		>
			<div class="mx-auto max-w-5xl overflow-hidden rounded-lg bg-[#181818] shadow-2xl">
				<div class="h-full w-full">
					{#if modalData.isLoading || (modalData.movieId && modalData.movieId !== currentMovieId) || (modalData.movieId && !movie)}
						<!-- Loading State -->
						<div class="relative">
							<!-- Loading buttons -->
							{@render topButtons()}

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
							{@render topButtons()}

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
										class="[&>div:first-child]:max-h-[40vh] [&>div:first-child]:rounded-t-lg sm:[&>div:first-child]:max-h-[45vh] md:[&>div:first-child]:max-h-[50vh]"
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
									<div
										class="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#BCBCBC] md:text-sm"
									>
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
									<!-- Cast -->
									{#if movieCredits?.cast && movieCredits.cast.length > 0}
										<div class="mb-3">
											<span class="text-sm text-[#777777]">{$_('movie-modal.cast')}: </span>
											<span class="text-sm text-white">
												{@render castList(movieCredits.cast)}
											</span>
										</div>
									{/if}

									<!-- Genres -->
									{#if movie.genres && movie.genres.length > 0}
										<div class="mb-3">
											<span class="text-sm text-[#777777]">{$_('movie-modal.genres')}: </span>
											<span class="text-sm">
												{@render genresList(movie.genres)}
											</span>
										</div>
									{/if}

									<!-- Maturity Rating -->
									{#if movie.adult !== undefined}
										<div class="mb-3">
											<span class="text-sm text-[#777777]"
												>{$_('movie-modal.maturity-rating')}:
											</span>
											<div class="inline-flex items-center">
												<div
													class="rounded border border-[#BCBCBC] px-2 py-1 text-xs text-[#BCBCBC]"
												>
													{movie.adult ? 'R' : 'PG-13'}
												</div>
											</div>
										</div>
									{/if}
								</div>
							</div>

							<!-- Comments Section -->
							{#if movie}
								<div class="mt-12">
									<CommentContainer 
										movieId={movie.id} 
										movieTitle={movie.title || movie.name || 'Unknown Movie'}
									/>
								</div>
							{/if}
							<!-- Similar Movies Section -->
							{#if similarMovies.length > 0}
								{@const itemsPerRow = 3}
								<!-- sm:grid-cols-3 means 3 items per row on larger screens -->
								{@const rowsToShow = 3}
								{@const maxItemsToShow = itemsPerRow * rowsToShow}
								<!-- 9 items = 3 rows -->
								{@const visibleMovies = showAllSimilarMovies
									? similarMovies
									: similarMovies.slice(0, maxItemsToShow)}
								{@const hasMoreMovies = similarMovies.length > maxItemsToShow}

								<div class="mt-12">
									<div class="mb-6 flex items-center gap-4">
										<h3 class="text-xl font-bold text-white">{$_('movie-modal.more-like-this')}</h3>
										<div class="h-px flex-1 bg-gray-700"></div>
									</div>

									<!-- Content container with relative positioning for overlay -->
									<div class="relative">
										<!-- Grid that shows limited items initially -->
										<div class="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:gap-4">
											{#each visibleMovies as similarMovie, index}
												{#if index < maxItemsToShow}
													<!-- Always visible items -->
													<div>
														<SimilarMovieCard movie={similarMovie} />
													</div>
												{:else if isExpanding}
													<!-- New items that slide down -->
													<div
														class="animate-slide-down opacity-0"
														style="animation-delay: {(index - maxItemsToShow) * 100}ms;"
													>
														<SimilarMovieCard movie={similarMovie} />
													</div>
												{/if}
											{/each}
										</div>

										<!-- Gradient overlay when not showing all movies -->
										{#if hasMoreMovies && !showAllSimilarMovies}
											<div
												class="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent"
											></div>
										{/if}

										<!-- Show More/Less Button - Overlayed at bottom -->
										{#if hasMoreMovies}
											<div
												class={`absolute left-1/2 z-10 -translate-x-1/2 transform ${showAllSimilarMovies ? 'bottom-0 translate-y-16' : '-bottom-4'}`}
											>
												<!-- Full-width horizontal line going through the button -->
												<div
													class="absolute top-1/2 left-1/2 h-px w-screen -translate-x-1/2 -translate-y-1/2 bg-gray-600"
												></div>
												<button
													onclick={toggleSimilarMovies}
													class="group relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white bg-gradient-to-b from-black/60 to-black/80 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-white hover:from-black/70 hover:to-black/90 hover:text-white hover:shadow-xl"
													aria-label={showAllSimilarMovies
														? 'Show less'
														: `Show ${similarMovies.length - maxItemsToShow} more similar movies`}
												>
													<svg
														class={`h-6 w-6 transition-transform duration-500 ease-out ${showAllSimilarMovies ? 'rotate-180' : 'rotate-0'}`}
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2.5"
															d="M19 9l-7 7-7-7"
														/>
													</svg>
												</button>
											</div>
										{/if}
									</div>
								</div>
							{/if}

							<!-- About Section -->
							{#if movie}
								<div class={`${showAllSimilarMovies ? 'mt-24' : 'mt-12'}`}>
									<div class="mb-6 flex items-center gap-4">
										<h3 class="text-xl font-bold text-white">{$_('movie-modal.about')}</h3>
										<span class="text-lg text-white">{movie.title || movie.name}</span>
									</div>

									<div class="space-y-3">
										<!-- Director -->
										{#if movieCredits?.crew}
											{@const directors = movieCredits.crew.filter(
												(member) => member.job === 'Director'
											)}
											{#if directors.length > 0}
												<div class="text-sm">
													<span class="text-[#777777]">{$_('movie-modal.director')}: </span>
													<span class="text-white">
														{@render directorsList(directors)}
													</span>
												</div>
											{/if}
										{/if}

										<!-- Cast -->
										{#if movieCredits?.cast && movieCredits.cast.length > 0}
											<div class="text-sm">
												<span class="text-[#777777]">{$_('movie-modal.cast')}: </span>
												<span class="text-white">
													{@render castList(movieCredits.cast)}
												</span>
											</div>
										{/if}

										<!-- Genres -->
										{#if movie.genres && movie.genres.length > 0}
											<div class="text-sm">
												<span class="text-[#777777]">{$_('movie-modal.genres')}: </span>
												<span>
													{@render genresList(movie.genres)}
												</span>
											</div>
										{/if}

										<!-- Maturity Rating -->
										{#if movie.adult !== undefined}
											<div class="flex items-center gap-3 text-sm">
												<span class="text-[#777777]">{$_('movie-modal.maturity-rating')}:</span>
												<div class="flex items-center gap-2">
													<div
														class="rounded border border-[#BCBCBC] px-2 py-1 text-xs text-[#BCBCBC]"
													>
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
				</div>
			</div>
		</div>
	</DialogContent>
</Dialog>

{#snippet genresList(genres: Array<{ id: number; name: string }>)}
	{#if genres && genres.length > 0}
		{#each genres as genre, i}
			<button
				onclick={() => navigateToGenre(genre.id)}
				class="cursor-pointer text-white underline-offset-2 transition-colors hover:text-gray-300 hover:underline"
			>
				{genre.name}</button
			>{#if i < genres.length - 1},&nbsp;{/if}
		{/each}
	{/if}
{/snippet}

{#snippet directorsList(directors: Array<{ name: string }>)}
	{#if directors && directors.length > 0}
		{#each directors as director, i}
			<span class="text-white"> {director.name}</span>{#if i < directors.length - 1},&nbsp;{/if}
		{/each}
	{/if}
{/snippet}

{#snippet castList(cast: Array<{ id: number; name: string }>)}
	{#if cast && cast.length > 0}
		{#each cast.slice(0, 4) as actor, i}
			<button
				onclick={() => navigateToCast(actor.id)}
				class="cursor-pointer text-white underline-offset-2 transition-colors hover:text-gray-300 hover:underline"
			>
				{actor.name}</button
			>{#if i < cast.slice(0, 4).length - 1},&nbsp;{/if}
		{/each}
	{/if}
{/snippet}

{#snippet topButtons()}
	<div class="absolute top-2 right-2 z-50 flex gap-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
		{#if modalData.history.length > 0}
			<button
				onclick={goBack}
				class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-black md:h-9 md:w-9"
				aria-label={$_('movie-modal.go-back')}
			>
				<ArrowLeft size={20} class="text-white md:size-[22px]" />
			</button>
		{/if}

		<button
			onclick={closeModal}
			class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-black md:h-9 md:w-9"
		>
			<X size={20} class="text-white md:size-[22px]" />
		</button>
	</div>
{/snippet}

<style>
	@keyframes slide-down {
		from {
			opacity: 0;
			transform: translateY(-30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-slide-down {
		animation: slide-down 0.8s ease-out forwards;
	}

	/* Override default dialog positioning to ensure full-screen behavior */
	:global([data-dialog-content]) {
		position: fixed !important;
		inset: 0 !important;
		width: 100vw !important;
		height: 100vh !important;
		max-width: none !important;
		max-height: none !important;
		transform: none !important;
		top: 0 !important;
		left: 0 !important;
		right: 0 !important;
		bottom: 0 !important;
	}

	/* Enhance the modal backdrop effect */
	:global([data-dialog-overlay]) {
		background-color: rgba(0, 0, 0, 0.8) !important;
	}

	/* Ensure smooth scrolling for the modal content */
	:global([data-dialog-content] > div) {
		scroll-behavior: smooth;
	}
</style>
