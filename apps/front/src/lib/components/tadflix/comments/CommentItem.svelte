<script lang="ts">
	import { EditIcon, XIcon } from 'lucide-svelte';
	import UserProfilePicture from '$lib/components/UserProfilePicture.svelte';
	import CommentInput from './CommentInput.svelte';
	import type { Comment } from '@hypertube/shared';
	import { _, locale } from 'svelte-i18n';
	import { goto } from '$app/navigation';

	interface CommentItemProps {
		comment: Comment;
		currentUser?: string;
		currentUserId?: number;
		token?: string;
		data?: any;
		onDelete?: (commentId: number) => void;
		onUpdate?: (updatedComment: Comment) => void;
	}

	const { comment, currentUserId, token, data, onDelete, onUpdate }: CommentItemProps = $props();

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

	const navigateToProfile = () => {
		goto(`/${comment.username}`);
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

<style>
	/* Target CommentInput only when wrapped in comment-edit-mode */
	.comment-edit-mode :global(.flex.w-full.justify-end.gap-2) {
		@media (max-width: 767px) {
			flex-direction: column;
		}
	}
	
	.comment-edit-mode :global(.flex.flex-col.justify-end) {
		@media (max-width: 767px) {
			flex-direction: row;
			justify-content: flex-end;
			border-top: 1px solid rgb(55 65 81);
			padding-top: 0.5rem;
			margin-top: 0.5rem;
		}
	}
</style>

<div class={`flex w-full rounded-none ${isOwner ? 'flex-row-reverse' : 'flex-row'}`}>
	<!-- Action Buttons on Side - Desktop only -->
	{#if isOwner && !isEditing}
		<div class="hidden flex-col items-center gap-4 md:flex">
			<!-- Edit Button -->
			<button
				onclick={startEdit}
				class="flex items-center justify-center rounded p-2 transition-colors hover:bg-gray-700"
				aria-label={$_('comments.edit')}
			>
				<EditIcon size={20} />
			</button>

			<!-- Delete Button -->
			{#if onDelete}
				<button
					onclick={() => onDelete?.(comment.id)}
					class="flex items-center justify-center rounded p-2 transition-colors hover:bg-red-700"
					aria-label={$_('comments.delete')}
				>
					<XIcon size={20} />
				</button>
			{/if}
		</div>
	{/if}

	<div class={`flex w-full gap-6 bg-[#141414] p-4 md:max-w-[80%] md:p-6 items-start`}>
		<!-- User Avatar -->
		<button
			onclick={navigateToProfile}
			class="cursor-pointer rounded-lg transition-all hover:ring-2 hover:ring-white/20"
			aria-label={`View ${comment.username}'s profile`}
		>
			<UserProfilePicture
				profilePicture={comment.profilePicture}
				username={comment.username}
				size="medium"
				class="cursor-pointer transition-all hover:ring-2 hover:ring-white/20"
				alt="{comment.username}'s profile"
			/>
		</button>

		<!-- Comment Content -->
		<div class="flex flex-1 flex-col gap-2">
			{#if isEditing}
				<!-- Edit Mode using CommentInput -->
				<div class="comment-edit-mode">
					<CommentInput
						token={token || ''}
						username={comment.username}
						{data}
						isEditMode={true}
						existingComment={comment}
						onCommentUpdated={handleCommentUpdated}
						onCancel={cancelEdit}
						showAvatar={false}
						fullWidth={true}
					/>
				</div>
			{:else}
				<!-- Display Mode -->
				<div class="flex flex-col gap-2">
					<!-- Username and Date Header -->
					<div class="flex items-center gap-2 text-sm text-gray-400">
						<button
							onclick={navigateToProfile}
							class="font-medium text-white transition-colors hover:text-blue-400 focus:underline focus:outline-none"
						>
							{comment.username}
						</button>
						<span>•</span>
						<span>{formatDate(comment.createdAt)}</span>
						{#if comment.updatedAt && comment.updatedAt !== comment.createdAt}
							<span>•</span>
							<span class="italic">
								<span class="hidden sm:inline">{$_('comments.edited')}</span>
								<span class="sm:hidden">*</span>
								<span class="xs:inline hidden sm:inline">{formatDate(comment.updatedAt)}</span>
							</span>
						{/if}
					</div>
					<!-- Comment Content -->
					<p class="text-xl leading-[1.19] break-all text-white transition-all duration-300">
						{comment.content}
					</p>
				</div>
			{/if}

			<!-- Action Buttons Below - Mobile only, not when editing -->
			{#if isOwner && !isEditing}
				<div
					class="flex items-center justify-end gap-4 border-t border-gray-700 pt-2 md:hidden"
				>
					<!-- Edit Button -->
					<button
						onclick={startEdit}
						class="flex items-center justify-center rounded p-2 transition-colors hover:bg-gray-700"
						aria-label={$_('comments.edit')}
					>
						<EditIcon size={20} />
					</button>

					<!-- Delete Button -->
					{#if onDelete}
						<button
							onclick={() => onDelete?.(comment.id)}
							class="flex items-center justify-center rounded p-2 transition-colors hover:bg-red-700"
							aria-label={$_('comments.delete')}
						>
							<XIcon size={20} />
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
