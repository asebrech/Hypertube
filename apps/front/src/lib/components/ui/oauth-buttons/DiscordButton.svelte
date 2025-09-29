<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import { siDiscord } from 'simple-icons';

	interface DiscordButtonProps {
		text: string;
		action: string;
	}

	const { text, action }: DiscordButtonProps = $props();
</script>

<form method="POST" {action} use:enhance>
	<Button
		variant="outline"
		class="w-full border-indigo-500 bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
		type="submit"
	>
		<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
			<path d={siDiscord.path} />
		</svg>
		{text}
	</Button>
</form>