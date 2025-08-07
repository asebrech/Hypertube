<script>
	import { onMount, onDestroy } from 'svelte';
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_BACK_URL } from '$env/static/public';
	import { VideoLoading } from '$lib/components/tadflix/loading';
	import { VideoError } from '$lib/components/tadflix/error';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';

	export let data;

	const BASE_URL = `${PUBLIC_BACK_URL}/stream`;

	const POLL_INTERVAL = 5000; // 5 seconds
	const TIMEOUT_DURATION = 300000; // 5 minutes
	const WATCH_TIME_CHECK_INTERVAL = 1000; // Check watch time every 1 second
	const PROGRESS_SAVE_INTERVAL = 10000; // Save progress every 10 seconds

	let player;
	let container;
	let isLoading = !data.isAllVideoReady && !data.error;
	let error = data.error || null;
	let pollingInterval;
	let hasMarkedAsWatched = false;
	let lastWatchTimeCheck = 0;
	let progressSaveInterval;

	const availableResolutions = [
		{ label: '480p', src: `${BASE_URL}/${data.movieId}/480p/output.m3u8`, value: '480' },
		{ label: '720p', src: `${BASE_URL}/${data.movieId}/720p/output.m3u8`, value: '720' },
		{ label: '1080p', src: `${BASE_URL}/${data.movieId}/1080p/output.m3u8`, value: '1080' }
	];

	$: readyResolutions = new Set(data.availableResolutions);
	$: preferredResolution = data.preferredResolution || '1080';

	async function markMovieAsWatched() {
		if (hasMarkedAsWatched || !data.token) return;

		try {
			const response = await fetch(`${PUBLIC_BACK_URL}/movies/${data.movieId}/watched`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${data.token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				hasMarkedAsWatched = true;
			} else {
				console.error('Failed to mark movie as watched:', response.statusText);
			}
		} catch (error) {
			console.error('Error marking movie as watched:', error);
		}
	}

	async function saveWatchProgress(currentTime) {
		if (!data.token || !player) return;

		try {
			const response = await fetch(`${PUBLIC_BACK_URL}/movies/${data.movieId}/progress`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${data.token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ currentTime })
			});

			if (!response.ok) {
				console.error('Failed to save watch progress:', response.statusText);
			}
		} catch (error) {
			console.error('Error saving watch progress:', error);
		}
	}

	async function getWatchProgress() {
		if (!data.token) return 0;

		try {
			const response = await fetch(`${PUBLIC_BACK_URL}/movies/${data.movieId}/progress`, {
				headers: {
					Authorization: `Bearer ${data.token}`
				}
			});

			if (response.ok) {
				const progressData = await response.json();
				return progressData.progress || 0;
			}
		} catch (error) {
			console.error('Error getting watch progress:', error);
		}
		return 0;
	}

	function handleProgressSave() {
		if (!player || !player.duration() || player.duration() === 0) return;

		const currentTime = player.currentTime();
		const duration = player.duration();
		const watchedPercentage = (currentTime / duration) * 100;

		if (watchedPercentage > 95 || watchedPercentage < 1) return;

		if (duration < 120) return;

		saveWatchProgress(currentTime);
	}

	async function pollForVideoReadiness() {
		if (data.isAllVideoReady || data.error) {
			clearInterval(pollingInterval);
			return;
		}

		await invalidateAll();

		if (data.error) {
			error = data.error;
			isLoading = false;
			clearInterval(pollingInterval);
		} else if (data.isAllVideoReady) {
			isLoading = false;
			clearInterval(pollingInterval);
		}
	}

	function getPreferredSource() {
		if (readyResolutions.has(preferredResolution)) {
			return availableResolutions.find((res) => res.value === preferredResolution);
		}

		const sortedResolutions = ['1080', '720', '480'];
		for (const res of sortedResolutions) {
			if (readyResolutions.has(res)) {
				return availableResolutions.find((r) => r.value === res);
			}
		}

		return availableResolutions[0];
	}

	function createAuthHook() {
		return (options) => {
			if (!options.headers) {
				options.headers = {};
			}
			options.headers.Authorization = `Bearer ${data.token}`;
			return options;
		};
	}

	function setupAuthenticationHooks() {
		if (!data.token) return;

		if (typeof videojs !== 'undefined' && videojs.Vhs) {
			videojs.Vhs.xhr.onRequest(createAuthHook());
		}
	}

	function createBackButton() {
		const BackButton = videojs.getComponent('Button');

		class CustomBackButton extends BackButton {
			constructor(player, options) {
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

	async function initializeVideoPlayer() {
		if (!container || player || readyResolutions.size === 0) return;

		const preferredSource = getPreferredSource();
		if (!preferredSource) return;

		const options = {
			autoplay: true,
			controls: true,
			responsive: true,
			fluid: true,
			liveui: true,
			preload: 'auto',
			aspectRatio: '16:9',
			fill: true,
			sources: [{ src: preferredSource.src, type: 'application/x-mpegURL' }],
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
			controlBar.addChild(backButton, {}, 0); // Add as first button

			player.on('xhr-hooks-ready', () => {
				if (data.token && player.tech() && player.tech().vhs) {
					player.tech().vhs.xhr.onRequest(createAuthHook());
				}
			});

			player.on('error', (error) => {
				console.error('Video.js player error:', error);
			});

			player.on('ended', () => {
				markMovieAsWatched();
			});

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
				if (!hasMarkedAsWatched && player.duration() > 0) {
					const now = Date.now();
					if (now - lastWatchTimeCheck >= WATCH_TIME_CHECK_INTERVAL) {
						lastWatchTimeCheck = now;

						const currentTime = player.currentTime();
						const duration = player.duration();
						const watchedPercentage = (currentTime / duration) * 100;

						if (watchedPercentage >= 90) {
							markMovieAsWatched();
						}
					}
				}
			});

			player.on('loadedmetadata', async () => {
				const savedProgress = await getWatchProgress();
				if (savedProgress > 0 && player.duration() > 0) {
					const duration = player.duration();
					const watchedPercentage = (savedProgress / duration) * 100;

					if (watchedPercentage >= 1 && watchedPercentage <= 95) {
						player.currentTime(savedProgress);
					}
				}
			});

			progressSaveInterval = setInterval(() => {
				if (player && !player.paused() && player.duration() > 0) {
					handleProgressSave();
				}
			}, PROGRESS_SAVE_INTERVAL);

			player.on('pause', () => {
				handleProgressSave();
			});

			player.on('seeked', () => {
				handleProgressSave();
			});

			addResolutionButtons();
		} catch (error) {
			console.error('Error initializing video player:', error);
		}
	}

	function addResolutionButtons() {
		const controlBar = player.getChild('ControlBar');

		availableResolutions
			.filter((res) => readyResolutions.has(res.value))
			.forEach((res) => {
				const btn = controlBar.addChild('button', {
					controlText: res.label,
					className: 'vjs-visible-text'
				});
				btn.on('click', () => switchResolution(res));
			});
	}

	function switchResolution(resolution) {
		if (!player || !readyResolutions.has(resolution.value)) return;

		const currentTime = player.currentTime();
		player.src({ src: resolution.src, type: 'application/x-mpegURL' });
		player.ready(() => player.currentTime(currentTime));
	}

	$: if (data.isAllVideoReady && !isLoading && !error && container && !player) {
		setupAuthenticationHooks();
		initializeVideoPlayer();
	}

	$: {
		isLoading = !data.isAllVideoReady && !data.error;
		error = data.error || error;
		if ((data.isAllVideoReady || data.error) && pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	}

	onMount(() => {
		if (!data.isAllVideoReady && !data.error) {
			pollingInterval = setInterval(pollForVideoReadiness, POLL_INTERVAL);

			setTimeout(() => {
				if (pollingInterval) {
					clearInterval(pollingInterval);
					if (isLoading) {
						error = 'Video conversion timed out. Please try again later.';
						isLoading = false;
					}
				}
			}, TIMEOUT_DURATION);
		}
	});

	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
		if (player && !player.isDisposed()) {
			player.dispose();
			player = null;
		}
	});
</script>

{#if isLoading}
	<VideoLoading message={$_('video-player.converting')} />
{:else if error}
	<VideoError 
		title={$_('video-player.error-title')}
		message={error}
		onGoHome={() => goto('/')}
	/>
{:else}
	<div class="video-container" data-vjs-player bind:this={container}></div>
{/if}

<style>
	.video-container {
		width: 100%;
		height: 100vh;
		background: #000;
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
		width: 3em !important;
		height: 100% !important;
		cursor: pointer !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		color: white !important;
		background: rgba(0, 0, 0, 0.5) !important;
		border: none !important;
		transition: background-color 0.2s ease !important;
	}

	:global(.vjs-back-button:hover) {
		background: rgba(220, 38, 38, 0.8) !important;
	}

	:global(.vjs-back-button svg) {
		width: 20px !important;
		height: 20px !important;
		stroke: currentColor !important;
	}

	:global(.vjs-control-bar .vjs-back-button) {
		order: -1 !important;
	}
</style>
