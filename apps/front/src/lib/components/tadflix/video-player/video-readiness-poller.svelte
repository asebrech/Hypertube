<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { VIDEO_CONFIG } from './video-player-utils.js';

	interface Props {
		isReady: boolean;
		hasError: boolean;
		onReady?: () => void;
		onError?: (error: string) => void;
		onTimeout?: () => void;
	}

	let {
		isReady,
		hasError,
		onReady,
		onError,
		onTimeout
	}: Props = $props();

	let pollingInterval: ReturnType<typeof setInterval>;
	let timeoutId: ReturnType<typeof setTimeout>;

	onMount(() => {
		if (!isReady && !hasError) {
			startPolling();
			setupTimeout();
		}
	});

	onDestroy(() => {
		cleanup();
	});

	function cleanup() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}

	function startPolling() {
		pollingInterval = setInterval(async () => {
			if (isReady || hasError) {
				cleanup();
				return;
			}

			try {
				await invalidateAll();
				
				if (hasError) {
					cleanup();
					onError?.('Video conversion failed');
				} else if (isReady) {
					cleanup();
					onReady?.();
				}
			} catch {
			}
		}, VIDEO_CONFIG.POLL_INTERVAL);
	}

	function setupTimeout() {
		timeoutId = setTimeout(() => {
			if (!isReady) {
				cleanup();
				onTimeout?.();
			}
		}, VIDEO_CONFIG.TIMEOUT_DURATION);
	}

	$effect(() => {
		if (isReady || hasError) {
			cleanup();
		}
	});
</script>
