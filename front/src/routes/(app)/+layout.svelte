<script lang="ts">
	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/stores';

	import { enhance } from '$app/forms';
</script>

<ModeWatcher defaultMode={'dark'} />

<nav>
	{#if !$page.data.user}
		<a href="/login">Login</a>
		<a href="/register">Register</a>
	{/if}

	{#if $page.data.user}
		<form action="/logout" method="POST" use:enhance>
			<button type="submit">Log out</button>
		</form>
	{/if}
</nav>

{@render children?.()}
