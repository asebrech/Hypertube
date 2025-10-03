<script lang="ts">
	import { goto } from '$app/navigation';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getMovieDetails, getMovieVideos, setBookmark } from '@/services/api';
	import { movieModalActions } from '@/services/store';
	import type { MovieDetails, MovieType, MovieVideo } from '@hypertube/shared';
	import { onMount } from 'svelte';
	import ButtonPreview from '$lib/components/tadflix/buttons/button-preview/button-preview.svelte';
	import { MovieBadges } from '$lib/components/tadflix/movie-badges';
	import { Play, Plus, ChevronDown, Languages, VolumeOff, Volume2, RotateCw } from 'lucide-svelte';
	import Icon from '@/assets/datflix-small.svelte';
	import { Dot } from 'lucide-svelte';
	import { locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import Check from '@lucide/svelte/icons/check';

	const { movieId, type = 'movie', data, isBookmarked, onBookmarkChange } = $props<{
		movieId: number;
		type?: MovieType;
		data: any;
		isBookmarked: boolean;
		onBookmarkChange?: (movieId: number, isBookmarked: boolean) => void;
	}>();
	let isLoading: boolean = $state(true);
	let movie: MovieDetails | undefined = $state<MovieDetails | undefined>();
	let movieVideo: MovieVideo | undefined = $state<MovieVideo | undefined>();
	let player: YT.Player;
	let isApiLoaded = false;
	let playerReady = $state(false);
	let videoEnded = $state(false);
	let isMuted = $state(true);
	let playerElement: HTMLDivElement;
	let showVideo: boolean = $state(false);
	let showImage: boolean = $state(false);
	let showSkeleton: boolean = $state(true);
	let currentIsBookmarked = $state(isBookmarked);

	// Sync with parent prop changes
	$effect(() => {
		currentIsBookmarked = isBookmarked;
	});

	const loadMovieDetails = async (movieId: number): Promise<MovieDetails> => {
		const movieDetailsResponse = await getMovieDetails(movieId, type, data.token);
		movie = movieDetailsResponse;
		return movieDetailsResponse;
	};

	const loadMovieVideo = async (movieId: number): Promise<string> => {
		const movieVideoResponse = await getMovieVideos(movieId, type, data.token);
		movieVideo = movieVideoResponse;
		return movieVideoResponse;
	};

	onMount(() => {
		if (movieId) {
			isLoading = true;
			loadMovieDetails(movieId).catch((error) => {
				console.error('Error loading movie details:', error);
			});
			loadMovieVideo(movieId).catch((error) => {
				console.error('Error loading movie video:', error);
			});
			isLoading = false;
		}
	});

	function createPlayer(id: string) {
		if (!id || !isApiLoaded || !playerElement) return;

		if (!player) {
			player = new YT.Player(playerElement, {
				videoId: movieVideo?.key,
				events: {
					onReady: () => {
						player.mute();
						player.playVideo();
					},
					onStateChange: (event) => {
						if (event.data === YT.PlayerState.ENDED) {
							videoEnded = true;
						}
						if (event.data === YT.PlayerState.PLAYING) {
							playerReady = true;
						}
					}
				},
				playerVars: {
					autoplay: 1,
					controls: 0,
					loop: 0,
					rel: 0,
					showinfo: 0,
					disablekb: 1
				}
			});
		} else {
			player.loadVideoById(id);
		}
	}

	function toggleMute() {
		if (!player) return;
		if (isMuted) {
			player.unMute();
		} else {
			player.mute();
		}
		isMuted = !isMuted;
	}

	onMount(() => {
		// @ts-ignore
		window.onYouTubeIframeAPIReady = () => {
			isApiLoaded = true;
			if (movieVideo?.key) createPlayer(movieVideo?.key);
		};

		if (!window.YT) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			document.body.appendChild(tag);
		} else {
			// Already loaded
			isApiLoaded = true;
			if (movieVideo?.key) createPlayer(movieVideo?.key);
		}
	});

	$effect(() => {
		if (movieVideo?.key) {
			createPlayer(movieVideo?.key);
		}
	});

	$effect(() => {
		showVideo = playerReady && !videoEnded;
		showImage = !!movie && (!playerReady || videoEnded);
		showSkeleton = !movie?.backdrop_path && (!playerReady || videoEnded);
	});

	function toggleModalMovie(options: { movieId: number | undefined; type: MovieType }) {
		if (options.movieId && options.type) {
			movieModalActions.open(options.movieId, options.type);
		}
	}

	async function addMovieToWatchlist(options: { movieId: number | undefined; type: MovieType }) {
		if (!options.movieId || !data.token) {
			return;
		}

		try {
			await setBookmark(options.movieId, true, data.token);
			currentIsBookmarked = true;
			// Notify parent component of the change
			onBookmarkChange?.(options.movieId, true);
		} catch (error) {
			console.error('Error adding movie to watchlist:', error);
		}
	}

	async function removeMovieFromWatchlist(options: { movieId: number | undefined; type: MovieType }) {
		if (!options.movieId || !data.token) {
			return;
		}

		try {
			await setBookmark(options.movieId, false, data.token);
			currentIsBookmarked = false;
			// Notify parent component of the change
			onBookmarkChange?.(options.movieId, false);
		} catch (error) {
			console.error('Error removing movie from watchlist:', error);
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="block cursor-pointer"
	onclick={() => {
		window.location.href = `/movie/${movieId}`;
	}}
>
	<div class="bg-secondary flex flex-col items-center gap-2 pb-2">
		<div class="relative aspect-[6/3] w-full overflow-hidden rounded-[2px]">
			<!-- 🟥 Skeleton background (fallback) -->
			<div
				class="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-700"
				style="opacity: {showSkeleton ? 1 : 0};"
			>
				<Skeleton class="h-full w-full rounded-[2px]" />
			</div>

			<!-- 🖼️ Image background if available -->
			<div
				class="absolute inset-0 z-20 flex items-end bg-cover bg-center transition-opacity duration-300"
				class:bg-black={!movie?.backdrop_path}
				style="
      background-image: {movie?.backdrop_path
					? `url('https://image.tmdb.org/t/p/w500${movie.backdrop_path}')`
					: `url('/img/default-backdrop2.png')`};
      opacity: {showImage || movie?.backdrop_path ? 1 : 0};
    "
			>
				<div class="w-full rounded-b-[2px] bg-gradient-to-t from-black/60 to-transparent p-4">
					<Icon />
					<h3 class="line-clamp-1 font-medium">{type === 'movie' ? movie?.title : movie?.name}</h3>
				</div>
			</div>

			<!-- ▶️ YouTube Player -->
			<div
				class="absolute inset-0 z-30 flex items-end bg-black transition-opacity duration-1000"
				style="opacity: {showVideo ? 1 : 0};"
			>
				<div class="absolute h-full w-full">
					<div
						class="absolute top-1/2 left-1/2 min-h-[155%] min-w-[155%] -translate-x-1/2 -translate-y-1/2"
					>
						<div
							id="player"
							bind:this={playerElement}
							class="absolute top-0 left-0 h-full w-full overflow-hidden"
						></div>
					</div>
					<div
						class="absolute bottom-0 z-10 w-full rounded-b-[2px] bg-gradient-to-t from-black/60 to-transparent p-4"
					>
						<Icon />
						<h3 class="line-clamp-1 font-medium">
							{type === 'movie' ? movie?.title : movie?.name}
						</h3>
					</div>

					{#if showVideo}
						<ButtonPreview
							variant="outline"
							size="default"
							onclick={(e) => {
								e.stopPropagation();
								toggleMute();
							}}
							class="absolute right-0 bottom-0 z-20 m-4"
						>
							{#if isMuted}
								<VolumeOff />
							{:else}
								<Volume2 />
							{/if}
						</ButtonPreview>
					{/if}
				</div>
				<div class="bg-red relative top-0 left-0 h-full w-full"></div>
			</div>
		</div>
		<div class="flex w-full flex-col gap-2 p-4">
			{#if isLoading}
				<div class="mt-2">
					<Skeleton class="h-6 w-24" />
				</div>
			{:else}
				<div class="flex items-center justify-between">
					<div class="flex gap-2">
						<ButtonPreview variant="filled">
							<Play fill={'black'} />
						</ButtonPreview>
						<ButtonPreview
							variant="outline"
							onclick={(e) => {
								e.stopPropagation();
								if (currentIsBookmarked) 
								{
									removeMovieFromWatchlist({
										movieId: movie?.id,
										type: type
									});
								}
								else {
									addMovieToWatchlist({
										movieId: movie?.id,
										type: type
									});
								}
							}}
						>
							{#if currentIsBookmarked}
								<Check />
							{:else}
								<Plus />
							{/if}
						</ButtonPreview>
					</div>
					<ButtonPreview
						variant="outline"
						onclick={(e) => {
							e.stopPropagation();
							toggleModalMovie({
								movieId: movie?.id,
								type: type
							});
						}}
					>
						<ChevronDown />
					</ButtonPreview>
				</div>
			{/if}
			<!-- <p class="line-clamp-3 text-sm text-gray-500">{movie?.overview}</p> -->
			{#if movie?.runtime}
				<div class="flex items-center gap-2">
					<p class="border border-gray-300 px-[4px] py-[0px] text-[12px] text-gray-300 uppercase">
						{movie.release_date
							? new Date(movie.release_date).toLocaleDateString(get(locale) as string, {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})
							: 'Unknown Release Date'}
					</p>
					<p class="text-sm text-gray-300">
						{Math.floor(movie?.runtime / 60)} h {movie?.runtime % 60} min
					</p>
					<MovieBadges {movie} showQuality={true} showLanguage={true} />
				</div>
			{/if}
			{#if movie && movie?.genres.length > 0}
				<div class="flex flex-wrap items-center">
					{#each movie?.genres as genre, i (genre.id)}
						<p class="font-montserrat text-[16px] font-normal">{genre.name}</p>
						{#if i < movie.genres.length - 1}
							<Dot color="gray" />
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
