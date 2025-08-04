<script>
	import { onMount, onDestroy } from 'svelte';
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_BACK_URL } from '$env/static/public';
	import NetflixLoader from '$lib/components/tadflix/NetflixLoader.svelte';

	export let data;

	const BASE_URL = `${PUBLIC_BACK_URL}/stream`;

	const POLL_INTERVAL = 5000; // 5 seconds
	const TIMEOUT_DURATION = 300000; // 5 minutes
	const WATCH_TIME_CHECK_INTERVAL = 1000; // Check watch time every 1 second
	const PROGRESS_SAVE_INTERVAL = 10000; // Save progress every 10 seconds

	let player;
	let container;
	let isLoading = !data.isAllVideoReady;
	let loadingMessage = data.isAllVideoReady ? '' : 'Converting video files... Please wait.';
	let error = null;
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
		if (data.isAllVideoReady) {
			clearInterval(pollingInterval);
			return;
		}

		await invalidateAll();

		if (!data.isAllVideoReady) {
			loadingMessage = 'Converting video files... Please wait.';
		} else {
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
			sources: [{ src: preferredSource.src, type: 'application/x-mpegURL' }],
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

			player = videojs(videoElement, options);

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
		isLoading = !data.isAllVideoReady;
		if (data.isAllVideoReady && pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	}

	onMount(() => {
		if (!data.isAllVideoReady) {
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
	<NetflixLoader 
		variant="conversion"
		title="Converting Video"
		subtitle="Optimizing quality for the best streaming experience..."
		showProgress={true}
	/>
{:else if error}
	<div class="flex min-h-96 flex-col items-center justify-center space-y-4">
		<div class="text-6xl text-red-500">⚠️</div>
		<p class="text-lg font-medium text-red-600">{error}</p>
		<button
			class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
			on:click={() => window.location.reload()}
		>
			Try Again
		</button>
	</div>
{:else}
	<div class="fixed inset-0 z-[9999] bg-background">
		<div data-vjs-player bind:this={container} class="h-full w-full"></div>
	</div>
{/if}
