<script>
	import { onMount, onDestroy } from 'svelte';
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';
	import { invalidateAll } from '$app/navigation';

	export let data;

	const BASE_URL = 'http://localhost:3333/stream';
	let player;
	let container;
	let isLoading = !data.isAnyVideoReady;
	let loadingMessage = data.isAnyVideoReady ? '' : 'Converting video files... Please wait.';
	let error = null;
	let pollingInterval;

	const availableResolutions = [
		{ label: '480p', src: `${BASE_URL}/${data.movieId}/480p/output.m3u8`, value: '480' },
		{ label: '720p', src: `${BASE_URL}/${data.movieId}/720p/output.m3u8`, value: '720' },
		{ label: '1080p', src: `${BASE_URL}/${data.movieId}/1080p/output.m3u8`, value: '1080' }
	];

	// Create a reactive set of ready resolutions from server data
	$: readyResolutions = new Set(data.availableResolutions);
	$: preferredResolution = data.preferredResolution || '1080';

	async function pollForVideoReadiness() {
		if (data.isAnyVideoReady) {
			clearInterval(pollingInterval);
			return;
		}

		// Use SvelteKit's invalidateAll to re-run the load function
		await invalidateAll();
		
		// If still no videos are ready, continue polling
		if (!data.isAnyVideoReady) {
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
			sources: [{ src: preferredSource.src, type: 'application/x-mpegURL' }]
		};

		try {
			// Create video element
			const videoElement = document.createElement('video-js');
			videoElement.className = 'vjs-big-play-centered';
			container.appendChild(videoElement);

			player = videojs(videoElement, options, function () {
				console.log('Player is ready');
			});

			// Add error handling for the player
			player.on('error', (error) => {
				console.error('Video.js player error:', error);
			});

			// Add resolution switching buttons for ready resolutions only
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
		} catch (error) {
			console.error('Error initializing video player:', error);
		}
	}

	// Reactive statement to initialize player when data is ready
	$: if (data.isAnyVideoReady && !isLoading && !error && container && !player) {
		setTimeout(() => {
			if (container && document.contains(container)) {
				initializeVideoPlayer();
			}
		}, 100);
	}

	// Update loading state when data changes
	$: {
		isLoading = !data.isAnyVideoReady;
		if (data.isAnyVideoReady && pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	}

	function switchResolution(resolution) {
		if (!player || !readyResolutions.has(resolution.value)) return;
		const time = player.currentTime();
		player.src({ src: resolution.src, type: 'application/x-mpegURL' });
		player.ready(() => player.currentTime(time));
	}

	onMount(() => {
		// Only start polling if no videos are ready yet
		if (!data.isAnyVideoReady) {
			pollingInterval = setInterval(pollForVideoReadiness, 5000); // Poll every 5 seconds

			// Set a timeout to stop polling after 5 minutes
			setTimeout(() => {
				if (pollingInterval) {
					clearInterval(pollingInterval);
					if (isLoading) {
						error = 'Video conversion timed out. Please try again later.';
						isLoading = false;
					}
				}
			}, 300000); // 5 minutes timeout
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
