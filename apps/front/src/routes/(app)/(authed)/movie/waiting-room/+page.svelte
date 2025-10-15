<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import VideoLoading from '@/components/tadflix/loading/video-loading.svelte';
    import { _ } from 'svelte-i18n';

    const id = $derived(page.url.searchParams.get('id'));
    
	// svelte-ignore state_referenced_locally
		if (id) {
		goto(`/movie/${id}`);
	} else {
		goto('/');
	}
</script>

<VideoLoading message={$_('video-player.server-loading')} />
