<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import { siGoogle } from 'simple-icons';

	interface GoogleButtonProps {
		text: string;
		action: string;
	}

	const { text, action }: GoogleButtonProps = $props();
</script>

<form method="POST" {action} use:enhance>
	<Button
		variant="outline"
		class="w-full border-gray-300 bg-white font-semibold text-black hover:bg-gray-100 hover:text-black"
		type="submit"
	>
		<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
			<path d={siGoogle.path} />
		</svg>
		{text}
	</Button>
</form>
