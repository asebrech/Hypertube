<script lang="ts">
	import { EditIcon, XIcon } from 'lucide-svelte';
	import UserAvatar from './UserAvatar.svelte';
	import type { Comment } from '@hypertube/shared';

	interface CommentItemProps {
		comment: Comment;
		currentUser?: string;
		onEdit?: (commentId: number) => void;
		onDelete?: (commentId: number) => void;
	}

	const { comment, currentUser, onEdit, onDelete }: CommentItemProps = $props();

	let expanded = $state(false);
	let contentEl: HTMLParagraphElement;
	let isClamped = $state(false);

	$effect(() => {
		if (contentEl) {
			const { scrollHeight, clientHeight } = contentEl;
			isClamped = scrollHeight > clientHeight;
		}
	});

	// Check if current user owns this comment
	const isOwner = $derived(currentUser === comment.username);

	// Format date
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 1440)}d ago`;

		return date.toLocaleDateString();
	};
</script>

<div class="w-full rounded-none md:max-w-[80%] bg-[#141414] p-4 md:p-6">
	<div class="flex gap-6">
		<!-- User Avatar -->
		<UserAvatar username={comment.username} size="medium" />

		<!-- Comment Content -->
		<div class="flex flex-1 flex-col gap-2">
			<!-- Comment Text -->
			<p
				bind:this={contentEl}
				class="text-xl leading-[1.19] text-white transition-all duration-300 {expanded
					? ''
					: 'line-clamp-3'}"
			>
				{comment.content}
			</p>

			<!-- See More/Less Button -->
			{#if isClamped}
				<button
					onclick={() => (expanded = !expanded)}
					class="self-start text-sm text-blue-600 hover:underline"
				>
					{expanded ? 'See less' : 'See more'}
				</button>
			{/if}

			<!-- Date -->
			<span class="mt-2 text-sm text-[#B3B3B3]">
				{formatDate(comment.date)}
			</span>
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
</div>
