<script lang="ts">
	import { Button } from '@/components/ui/button';
	import type { BackDropImage, MovieDetails, MovieVideo, MovieType } from '@hypertube/shared';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { Info, Play, Volume2, VolumeOff, TrendingUp, RotateCw } from 'lucide-svelte';
	import { _ } from 'svelte-i18n';
	import { Skeleton } from '@/components/ui/skeleton';
	import ButtonPreview from '../buttons/button-preview/button-preview.svelte';
	import { movieModalActions } from '@/services/store';

	interface Props {
		movie: MovieDetails;
		type: MovieType;
		logo?: BackDropImage;
		movieVideo?: MovieVideo;
		showDescription?: boolean;
		showMoreInfoButton?: boolean;
		showVoteAverage?: boolean;
		enableDescriptionExpansion?: boolean;
		maxDescriptionLines?: number;
		customActions?: Snippet;
		class?: string;
	}

	let expanded = $state(false);
	let contentEl = $state<HTMLParagraphElement>();
	let isClamped = $state(false);
	let isMuted = $state(true);

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
		movieVideo,
		showDescription = true,
		showMoreInfoButton = true,
		showVoteAverage = true,
		enableDescriptionExpansion = true,
		maxDescriptionLines = 6,
		customActions,
		class: className = ''
	}: Props = $props();

	let player: YT.Player | undefined;
	let isApiLoaded = false;
	let playerReady = $state(false);
	let videoEnded = $state(false);
	let playerElement: HTMLDivElement;

	function createPlayer(id: string) {
		if (!id || !isApiLoaded) return;

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
			} catch (error) {
				console.warn('Error destroying existing YouTube player:', error);
			}
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
			} catch (error) {
				console.warn('Error destroying YouTube player:', error);
			}
		}
		// Reset player state
		playerReady = false;
		videoEnded = false;
	});

	let lastVideoKey = '';

	$effect(() => {
		// Only create player if video key changed to prevent recreation on every effect
		if (movieVideo?.key && movieVideo.key !== lastVideoKey) {
			lastVideoKey = movieVideo.key;
			createPlayer(movieVideo.key);
		}
	});
</script>

<div class="relative w-full {className}">
	<!-- YouTube video player container -->
	<div
		class="relative flex aspect-[6/3] w-full overflow-hidden rounded-[2px] bg-black {playerReady &&
		!videoEnded
			? ''
			: 'hidden'}"
	>
		<div class="absolute inset-0">
			<div
				class="absolute top-1/2 left-1/2 min-h-[155%] min-w-[155%] -translate-x-1/2 -translate-y-1/2"
			>
				<div bind:this={playerElement} class="absolute inset-0 h-full w-full overflow-hidden"></div>
			</div>
		</div>
		<!-- Fade effect: bottom gradient overlay for video -->
		<div class="pointer-events-none absolute inset-0">
			<div
				class="absolute bottom-0 left-0 w-full"
				style="height: 30%; background: linear-gradient(to top, rgba(18, 18, 18, 0.8), transparent);"
			></div>
		</div>
	</div>

	<!-- Backdrop image container -->
	{#if movie?.backdrop_path && (!playerReady || videoEnded)}
		<div class="relative aspect-[16/9] w-full overflow-hidden">
			<img
				src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path}`}
				alt="movie-background"
				class="h-full w-full object-cover"
			/>
			<!-- Fade effect: bottom gradient overlay for backdrop -->
			<div class="pointer-events-none absolute inset-0">
				<div
					class="absolute bottom-0 left-0 w-full"
					style="height: 30%; background: linear-gradient(to top, rgba(18, 18, 18, 0.8), transparent);"
				></div>
			</div>
		</div>
	{:else if !movie?.backdrop_path && (!playerReady || videoEnded)}
		<!-- Fallback background when no backdrop image -->
		<div class="relative w-full overflow-hidden" style="aspect-ratio: 16/9;">
			{#if movie.poster_path}
				<!-- Use poster as background if available -->
				<img
					src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
					alt={movie.title || movie.name}
					class="h-full w-full scale-110 object-cover blur-sm"
				/>
				<!-- Dark overlay for poster background -->
				<div class="absolute inset-0 bg-black/60"></div>
			{:else}
				<!-- Pure gradient fallback when no images available -->
				<div
					class="h-full w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900"
				></div>
			{/if}

			<!-- Bottom gradient overlay (always present) -->
			<div class="pointer-events-none absolute inset-0">
				<div
					class="absolute bottom-0 left-0 w-full"
					style="height: 30%; background: linear-gradient(to top, rgba(18, 18, 18, 0.8), transparent);"
				></div>
			</div>
		</div>
	{:else if !movie?.backdrop_path && !playerReady && !videoEnded}
		<div class="w-full overflow-hidden" style="aspect-ratio: 16/9;">
			<Skeleton class="h-full w-full" />
		</div>
	{/if}

	<!-- Content overlay - always visible -->
	<div class="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12">
		<div class="flex flex-col gap-4 text-white md:gap-6">
			<!-- Logo/Title section - always visible -->
			<div class="md:block">
				{#if logo}
					<img
						src={logo.url}
						alt="movie-background"
						class="mb-4 max-h-16 object-cover sm:max-h-20 md:mb-6 md:max-h-24"
						style="max-width: {logo.aspect_ratio >= 2
							? '50%'
							: logo.aspect_ratio >= 1.5
								? '40%'
								: '30%'};"
					/>
				{:else}
					<h1
						class="mb-4 max-w-xs text-3xl leading-tight font-extrabold uppercase sm:max-w-sm sm:text-4xl md:mb-6 md:max-w-2xl md:text-5xl lg:text-6xl xl:text-7xl"
					>
						{movie.title}
					</h1>
				{/if}
			</div>

			<!-- Description section - hidden during video playback on desktop -->
			{#if showDescription}
				<div
					class="transition-all duration-[2000ms] ease-in-out md:block"
					style="
						opacity: {playerReady && !videoEnded ? 0 : 1};
						max-height: {playerReady && !videoEnded ? '0px' : '500px'};
						pointer-events: {playerReady && !videoEnded ? 'none' : 'auto'};
						visibility: {playerReady && !videoEnded ? 'hidden' : 'visible'};
					"
				>
					<div class="mb-4 hidden max-w-full md:mb-6 md:block md:max-w-[50%] lg:max-w-[40%]">
						{#if movie.overview}
							<p
								bind:this={contentEl}
								class="text-sm leading-relaxed md:text-base {expanded
									? ''
									: `line-clamp-${maxDescriptionLines}`}"
							>
								{movie.overview}
							</p>
							{#if isClamped && enableDescriptionExpansion}
								<button
									onclick={() => (expanded = !expanded)}
									class="mt-2 text-xs text-blue-400 hover:text-blue-300 hover:underline"
								>
									{expanded ? 'See less' : 'See more'}
								</button>
							{/if}
						{/if}
					</div>
				</div>
			{/if}

			<!-- Buttons section - always visible at bottom -->
			<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<!-- Main action buttons -->
				<div class="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
					<div class="flex flex-wrap items-center gap-2">
						<Button
							class="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-[4px]"
							href={`/movie/${movie.id}`}
						>
							<Play fill={'black'} />{$_('movie-banner.play')}
						</Button>
						{#if showMoreInfoButton}
							<Button
								class="text-secondary-foreground bg-secondary hover:bg-secondary hover:text-accent-foreground cursor-pointer rounded-[4px] brightness-150 hover:brightness-100"
								onclick={openModal}
							>
								<Info />{$_('movie-banner.more-info')}
							</Button>
						{/if}
						{#if customActions}
							{@render customActions()}
						{/if}
					</div>

					<!-- Video controls (mute/replay) - separated on the right -->
					{#if movieVideo?.key}
						{#if playerReady && !videoEnded}
							<button onclick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
								<ButtonPreview variant="outline" size="default">
									{#if isMuted}
										<VolumeOff size={18} />
									{:else}
										<Volume2 size={18} />
									{/if}
								</ButtonPreview>
							</button>
						{:else if videoEnded}
							<button onclick={replayVideo} aria-label="Replay video">
								<ButtonPreview variant="outline" size="default">
									<RotateCw size={18} />
								</ButtonPreview>
							</button>
						{/if}
					{/if}
				</div>

				<!-- Right side controls -->
				<div class="hidden items-center gap-2 sm:flex sm:gap-3">
					<!-- Vote average -->
					{#if showVoteAverage && movie.vote_average}
						<div
							class="bg-secondary/50 flex items-center gap-1 border-l-4 py-1 pr-3 pl-2 text-sm font-light text-nowrap"
						>
							<TrendingUp size={15} />
							<span class="text-xs sm:text-sm">{movie.vote_average.toFixed(1)}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
