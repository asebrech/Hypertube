<script>
	import { onMount, onDestroy } from 'svelte';
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	// export let videoId = 117;

	const BASE_URL = 'http://localhost:3333/hls';
	let player;
	let container;

	// const masterFileSrc = `http://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8`;

	const id = get(page).params.id;
	console.log('Video ID:', id);
	const masterFileSrc = `${BASE_URL}/${id}/1080p/output.m3u8`;
	const availableResolutions = [
		{ label: '480p', src: `${BASE_URL}/${id}/480p/output.m3u8` },
		{ label: '720p', src: `${BASE_URL}/${id}/720p/output.m3u8` },
		{ label: '1080p', src: `${BASE_URL}/${id}/1080p/output.m3u8` }
	];
	console.log(masterFileSrc);

	const options = {
		autoplay: true,
		controls: true,
		responsive: true,
		fluid: true,
		liveui: true,

		sources: [{ src: masterFileSrc, type: 'application/x-mpegURL' }]
	};

	function switchResolution(index) {
		if (!player) return;
		const time = player.currentTime();
		player.src({ src: availableResolutions[index].src, type: 'application/x-mpegURL' });
		player.ready(() => player.currentTime(time));
	}

	onMount(() => {
		// create a <video-js> element
		const videoElement = document.createElement('video-js');
		videoElement.className = 'vjs-big-play-centered';
		container.appendChild(videoElement);

		player = videojs(videoElement, options, function () {
			videojs.log('Player is ready');
		});

		player.duration(1200);

		const controlBar = player.getChild('ControlBar');
		availableResolutions.forEach((res, i) => {
			const btn = controlBar.addChild('button', {
				controlText: res.label,
				className: 'vjs-visible-text'
			});
			btn.on('click', () => switchResolution(i));
		});
		return () => {
			if (player && !player.isDisposed()) {
				player.dispose();
			}
		};
	});

	onDestroy(() => {
		if (player && !player.isDisposed()) {
			player.dispose();
			player = null;
		}
	});
</script>

<div data-vjs-player bind:this={container}></div>
