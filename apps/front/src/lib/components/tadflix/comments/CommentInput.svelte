<script lang="ts">
	import { createMovieComment } from '$lib/services/api';
	import { SendIcon } from 'lucide-svelte';
	import UserAvatar from './UserAvatar.svelte';
	import type { Comment } from '@hypertube/shared';

	interface CommentInputProps {
		movieId: number;
		token: string;
		username: string;
		onCommentAdded?: (comment: Comment) => void;
	}

	const { movieId, token, username, onCommentAdded }: CommentInputProps = $props();

	let content = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	const handleSubmit = async () => {
		if (!content.trim() || isSubmitting) return;

		isSubmitting = true;
		error = null;

		try {
			const newComment = await createMovieComment(movieId, content.trim(), token);
			content = '';
			onCommentAdded?.(newComment);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to post comment';
		} finally {
			isSubmitting = false;
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	};
</script>

<div class="flex w-full justify-end gap-2">
	<textarea
		bind:value={content}
		onkeydown={handleKeydown}
		rows="4"
		maxlength="1000"
		placeholder="Your comment..."
		class="w-full resize-none rounded-[4px] border-[1px] border-[#808080] bg-[#00000080] px-4 py-5 text-base font-medium text-white placeholder-[#BDBCBB] outline-none md:max-w-[60%]"
		class:cursor-not-allowed={isSubmitting}
		disabled={isSubmitting}
	></textarea>
	<div class="flex flex-col justify-between">
		<UserAvatar {username} size="medium" />
		<button
			onclick={handleSubmit}
			disabled={!content.trim() || isSubmitting}
			class="hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
			aria-label="Send comment"
		>
			<SendIcon color="white" />
		</button>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mt-2 text-sm text-red-500">
			{error}
		</div>
	{/if}
</div>
