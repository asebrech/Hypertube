<script lang="ts">
	import { Button } from '@/components/ui/button';
	import type { BackDropImage, MovieDetails, MovieVideo } from '@hypertube/shared';
	import { onMount } from 'svelte';
	import { Info, Play } from 'lucide-svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		movie: MovieDetails;
		logo?: BackDropImage;
		movieVideo?: MovieVideo;
	}

	let expanded = $state(false);
	let contentEl: HTMLParagraphElement;
	let isClamped = $state(false);

	$effect(() => {
		if (contentEl) {
			const { scrollHeight, clientHeight } = contentEl;
			isClamped = scrollHeight > clientHeight;
		}
	});

	let { movie, logo, movieVideo }: Props = $props();

	let player: YT.Player;
	let isApiLoaded = false;
	let playerReady = $state(false);
	let videoEnded = $state(false);
	let playerElement: HTMLDivElement;

	function createPlayer(id: string) {
		if (!id || !isApiLoaded || !playerElement) return;

		if (!player) {
			player = new YT.Player(playerElement, {
				videoId: movieVideo?.key,
				events: {
					onReady: () => {
						console.log('Player ready');
						playerReady = true;
						player.mute();
						player.playVideo();
					},
					onStateChange: (event) => {
						if (event.data === YT.PlayerState.ENDED) {
							console.log('Video ended');
							videoEnded = true;
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

	// function toggleMute() {
	// 	if (!player) return;
	// 	if (isMuted) {
	// 		player.unMute();
	// 	} else {
	// 		player.mute();
	// 	}
	// 	isMuted = !isMuted;
	// }

	onMount(() => {
		console.log('key', movieVideo?.key);
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
		console.log('key', movieVideo?.key);
		if (movieVideo?.key) {
			createPlayer(movieVideo?.key);
		}
	});
</script>

<div class="relative max-h-[80vh] w-full">
	<div
		class="relative flex aspect-[6/3] w-full items-end overflow-hidden rounded-[2px] bg-black {playerReady &&
		!videoEnded
			? ''
			: 'hidden'}"
	>
		<div class="absolute h-full w-full">
			<div
				class="absolute left-1/2 top-1/2 min-h-[155%] min-w-[155%] -translate-x-1/2 -translate-y-1/2"
			>
				<div
					id="player"
					bind:this={playerElement}
					class="absolute left-0 top-0 h-full w-full overflow-hidden"
				></div>
			</div>
		</div>
		<div class="bg-red relative left-0 top-0 h-full w-full"></div>
	</div>
	{#if movie.backdrop_path && (!playerReady || videoEnded)}
		<img
			src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path}`}
			alt="movie-background"
			class="h-full w-full object-cover"
		/>
	{/if}
	<div class="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform pl-12">
		<div class="flex w-full flex-col gap-5 text-white">
			{#if logo}
				<img src={logo.url} alt="movie-background" class="max-w-[40%] object-cover" />
			{:else}
				<span
					class="leading-14 text-wrap text-center text-7xl font-extrabold uppercase md:max-w-44"
				>
					{movie.title}
				</span>
			{/if}

			<div
				class="hidden overflow-hidden transition-all duration-[2000ms] ease-in-out md:block md:max-w-[40%]"
				style="
					opacity: {playerReady && !videoEnded ? 0 : 1};
					max-height: {playerReady && !videoEnded ? '0px' : '500px'};
					pointer-events: {playerReady && !videoEnded ? 'none' : 'auto'};
					visibility: {playerReady && !videoEnded ? 'hidden' : 'visible'};
				"
			>
				<p bind:this={contentEl} class={`${expanded ? '' : 'line-clamp-3'}`}>
					{movie.overview}
				</p>
				{#if isClamped}
					<button
						onclick={() => (expanded = !expanded)}
						class="hidden self-start text-xs text-blue-600 hover:underline md:block"
					>
						{expanded ? 'See less' : 'See more'}
					</button>
				{/if}
			</div>
			<div class="relative flex w-full justify-between gap-2">
				<div class="flex gap-2">
					<Button
						class="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-[4px]"
					>
						<Play fill={'black'} />{$_('movie-banner.play')}
					</Button>
					<Button
						class="text-secondary-foreground bg-secondary hover:bg-secondary hover:text-accent-foreground cursor-pointer rounded-[4px] brightness-150 hover:brightness-100"
					>
						<Info />{$_('movie-banner.more-info')}
					</Button>
				</div>
				{#if movie.vote_average}
					<div class="flex items-center gap-5">
						<div>RE</div>
						<div class="flex h-full items-center text-nowrap border-l-4 bg-purple-300 pl-3 pr-8">
							TV-{movie.revenue}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
