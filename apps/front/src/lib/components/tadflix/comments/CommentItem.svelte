<script lang="ts">
	import { EditIcon, XIcon } from 'lucide-svelte';
	import UserAvatar from './UserAvatar.svelte';
	import CommentInput from './CommentInput.svelte';
	import type { Comment } from '@hypertube/shared';
	import { _, locale } from 'svelte-i18n';

	interface CommentItemProps {
		comment: Comment;
		currentUser?: string;
		currentUserId?: number;
		token?: string;
		onDelete?: (commentId: number) => void;
		onUpdate?: (updatedComment: Comment) => void;
	}

	const { comment, currentUserId, token, onDelete, onUpdate }: CommentItemProps = $props();

	let isEditing = $state(false);

	// Check if current user owns this comment
	const isOwner = $derived(currentUserId === comment.userId);

	const startEdit = () => {
		isEditing = true;
	};

	const cancelEdit = () => {
		isEditing = false;
	};

	const handleCommentUpdated = (updatedComment: Comment) => {
		isEditing = false;
		onUpdate?.(updatedComment);
	};

	// Format date - show time if today, date if not
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();
		const isToday = date.toDateString() === today.toDateString();
		const currentLocale = $locale || 'en';
		
		if (isToday) {
			return date.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
		} else {
			return date.toLocaleDateString(currentLocale);
		}
	};
</script>

<div class={`flex w-full gap-2 rounded-none`}>
	<div
		class={`flex w-full gap-6 bg-[#141414] p-4 md:max-w-[80%] md:p-6 ${isOwner ? 'ml-auto' : ''}`}
	>
		<!-- User Avatar -->
		<UserAvatar username={comment.username} size="medium" />

		<!-- Comment Content -->
		<div class="flex flex-1 flex-col gap-2">
			{#if isEditing}
				<!-- Edit Mode using CommentInput -->
				<CommentInput
					token={token || ''}
					username={comment.username}
					isEditMode={true}
					existingComment={comment}
					onCommentUpdated={handleCommentUpdated}
					onCancel={cancelEdit}
					showAvatar={false}
					fullWidth={true}
				/>
			{:else}
				<!-- Display Mode -->
				<div class="flex flex-col gap-2">
					<!-- Username and Date Header -->
					<div class="flex items-center gap-2 text-sm text-gray-400">
						<span class="font-medium text-white">{comment.username}</span>
						<span>•</span>
						<span>{formatDate(comment.createdAt)}</span>
						{#if comment.updatedAt && comment.updatedAt !== comment.createdAt}
							<span>•</span>
							<span class="italic">{$_('comments.edited')} {formatDate(comment.updatedAt)}</span>
						{/if}
					</div>
					<!-- Comment Content -->
					<p class="text-xl leading-[1.19] text-white transition-all duration-300 break-all">
						{comment.content}
					</p>
				</div>
			{/if}
		</div>
	</div>
	<!-- Action Buttons (Only show for comment owner) -->
	{#if isOwner}
		<div class="flex flex-col items-center gap-4">
			<!-- Edit Button -->
			{#if !isEditing}
				<button
					onclick={startEdit}
					class="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-gray-700"
					aria-label={$_('comments.edit')}
				>
					<EditIcon />
				</button>
			{/if}

			<!-- Delete Button -->
			{#if onDelete && !isEditing}
				<button
					onclick={() => onDelete?.(comment.id)}
					class="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-red-700"
					aria-label={$_('comments.delete')}
				>
					<XIcon />
				</button>
			{/if}
		</div>
	{/if}
</div>