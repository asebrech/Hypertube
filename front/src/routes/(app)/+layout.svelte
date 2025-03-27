<script lang="ts">
	let { children } = $props();
	import { page } from '$app/stores';

	import { enhance } from '$app/forms';
	import Icon from '$lib/assets/tadflix.svelte';

	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<Card.Root class="mb-5">
	<Card.Content class="flex items-center justify-between">
		<a href="/">
			<Icon />
		</a>
		<div>
			{#if !$page.data.user}
				<a href="/login">
					<Button>Sign in</Button>
				</a>
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
