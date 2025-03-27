<script lang="ts">
	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/stores';

	import { enhance } from '$app/forms';
	import Icon from '$lib/assets/tadflix.svelte';

	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<ModeWatcher defaultMode={'dark'} />

<Card.Root>
	<Card.Content class="flex items-center justify-between">
		<Icon />
		<div>
			{#if !$page.data.user}
				<Button href="/login">Sign in</Button>
			{/if}

			{#if $page.data.user}
				<form action="/logout" method="POST" use:enhance>
					<Button type="submit">Log out</Button>
				</form>
			{/if}
		</div>
	</Card.Content>
</Card.Root>

{@render children?.()}
