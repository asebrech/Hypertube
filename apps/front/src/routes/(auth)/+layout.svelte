<script lang="ts">
	let { children } = $props();
	import Icon from '$lib/assets/tadflix.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<Card.Root class="mb-5">
	<Card.Content class="flex items-center justify-between">
		<a href="/">
			<Icon />
		</a>
	</Card.Content>
</Card.Root>

{@render children?.()}
