<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import { siGithub } from 'simple-icons';

	interface GithubButtonProps {
		text: string;
		action: string;
	}

	const { text, action }: GithubButtonProps = $props();
</script>

<form method="POST" {action} use:enhance>
	<Button
		variant="outline"
		class="w-full border-gray-700 bg-gray-900 font-semibold text-white hover:bg-gray-800"
		type="submit"
	>
		<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
			<path d={siGithub.path} />
		</svg>
		{text}
	</Button>
</form>
