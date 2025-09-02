<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import { si42 } from 'simple-icons';

	interface FortyTwoButtonProps {
		text: string;
		action: string;
	}

	const { text, action }: FortyTwoButtonProps = $props();
</script>

<form method="POST" {action} use:enhance>
	<Button
		variant="outline"
		class="w-full border-none bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-white hover:from-cyan-500 hover:to-blue-600"
		type="submit"
	>
		<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
			<path d={si42.path} />
		</svg>
		{text}
	</Button>
</form>
