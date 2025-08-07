<script lang="ts">
	import { createMovieComment } from '$lib/services/api';
	import UserAvatar from './UserAvatar.svelte';
	import type { Comment } from '@hypertube/shared';
	
	interface CommentInputProps {
		movieId: number;
		currentUser: string;
		token: string;
		onCommentAdded?: (comment: Comment) => void;
	}

	const { movieId, currentUser, token, onCommentAdded }: CommentInputProps = $props();

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

<div class="w-full">
	<!-- Comment Input -->
	<div class="bg-[rgba(0,0,0,0.5)] border border-[#808080] rounded-md p-4 flex gap-3">
		<!-- User Avatar -->
		<UserAvatar username={currentUser} size="medium" />

		<!-- Input and Send Button Container -->
		<div class="flex-1 flex flex-col gap-4">
			<!-- Textarea -->
			<textarea
				bind:value={content}
				onkeydown={handleKeydown}
				placeholder="Your comentary ..."
				rows="4"
				maxlength="1000"
				class="bg-transparent text-white placeholder-[#BDBCBB] text-base resize-none border-none outline-none w-full font-medium"
				class:cursor-not-allowed={isSubmitting}
				disabled={isSubmitting}
			></textarea>

			<!-- Send Button Container -->
			<div class="flex justify-end">
				<button
					onclick={handleSubmit}
					disabled={!content.trim() || isSubmitting}
					class="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
					class:opacity-50={!content.trim() || isSubmitting}
					class:cursor-not-allowed={!content.trim() || isSubmitting}
					aria-label="Send comment"
				>
					<!-- Lucide Send Icon -->
					<svg 
						width="20" 
						height="20" 
						viewBox="0 0 24 24" 
						fill="none"
						stroke="white"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M22 2L11 13"/>
						<polygon points="22,2 15,22 11,13 2,9"/>
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mt-2 text-red-500 text-sm">
			{error}
		</div>
	{/if}
</div>

<style>
	textarea::placeholder {
		color: #BDBCBB;
		font-family: Poppins, sans-serif;
		font-weight: 500;
		font-size: 16px;
		line-height: 1.5;
		text-align: center;
	}

	textarea {
		font-family: Poppins, sans-serif;
		font-weight: 500;
		font-size: 16px;
		line-height: 1.5;
	}
</style>
