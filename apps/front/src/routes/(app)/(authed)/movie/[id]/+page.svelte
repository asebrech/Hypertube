<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { PUBLIC_BACK_URL } from '$env/static/public';
	import VideoLoading from '$lib/components/tadflix/loading/video-loading.svelte';
	import VideoError from '$lib/components/tadflix/error/video-error.svelte';
	import VideoPlayer from '$lib/components/tadflix/video-player/video-player.svelte';
	import VideoReadinessPoller from '$lib/components/tadflix/video-player/video-readiness-poller.svelte';
	import { getMovieDetails } from '@/services/api';

	interface Props {
		data: {
			movieId: string;
			title: string;
			overview: string;
			isAllVideoReady: boolean;
			error?: string;
			availableResolutions: string[];
			preferredResolution?: string;
			token?: string;
		};
	}

	let { data }: Props = $props();

	const BASE_URL = `${PUBLIC_BACK_URL}/stream`;

	let isLoading = $state(!data.isAllVideoReady && !data.error);
	let error = $state(data.error || null);
	let isPlayerReady = $state(false);

	const shouldShowPlayer = $derived(data.isAllVideoReady && !isLoading && !error && isPlayerReady);
	const shouldShowLoading = $derived(isLoading && !error);
	const shouldShowError = $derived(!!error);
	$effect(() => {
		getMovieDetails(parseInt(data.movieId), 'movie', data.token)
			.then((details) => {
				data.title = details.title;
				data.overview = details.overview;
			})
			.catch(() => {
				data.title = 'Unknown Title';
				data.overview = 'No overview available.';
			});
	})

	onMount(() => {
		if (data.isAllVideoReady) {
			isPlayerReady = true;
		}
	});

	function handleVideoReady() {
		isLoading = false;
		isPlayerReady = true;
	}

	function handleVideoError(errorMessage: string) {
		error = errorMessage;
		isLoading = false;
	}

	function handleTimeout() {
		error = $_('video-player.timeout-error');
		isLoading = false;
	}

	function handlePlayerError(errorMessage: string) {
		error = errorMessage;
	}

	function handleGoHome() {
		goto('/');
	}
</script>

{#if !data.isAllVideoReady && !error}
	<VideoReadinessPoller
		isReady={data.isAllVideoReady}
		hasError={!!data.error}
		onReady={handleVideoReady}
		onError={handleVideoError}
		onTimeout={handleTimeout}
	/>
{/if}

{#if shouldShowLoading}
	<VideoLoading message={$_('video-player.converting')} />
{:else if shouldShowError}
	<VideoError title={$_('video-player.error-title')} message={error || 'Unknown error'} onGoHome={handleGoHome} />
{:else if shouldShowPlayer}
	<VideoPlayer
		movieId={data.movieId}
		title={data.title}
		overview={data.overview}
		token={data.token}
		baseUrl={BASE_URL}
		availableResolutions={data.availableResolutions}
		preferredResolution={data.preferredResolution}
		onError={handlePlayerError}
	/>
{/if}
