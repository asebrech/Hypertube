<script lang="ts">
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';
	import { goto, beforeNavigate } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { onMount, onDestroy } from 'svelte';
	import { VideoPlayerAPI, VideoPlayerHooks } from './video-player-hooks.js';
	import { VideoPlayerUtils, VIDEO_CONFIG, type Resolution } from './video-player-utils.js';
	import { PUBLIC_BACK_URL } from '$env/static/public';

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
	let progressSaveInterval: ReturnType<typeof setInterval>;
	let api: VideoPlayerAPI;
	let availableSubtitles: string[] = [];

	const readyResolutions = $derived(new Set(availableResolutions));
	const resolutionSources = $derived(VideoPlayerUtils.getResolutionSources(baseUrl, movieId));
	const availableSources = $derived(
		resolutionSources.filter((res) => readyResolutions.has(res.value))
	);

	onMount(() => {
		api = new VideoPlayerAPI(token, movieId);
		document.body.classList.add('video-player-active');
		initializePlayer();
	});

	onDestroy(() => {
		cleanup();
		document.body.classList.remove('video-player-active');
	});

	beforeNavigate(() => {
		document.body.classList.remove('video-player-active');
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
		document.body.classList.remove('video-player-active');
	}

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
			document.body.classList.remove('video-player-active');
			cleanup();
			goto('/');
		}
	}

	function createBackButton() {
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
		const percentage = VideoPlayerUtils.calculateProgress(currentTime, duration);

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

		player.on('timeupdate', () => {
			if (hasMarkedAsWatched || !player.duration?.() || player.duration() <= 0) return;

			const now = Date.now();
			if (now - lastWatchTimeCheck >= VIDEO_CONFIG.WATCH_TIME_CHECK_INTERVAL) {
				lastWatchTimeCheck = now;

				const currentTime = player.currentTime();
				const duration = player.duration();
				const percentage = VideoPlayerUtils.calculateProgress(currentTime, duration);

				if (VideoPlayerUtils.shouldMarkAsWatched(percentage)) {
					handleMarkAsWatched();
				}
			}
		});

		player.on('loadedmetadata', async () => {
			const savedProgress = await api.getProgress();
			if (savedProgress > 0 && player.duration() > 0) {
				const duration = player.duration();
				const percentage = VideoPlayerUtils.calculateProgress(savedProgress, duration);

				if (percentage >= 1 && percentage <= 95) {
					player.currentTime(savedProgress);
				}
			}
		});

		player.on('pause', handleProgressSave);
		player.on('seeked', handleProgressSave);

		if (token && typeof player.tech === 'function' && player.tech() && player.tech().vhs) {
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

	function getLanguageLabel(languageCode: string): string {
		const languageLabels: Record<string, string> = {
			en: 'English',
			es: 'Español',
			fr: 'Français',
			zh: '中文',
			ar: 'العربية',
			de: 'Deutsch',
			it: 'Italiano',
			pt: 'Português',
			ru: 'Русский',
			ja: '日本語',
			ko: '한국어',
			hi: 'हिन्दी',
			nl: 'Nederlands',
			sv: 'Svenska',
			no: 'Norsk',
			da: 'Dansk'
		};
		return languageLabels[languageCode] || languageCode.toUpperCase();
	}

	async function initializePlayer() {
		if (!container || player || readyResolutions.size === 0) return;

		const preferredSource = VideoPlayerUtils.getPreferredSource(
			availableResolutions,
			preferredResolution
		);
		const selectedSource = availableSources.find((s) => s.value === preferredSource?.value);

		if (!selectedSource) return;

		// Fetch available subtitles
		const api = new VideoPlayerAPI(token, movieId);
		availableSubtitles = await api.fetchAvailableSubtitles();

		VideoPlayerHooks.setupAuthentication(token, videojs as any);

		const textTracks = availableSubtitles.map((language, index) => ({
			kind: 'subtitles',
			src: VideoPlayerUtils.getSubtitleUrl(Number(movieId), language),
			srclang: language,
			label: getLanguageLabel(language),
			default: index === 0
		}));

		const options = {
			autoplay: true,
			controls: true,
			responsive: true,
			fluid: false,
			liveui: true,
			preload: 'auto',
			fill: true,
			normalizeAutoplay: false,
			sources: [{ src: selectedSource.src, type: 'application/x-mpegURL' }],
			tracks: textTracks,
			html5: {
				vhs: {
					withCredentials: true
				}
			},
			breakpoints: {},
			width: '100%',
			height: '100%'
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
			player.on('loadedmetadata', () => {
				const textTracks = player.textTracks();
				for (let i = 0; i < textTracks.length; i++) {
					const track = textTracks[i];
					track.addEventListener('error', (e: Event) => {
						console.error(`Subtitle error (${track.language}):`, e);
					});
				}
			});

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
		width: 100vw;
		height: 100vh;
		background-color: #000;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
		overflow: hidden;
	}

	:global(body.video-player-active) {
		overflow: hidden !important;
	}

	:global(.video-container .video-js) {
		width: 100% !important;
		height: 100% !important;
		max-width: 100% !important;
		max-height: 100% !important;
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
