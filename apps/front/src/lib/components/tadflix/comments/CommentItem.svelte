<script lang="ts">
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

<div class="w-full bg-[#141414] rounded-none p-4 md:p-6">
	<div class="flex gap-6">
		<!-- User Avatar -->
		<UserAvatar username={comment.username} size="medium" />

		<!-- Comment Content -->
		<div class="flex-1 flex flex-col gap-2">
			<!-- Comment Text -->
			<p
				bind:this={contentEl}
				class="text-white text-xl leading-[1.19] transition-all duration-300 {expanded ? '' : 'line-clamp-3'}"
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
			<span class="text-[#B3B3B3] text-sm mt-2">
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
						class="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
						aria-label="Edit comment"
					>
						<!-- Lucide Edit Icon -->
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
							<path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
						</svg>
					</button>
				{/if}

				<!-- Delete Button -->
				{#if onDelete}
					<button
						onclick={() => onDelete?.(comment.id)}
						class="w-6 h-6 flex items-center justify-center hover:bg-red-700 rounded transition-colors"
						aria-label="Delete comment"
					>
						<!-- Lucide X Icon -->
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 6L6 18"/>
							<path d="M6 6l12 12"/>
						</svg>
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
