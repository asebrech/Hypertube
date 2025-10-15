<script lang="ts">
	import { Button } from '@/components/ui/button';
	import type { BackDropImage, MovieDetails, MovieVideo, MovieType } from '@hypertube/shared';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { Info, Play, Volume2, VolumeOff, TrendingUp, RotateCw } from 'lucide-svelte';
	import { _ } from 'svelte-i18n';
	import { Skeleton } from '@/components/ui/skeleton';
	import ButtonPreview from '../buttons/button-preview/button-preview.svelte';
	import { movieModalActions, videoState } from '@/services/store';
	import { PUBLIC_ENABLE_YOUTUBE } from '$env/static/public';

	interface Props {
		movie: MovieDetails;
		type: MovieType;
		logo?: BackDropImage;
		isAvailable?: boolean;
		movieVideo?: MovieVideo;
		showDescription?: boolean;
		showMoreInfoButton?: boolean;
		showVoteAverage?: boolean;
		enableDescriptionExpansion?: boolean;
		maxDescriptionLines?: number;
		customActions?: Snippet;
		class?: string;
		instance?: 'home' | 'modal'; // New prop to identify banner instance
	}

	let expanded = $state(false);
	let contentEl = $state<HTMLParagraphElement>();
	let isClamped = $state(false);
	let isMuted = $state(true);
	let isAutoMuted = $state(false); // Track if muting was automatic

	$effect(() => {
		if (contentEl) {
			const { scrollHeight, clientHeight } = contentEl;
			isClamped = scrollHeight > clientHeight;
		}
	});

	let {
		movie,
		type,
		logo,
		isAvailable,
		movieVideo,
		showDescription = true,
		showMoreInfoButton = true,
		showVoteAverage = true,
		enableDescriptionExpansion = true,
		maxDescriptionLines = 6,
		customActions,
		class: className = '',
		instance = 'home'
	}: Props = $props();

	// Check if YouTube is enabled via environment variable
	const isYouTubeEnabled = PUBLIC_ENABLE_YOUTUBE === 'true';

	let player: YT.Player | undefined;
	let isApiLoaded = false;
	let playerReady = $state(false);
	let videoEnded = $state(false);
	let playerElement = $state<HTMLDivElement>();

	function createPlayer(id: string) {
		if (!id || !isApiLoaded || !isYouTubeEnabled) return;

		// Wait for playerElement to be available
		if (!playerElement) {
			setTimeout(() => createPlayer(id), 100);
			return;
		}

		// Destroy existing player before creating new one
		if (player && typeof player.destroy === 'function') {
			try {
				player.destroy();
				playerReady = false;
				videoEnded = false;
			} catch {}
		}

		// Clear the player element before creating new player
		playerElement.innerHTML = '';

		player = new YT.Player(playerElement, {
			videoId: id,
			events: {
				onReady: () => {
					if (player) {
						player.mute();
						player.playVideo();
					}
				},
				onStateChange: (event) => {
					if (event.data === YT.PlayerState.ENDED) {
						videoEnded = true;
						// Only update store for home banner, modal banner state is managed by modal open/close
						if (instance === 'home') {
							videoState.update((state) => ({
								...state,
								bannerVideoPlaying: false
							}));
						}
					}
					if (event.data === YT.PlayerState.PLAYING) {
						playerReady = true;
						// Only update store for home banner, modal banner state is managed by modal open/close
						if (instance === 'home') {
							videoState.update((state) => ({
								...state,
								bannerVideoPlaying: true
							}));
						}
					}
					if (event.data === YT.PlayerState.PAUSED) {
						// Only update store for home banner, modal banner state is managed by modal open/close
						if (instance === 'home') {
							videoState.update((state) => ({
								...state,
								bannerVideoPlaying: false
							}));
						}
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
	}

	function toggleMute() {
		if (!player) return;
		if (isMuted) {
			player.unMute();
			isAutoMuted = false; // User manually unmuted
		} else {
			player.mute();
			isAutoMuted = false; // User manually muted
		}
		isMuted = !isMuted;
	}

	function replayVideo() {
		if (!player) return;
		player.seekTo(0, false);
		player.playVideo();
		videoEnded = false;
	}

	function openModal() {
		movieModalActions.open(movie.id, type);
	}

	onMount(() => {
		if (!isYouTubeEnabled) return;

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

	onDestroy(() => {
		// Clean up YouTube player when component is destroyed
		if (player && typeof player.destroy === 'function') {
			try {
				player.destroy();
				player = undefined;
			} catch {}
		}
		// Reset player state
		playerReady = false;
		videoEnded = false;
	});

	let lastVideoKey = '';

	// Listen to video state changes and auto-mute banner when preview is playing
	$effect(() => {
		const state = $videoState;

		// For home banner: mute when preview or modal banner is playing
		if (instance === 'home') {
			if ((state.previewVideoPlaying || state.modalBannerVideoPlaying) && player && !isMuted) {
				// Auto-mute home banner video when preview or modal banner starts playing
				player.mute();
				isMuted = true;
				isAutoMuted = true;
			} else if (
				!state.previewVideoPlaying &&
				!state.modalBannerVideoPlaying &&
				player &&
				isMuted &&
				isAutoMuted
			) {
				// Auto-unmute home banner video when no preview or modal banner is playing
				// But only if it was auto-muted (not manually muted by user)
				player.unMute();
				isMuted = false;
				isAutoMuted = false;
			}
		}

		// For modal banner: mute when preview is playing
		if (instance === 'modal') {
			if (state.previewVideoPlaying && player && !isMuted) {
				// Auto-mute modal banner video when preview starts playing
				player.mute();
				isMuted = true;
				isAutoMuted = true;
			} else if (!state.previewVideoPlaying && player && isMuted && isAutoMuted) {
				// Auto-unmute modal banner video when no preview is playing
				// But only if it was auto-muted (not manually muted by user)
				player.unMute();
				isMuted = false;
				isAutoMuted = false;
			}
		}
	});

	$effect(() => {
		// Only create player if video key changed to prevent recreation on every effect
		if (movieVideo?.key && movieVideo.key !== lastVideoKey && isYouTubeEnabled) {
			lastVideoKey = movieVideo.key;
			createPlayer(movieVideo.key);
		}
	});
</script>

<div class="relative max-h-[80vh] w-full {className}">
	{#if isYouTubeEnabled}
		<div
			class="relative flex aspect-[16/9] w-full items-end overflow-hidden rounded-[2px] bg-black sm:aspect-[6/3] {playerReady &&
			!videoEnded
				? ''
				: 'hidden'}"
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
			</div>
			<!-- Fade effect: bottom gradient overlay -->
			<div class="pointer-events-none absolute inset-0">
				<div
					class="absolute bottom-0 left-0 w-full"
					style="height: 30%; background: linear-gradient(to top, #121212, transparent);"
				></div>
			</div>
		</div>
	{/if}
	{#if movie?.backdrop_path && (isYouTubeEnabled ? !playerReady || videoEnded : true)}
		<div 
			class="relative w-full {instance === 'modal' ? 'aspect-[6/3]' : 'h-full'}" 
			style={instance === 'modal' ? '' : 'min-height: 250px;'}
		>
			<img
				src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path}`}
				alt="movie-background"
				class="h-full w-full object-cover"
				style="display: block; height: 100%; width: 100%;"
			/>
			<!-- Fade effect: bottom gradient overlay -->
			<div class="pointer-events-none absolute inset-0">
				<div
					class="absolute bottom-0 left-0 w-full"
					style="height: 30%; background: linear-gradient(to top, #121212, transparent);"
				></div>
			</div>
		</div>
	{:else if !movie?.backdrop_path && (isYouTubeEnabled ? !playerReady && !videoEnded : true)}
		<Skeleton class="h-[40vh] w-full sm:h-[50vh] md:h-[80vh]" />
	{/if}

	<div class="absolute top-0 left-0 h-full w-full transform px-4 pt-16 pb-6 sm:px-8 sm:pt-20 sm:pb-16 md:px-12 md:pt-24 md:pb-24">
		<div
			class="flex h-full w-full flex-col gap-2 text-white sm:justify-end sm:gap-4 md:gap-5 {playerReady && !videoEnded ? 'justify-end' : 'justify-start'}"
		>
			<!-- Logo/Title section - always visible -->
			 
			<div class="md:block">
				{#if logo}
					<img
						src={logo.url}
						alt="movie-background"
						class="object-cover"
						style="max-width: {logo.aspect_ratio >= 2
							? 'min(60%, 300px)'
							: logo.aspect_ratio >= 1.5
								? 'min(50%, 250px)'
								: 'min(40%, 200px)'};"
					/>
				{:else}
					<span
						class="block text-3xl font-extrabold uppercase leading-tight sm:text-5xl md:text-7xl md:max-w-44"
					>
						{movie.title}
					</span>
				{/if}
			</div>

			<!-- Description section - hidden during video playback on desktop -->
			{#if showDescription}
				<div
					class="hidden overflow-hidden transition-all duration-[2000ms] ease-in-out md:block md:max-w-[40%]"
					style="
						opacity: {playerReady && !videoEnded ? 0 : 1};
						max-height: {playerReady && !videoEnded ? '0px' : '500px'};
						pointer-events: {playerReady && !videoEnded ? 'none' : 'auto'};
						visibility: {playerReady && !videoEnded ? 'hidden' : 'visible'};
					"
				>
					<p bind:this={contentEl} class={`${expanded ? '' : `line-clamp-${maxDescriptionLines}`}`}>
						{movie.overview}
					</p>
					{#if isClamped && enableDescriptionExpansion}
						<button
							onclick={() => (expanded = !expanded)}
							class="hidden self-start text-xs text-blue-600 hover:underline md:block"
						>
							{expanded ? 'See less' : 'See more'}
						</button>
					{/if}
				</div>
			{/if}

			<div class="relative flex w-full items-end justify-between gap-2">
				<div class="flex flex-wrap gap-2">
					<Button
						class="bg-primary text-primary-foreground hover:bg-primary/90 h-8 cursor-pointer rounded-[4px] px-3 text-xs sm:h-10 sm:px-4 sm:text-sm {isAvailable ? '' : 'cursor-not-allowed'}"
						href={isAvailable ? `/movie/waiting-room?id=${movie.id}` : undefined}
					>
						<Play fill={'black'} class="h-4 w-4 sm:h-5 sm:w-5" />{isAvailable ? $_('movie-banner.play') : $_('movie-action.not-available')}
					</Button>
					{#if showMoreInfoButton}
						<Button
							class="text-secondary-foreground bg-secondary hover:bg-secondary hover:text-accent-foreground h-8 cursor-pointer rounded-[4px] px-3 text-xs brightness-150 hover:brightness-100 sm:h-10 sm:px-4 sm:text-sm"
							onclick={openModal}
						>
							<Info class="h-4 w-4 sm:h-5 sm:w-5" />{$_('movie-banner.more-info')}
						</Button>
					{/if}
					{#if customActions}
						{@render customActions()}
					{/if}
				</div>

				<div class="flex items-center gap-2 sm:gap-3">
					{#if isYouTubeEnabled && movieVideo?.key && movie.vote_average}
						<div class={`flex items-center gap-2 sm:gap-5 ${!showVoteAverage || !movie.vote_average ? 'pr-3' : ''}`}>
							{#if playerReady && !videoEnded}
								<button onclick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
									<ButtonPreview variant="outline" size="default">
										{#if isMuted}
											<VolumeOff size={16} class="sm:h-[18px] sm:w-[18px]" />
										{:else}
											<Volume2 size={16} class="sm:h-[18px] sm:w-[18px]" />
										{/if}
									</ButtonPreview>
								</button>
							{:else if videoEnded}
								<button onclick={replayVideo} aria-label="Replay video">
									<ButtonPreview variant="outline" size="default">
										<RotateCw size={16} class="sm:h-[18px] sm:w-[18px]" />
									</ButtonPreview>
								</button>
							{/if}
						</div>
					{/if}
					{#if showVoteAverage && movie.vote_average}
						<div
							class="bg-secondary/50 flex items-center gap-1 border-l-4 py-1 pr-2 pl-1.5 text-xs font-light text-nowrap sm:pr-3 sm:pl-2 sm:text-sm"
						>
							<TrendingUp size={14} class="sm:h-[15px] sm:w-[15px]" />
							<span class="text-xs sm:text-sm">{movie.vote_average.toFixed(1)}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
