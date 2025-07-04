<script>
	import { onMount, onDestroy } from 'svelte';
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';

	// export let videoId = 117;

	const BASE_URL = 'http://localhost:3333/hls';
	let player;
	let container;

	// const masterFileSrc = `http://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8`;
	const masterFileSrc = `${BASE_URL}/117/1080.m3u8`;
	// const masterFileSrc = `${BASE_URL}/test-vtt/playlist.m3u8`;
	const availableResolutions = [
		// { label: '360p', src: `${BASE_URL}/117/360.m3u8` },
		{ label: '480p', src: `${BASE_URL}/117/480.m3u8` },
		{ label: '720p', src: `${BASE_URL}/117/720.m3u8` },
		{ label: '1080p', src: `${BASE_URL}/117/1080.m3u8` }
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
