<script lang="ts">
	import { createMovieComment, updateComment } from '$lib/services/api';
	import { SendIcon, CheckIcon, XIcon, Loader2 } from 'lucide-svelte';
	import UserProfilePicture from '$lib/components/UserProfilePicture.svelte';
	import type { Comment } from '@hypertube/shared';
	import { _ } from 'svelte-i18n';

	interface CommentInputProps {
		movieId?: number;
		token: string;
		username: string;
		data?: any;
		onCommentAdded?: (comment: Comment) => void;
		// Edit mode props
		isEditMode?: boolean;
		existingComment?: Comment;
		onCommentUpdated?: (comment: Comment) => void;
		onCancel?: () => void;
		// Style props
		showAvatar?: boolean;
		fullWidth?: boolean;
	}

	const { 
		movieId, 
		token, 
		username, 
		data,
		onCommentAdded, 
		isEditMode = false, 
		existingComment, 
		onCommentUpdated, 
		onCancel,
		showAvatar = true,
		fullWidth = false
	}: CommentInputProps = $props();

	let content = $state(isEditMode ? existingComment?.content || '' : '');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	const handleSubmit = async () => {
		if (!content.trim() || isSubmitting) return;

		isSubmitting = true;
		error = null;

		try {
			if (isEditMode && existingComment) {
				// Update existing comment
				const updatedComment = await updateComment(existingComment.id, content.trim(), token);
				onCommentUpdated?.(updatedComment);
			} else if (movieId) {
				// Create new comment
				const newComment = await createMovieComment(movieId, content.trim(), token);
				content = '';
				onCommentAdded?.(newComment);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : $_('comments.failed-to-post');
		} finally {
			isSubmitting = false;
		}
	};

	const handleCancel = () => {
		if (isEditMode) {
			content = existingComment?.content || '';
			onCancel?.();
		} else {
			content = '';
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		} else if (event.key === 'Escape' && isEditMode) {
			event.preventDefault();
			handleCancel();
		}
	};
</script>

<div class="flex w-full justify-end gap-2">
	<textarea
		bind:value={content}
		onkeydown={handleKeydown}
		rows="4"
		maxlength="1000"
		placeholder={$_('comments.placeholder')}
		class="w-full resize-none rounded-[4px] border-[1px] border-[#808080] bg-[#00000080] px-4 py-5 text-base font-medium text-white placeholder-[#BDBCBB] outline-none transition-opacity"
		class:md:max-w-[60%]={!fullWidth}
		class:cursor-not-allowed={isSubmitting}
		class:opacity-60={isSubmitting}
		disabled={isSubmitting}
	></textarea>
	{#if showAvatar}
		<div class="flex flex-col justify-between">
			<UserProfilePicture
				profilePicture={data?.user?.profilePicture}
				username={data?.user?.username || username}
				size="medium"
				alt="{data?.user?.username || username}'s profile"
			/>
			<div class="flex gap-2">
				{#if isEditMode}
					<!-- Save button -->
					<button
						onclick={handleSubmit}
						disabled={!content.trim() || isSubmitting}
						class="hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
						aria-label={$_('comments.save')}
					>
						{#if isSubmitting}
							<Loader2 class="size-5 animate-spin" />
						{:else}
							<CheckIcon color="white" size={20} />
						{/if}
					</button>
					<!-- Cancel button -->
					<button
						onclick={handleCancel}
						disabled={isSubmitting}
						class="hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
						aria-label={$_('comments.cancel')}
					>
						<XIcon color="white" size={20} />
					</button>
				{:else}
					<!-- Send button -->
					<button
						onclick={handleSubmit}
						disabled={!content.trim() || isSubmitting}
						class="hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
						aria-label={$_('comments.send')}
					>
						{#if isSubmitting}
							<Loader2 class="size-4 animate-spin" />
						{:else}
							<SendIcon color="white" />
						{/if}
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Buttons without avatar -->
		<div class="flex flex-col justify-end">
			<div class="flex gap-2">
				{#if isEditMode}
					<!-- Save button -->
					<button
						onclick={handleSubmit}
						disabled={!content.trim() || isSubmitting}
						class="hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
						aria-label={$_('comments.save')}
					>
						{#if isSubmitting}
							<Loader2 class="size-5 animate-spin" />
						{:else}
							<CheckIcon color="white" size={20} />
						{/if}
					</button>
					<!-- Cancel button -->
					<button
						onclick={handleCancel}
						disabled={isSubmitting}
						class="hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
						aria-label={$_('comments.cancel')}
					>
						<XIcon color="white" size={20} />
					</button>
				{:else}
					<!-- Send button -->
					<button
						onclick={handleSubmit}
						disabled={!content.trim() || isSubmitting}
						class="hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
						aria-label={$_('comments.send')}
					>
						{#if isSubmitting}
							<Loader2 class="size-4 animate-spin" />
						{:else}
							<SendIcon color="white" />
						{/if}
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="mt-2 text-sm text-red-500">
			{error}
		</div>
	{/if}
</div>