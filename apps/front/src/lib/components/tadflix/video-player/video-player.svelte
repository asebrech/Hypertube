<script lang="ts">
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { onMount, onDestroy } from 'svelte';
	import { VideoPlayerAPI, VideoPlayerHooks } from './video-player-hooks.js';
	import { VideoPlayerUtils, VIDEO_CONFIG, type Resolution } from './video-player-utils.js';

	interface Props {
		movieId: string;
		token?: string;
		baseUrl: string;
		availableResolutions: string[];
		preferredResolution?: string;
		onWatched?: () => void;
		onError?: (error: string) => void;
	}

	let {
		movieId,
		token,
		baseUrl,
		availableResolutions,
		preferredResolution = '1080',
		onWatched,
		onError
	}: Props = $props();

	let player: any = null;
	let container: HTMLElement;
	let hasMarkedAsWatched = false;
	let lastWatchTimeCheck = 0;
	let progressSaveInterval: number;
	let api: VideoPlayerAPI;

	const readyResolutions = $derived(new Set(availableResolutions));
	const resolutionSources = $derived(VideoPlayerUtils.getResolutionSources(baseUrl, movieId));
	const availableSources = $derived(resolutionSources.filter(res => readyResolutions.has(res.value)));

	onMount(() => {
		api = new VideoPlayerAPI(token, movieId);
		initializePlayer();
	});

	onDestroy(() => {
		cleanup();
	});

	function cleanup() {
		if (progressSaveInterval) {
			clearInterval(progressSaveInterval);
		}
		if (player && !player.isDisposed()) {
			player.dispose();
			player = null;
		}
	}

	function createBackButton() {
		const BackButton = videojs.getComponent('Button');

		class CustomBackButton extends BackButton {
			constructor(player: any, options: any) {
				super(player, options);
				this.addClass('vjs-back-button');
			}

			createEl() {
				const button = super.createEl('button', {
					className: 'vjs-back-button vjs-control vjs-button'
				});

				button.innerHTML = `
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m12 19-7-7 7-7"/>
						<path d="M19 12H5"/>
					</svg>
				`;

				const backToHomeText = $_('video-player.back-to-home');
				button.setAttribute('title', backToHomeText);
				button.setAttribute('aria-label', backToHomeText);

				return button;
			}

			handleClick() {
				goto('/');
			}
		}

		videojs.registerComponent('CustomBackButton', CustomBackButton);
		return CustomBackButton;
	}

	async function handleMarkAsWatched() {
		if (hasMarkedAsWatched) return;

		const success = await api.markAsWatched();
		if (success) {
			hasMarkedAsWatched = true;
			onWatched?.();
		}
	}

	async function handleProgressSave() {
		if (!player?.duration?.() || player.duration() === 0) return;

		const currentTime = player.currentTime();
		const duration = player.duration();
		const percentage = VideoPlayerUtils.calculateWatchPercentage(currentTime, duration);

		if (VideoPlayerUtils.shouldSaveProgress(percentage, duration)) {
			await api.saveProgress(currentTime);
		}
	}

	function setupPlayerEvents() {
		player.on('error', (error: any) => {
			console.error('Video.js player error:', error);
			onError?.('Video player error occurred');
		});

		player.on('ended', handleMarkAsWatched);

		player.on('play', () => {
			if (!player.isFullscreen()) {
				player.requestFullscreen();
			}
		});

		player.ready(() => {
			const bigPlayButton = player.getChild('BigPlayButton');
			if (bigPlayButton) {
				bigPlayButton.on('click', () => {
					setTimeout(() => {
						if (!player.isFullscreen()) {
							player.requestFullscreen();
						}
					}, 100);
				});
			}
		});

		player.on('timeupdate', () => {
			if (hasMarkedAsWatched || !player.duration?.() || player.duration() <= 0) return;

			const now = Date.now();
			if (now - lastWatchTimeCheck >= VIDEO_CONFIG.WATCH_TIME_CHECK_INTERVAL) {
				lastWatchTimeCheck = now;

				const currentTime = player.currentTime();
				const duration = player.duration();
				const percentage = VideoPlayerUtils.calculateWatchPercentage(currentTime, duration);

				if (VideoPlayerUtils.shouldMarkAsWatched(percentage)) {
					handleMarkAsWatched();
				}
			}
		});

		player.on('loadedmetadata', async () => {
			const savedProgress = await api.getProgress();
			if (savedProgress > 0 && player.duration() > 0) {
				const duration = player.duration();
				const percentage = VideoPlayerUtils.calculateWatchPercentage(savedProgress, duration);

				if (percentage >= 1 && percentage <= 95) {
					player.currentTime(savedProgress);
				}
			}
		});

		player.on('pause', handleProgressSave);
		player.on('seeked', handleProgressSave);

		if (token && player.tech?.()?.vhs) {
			player.tech().vhs.xhr.onRequest(VideoPlayerHooks.createAuthHook(token));
		}
	}

	function addResolutionButtons() {
		const controlBar = player.getChild('ControlBar');

		availableSources.forEach((res) => {
			const btn = controlBar.addChild('button', {
				controlText: res.label,
				className: 'vjs-visible-text'
			});
			btn.on('click', () => switchResolution(res));
		});
	}

	function switchResolution(resolution: any) {
		if (!player || !readyResolutions.has(resolution.value)) return;

		const currentTime = player.currentTime();
		player.src({ src: resolution.src, type: 'application/x-mpegURL' });
		player.ready(() => player.currentTime(currentTime));
	}

	async function initializePlayer() {
		if (!container || player || readyResolutions.size === 0) return;

		const preferredSource = VideoPlayerUtils.getPreferredSource(availableResolutions, preferredResolution);
		const selectedSource = availableSources.find(s => s.value === preferredSource?.value);
		
		if (!selectedSource) return;

		VideoPlayerHooks.setupAuthentication(token, videojs);

		const options = {
			autoplay: true,
			controls: true,
			responsive: true,
			fluid: true,
			liveui: true,
			preload: 'auto',
			aspectRatio: '16:9',
			fill: true,
			sources: [{ src: selectedSource.src, type: 'application/x-mpegURL' }],
			controlBar: {
				fullscreenToggle: false
			},
			html5: {
				vhs: {
					withCredentials: false
				}
			}
		};

		try {
			const videoElement = document.createElement('video-js');
			videoElement.className = 'vjs-big-play-centered';
			container.appendChild(videoElement);

			createBackButton();
			player = videojs(videoElement, options);

			const controlBar = player.getChild('ControlBar');
			const backButton = new (videojs.getComponent('CustomBackButton'))(player);
			controlBar.addChild(backButton, {}, 0);

			setupPlayerEvents();
			addResolutionButtons();

			// Setup progress saving interval
			progressSaveInterval = setInterval(() => {
				if (player && !player.paused() && player.duration() > 0) {
					handleProgressSave();
				}
			}, VIDEO_CONFIG.PROGRESS_SAVE_INTERVAL);

		} catch (error) {
			console.error('Error initializing video player:', error);
			onError?.('Failed to initialize video player');
		}
	}
</script>

<div class="video-container" data-vjs-player bind:this={container}></div>

<style>
	.video-container {
		width: 100%;
		height: 100vh;
		background-color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	:global(.video-container .video-js) {
		width: 100% !important;
		height: 100% !important;
		max-width: 100vw !important;
		max-height: 100vh !important;
	}

	:global(.video-container .video-js .vjs-tech) {
		width: 100% !important;
		height: 100% !important;
		object-fit: contain !important;
	}

	:global(.vjs-back-button) {
		width: 3rem !important;
		height: 100% !important;
		cursor: pointer !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		color: white !important;
		border: none !important;
		transition: background-color 0.2s ease !important;
		background: rgba(0, 0, 0, 0.5) !important;
	}

	:global(.vjs-back-button:hover) {
		background: rgba(220, 38, 38, 0.8) !important;
	}

	:global(.vjs-back-button svg) {
		width: 1.25rem !important;
		height: 1.25rem !important;
		stroke: currentColor !important;
	}

	:global(.vjs-control-bar .vjs-back-button) {
		order: -1 !important;
	}
</style>
