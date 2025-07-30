<script>
	import { onMount, onDestroy } from 'svelte';
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_BACK_URL } from '$env/static/public';

	export let data;

	const BASE_URL = `${PUBLIC_BACK_URL}/stream`;

	const POLL_INTERVAL = 5000; // 5 seconds
	const TIMEOUT_DURATION = 300000; // 5 minutes

	let player;
	let container;
	let isLoading = !data.isAllVideoReady;
	let loadingMessage = data.isAllVideoReady ? '' : 'Converting video files... Please wait.';
	let error = null;
	let pollingInterval;
	let hasMarkedAsWatched = false;

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

	function initializeVideoPlayer() {
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
					const currentTime = player.currentTime();
					const duration = player.duration();
					const watchedPercentage = (currentTime / duration) * 100;

					if (watchedPercentage >= 90) {
						markMovieAsWatched();
					}
				}
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
	<div class="flex min-h-96 flex-col items-center justify-center space-y-4">
		<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
		<p class="text-lg font-medium">{loadingMessage}</p>
		<p class="text-sm text-gray-600">This may take a few minutes...</p>
	</div>
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
	<div data-vjs-player bind:this={container}></div>
{/if}
