<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to account page
		goto('/account', { replaceState: true });
	});
</script>

<div>Redirecting to account settings...</div>
