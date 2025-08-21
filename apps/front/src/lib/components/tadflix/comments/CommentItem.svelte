<script lang="ts">
	import { EditIcon, XIcon } from 'lucide-svelte';
	import UserAvatar from './UserAvatar.svelte';
	import type { Comment } from '@hypertube/shared';

	interface CommentItemProps {
		comment: Comment;
		currentUser?: string;
		currentUserId?: number;
		onEdit?: (commentId: number) => void;
		onDelete?: (commentId: number) => void;
	}

	const { comment, currentUserId, onEdit, onDelete }: CommentItemProps = $props();

	let expanded = $state(false);

	// Check if current user owns this comment
	const isOwner = $derived(currentUserId === comment.userId);

	// Format date
</script>

<div class={`flex w-full gap-2 rounded-none`}>
	<div
		class={`flex w-full gap-6 bg-[#141414] p-4 md:max-w-[80%] md:p-6 ${isOwner ? 'ml-auto' : ''}`}
	>
		<!-- User Avatar -->
		<UserAvatar username={comment.username} size="medium" />

		<!-- Comment Content -->
		<div class="flex flex-1 flex-col gap-2">
			<!-- Comment Text -->
			<p class="text-xl leading-[1.19] text-white transition-all duration-300">
				{comment.content}
			</p>
		</div>
	</div>
	<!-- Action Buttons (Only show for comment owner) -->
	{#if isOwner}
		<div class="flex flex-col items-center gap-4">
			<!-- Edit Button -->
			{#if onEdit}
				<button
					onclick={() => onEdit?.(comment.id)}
					class="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-gray-700"
					aria-label="Edit comment"
				>
					<!-- Lucide Edit Icon -->
					<EditIcon />
				</button>
			{/if}

			<!-- Delete Button -->
			{#if onDelete}
				<button
					onclick={() => onDelete?.(comment.id)}
					class="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-red-700"
					aria-label="Delete comment"
				>
					<XIcon />
				</button>
			{/if}
		</div>
	{/if}
</div>