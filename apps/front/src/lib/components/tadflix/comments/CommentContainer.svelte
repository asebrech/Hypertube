<script lang="ts">
	import CommentItem from './CommentItem.svelte';
	import CommentInput from './CommentInput.svelte';
	import { getMovieComments, deleteComment } from '$lib/services/api';
	import type { Comment, PaginatedComments } from '@hypertube/shared';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { Loader2 } from 'lucide-svelte';

	interface CommentContainerProps {
		movieId: number;
		movieTitle: string;
		initialComments?: Comment[];
	}

	const { movieId, movieTitle, initialComments = [] }: CommentContainerProps = $props();

	// Access user and token from page data
	const user = $derived($page.data.user);
	const token = $derived($page.data.token);
	const currentUser = $derived(user?.username || user?.name || 'User');
	const currentUserId = $derived(user?.id);

	let comments = $state<Comment[]>(initialComments);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let hasMore = $state(true);
	let currentPage = $state(1);
	let showDeleteModal = $state(false);
	let commentToDelete = $state<number | null>(null);
	let isDeletingComment = $state(false);

	const loadComments = async (page: number = 1, append: boolean = false) => {
		if (isLoading) return;

		isLoading = true;
		error = null;

		try {
			const response: PaginatedComments = await getMovieComments(movieId, page, 5, token);

			if (append) {
				comments = [...comments, ...response.data];
			} else {
				comments = response.data;
			}

			currentPage = Number(response.meta?.currentPage) || page;
			const lastPage = Number(response.meta?.lastPage) || 1;
			hasMore = currentPage < lastPage;
		} catch (err) {
			error = err instanceof Error ? err.message : $_('comments.failed-to-load');
		} finally {
			isLoading = false;
		}
	};

	const loadMoreComments = () => {
		if (hasMore && !isLoading) {
			loadComments(currentPage + 1, true);
		}
	};

	const handleCommentAdded = (newComment: Comment) => {
		comments = [newComment, ...comments];
	};

	const handleEditComment = (commentId: number) => {
		// Edit functionality is handled directly in CommentItem
		console.log('Edit comment:', commentId);
	};

	const handleUpdateComment = (updatedComment: Comment) => {
		// Update the comment in the local state
		comments = comments.map(comment => 
			comment.id === updatedComment.id 
				? updatedComment
				: comment
		);
	};

	const handleDeleteComment = async (commentId: number) => {
		if (!token) {
			error = $_('comments.auth-required');
			return;
		}

		// Show confirmation modal
		commentToDelete = commentId;
		showDeleteModal = true;
	};

	const confirmDelete = async () => {
		if (!commentToDelete || !token) return;

		isDeletingComment = true;
		try {
			await deleteComment(commentToDelete, token);
			// Remove the deleted comment from the local state
			comments = comments.filter(comment => comment.id !== commentToDelete);
			showDeleteModal = false;
			commentToDelete = null;
		} catch (err) {
			error = err instanceof Error ? err.message : $_('comments.failed-to-delete');
		} finally {
			isDeletingComment = false;
		}
	};

	const cancelDelete = () => {
		showDeleteModal = false;
		commentToDelete = null;
	};

	const handleBackdropClick = (event: MouseEvent) => {
		// Only close if clicking the backdrop itself, not the modal content
		if (event.target === event.currentTarget) {
			cancelDelete();
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			cancelDelete();
		}
	};

	onMount(() => {
		loadComments();
	});
</script>

<div class="flex w-full flex-col gap-7">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h2 class="font-poppins text-2xl leading-[1.5] font-medium tracking-wide text-white">
			{$_('comments.title')}
		</h2>
		<span class="font-montserrat text-lg leading-[1.22] text-white">
			{movieTitle}
		</span>
	</div>

	<!-- Comments Section -->
	{#if user && token}
		<div class="flex flex-col gap-4">
			<!-- Comments List -->
			{#if isLoading && comments.length === 0}
				<div class="py-8 text-center text-white flex items-center justify-center gap-2">
					<Loader2 class="size-5 animate-spin" />
					{$_('comments.loading')}
				</div>
			{:else if error && comments.length === 0}
				<div class="py-8 text-center text-red-500">{error}</div>
			{:else if comments.length > 0}
				<div class="flex flex-col gap-4">
					{#each comments as comment (comment.id)}
						<CommentItem
							{comment}
							{currentUser}
							{currentUserId}
							{token}
							onEdit={handleEditComment}
							onDelete={handleDeleteComment}
							onUpdate={handleUpdateComment}
						/>
					{/each}

					<!-- Load More Button -->
					{#if hasMore}
						<button
							onclick={loadMoreComments}
							disabled={isLoading}
							class="mt-4 self-center rounded border border-[rgba(255,255,255,0.5)] bg-[#2A2A2A] px-6 py-2 text-white hover:bg-[#3A3A3A] flex items-center gap-2"
							class:opacity-50={isLoading}
							class:cursor-not-allowed={isLoading}
						>
							{#if isLoading}
								<Loader2 class="size-4 animate-spin" />
							{/if}
							{isLoading ? $_('comments.loading') : $_('comments.load-more')}
						</button>
					{/if}
				</div>
			{:else}
				<div class="py-8 text-center text-white">{$_('comments.no-comments')}</div>
			{/if}
			<!-- Comment Input -->
			<CommentInput {movieId} username={currentUser} {token} onCommentAdded={handleCommentAdded} />
		</div>
	{:else}
		<div class="py-8 text-center text-white">{$_('comments.login-required')}</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<!-- Modal Backdrop -->
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<div class="mx-4 w-full max-w-md rounded-lg bg-[#1a1a1a] p-6 shadow-xl">
			<!-- Modal Header -->
			<h3 class="mb-4 text-xl font-semibold text-white">{$_('comments.delete-title')}</h3>
			
			<!-- Modal Body -->
			<p class="mb-6 text-gray-300">
				{$_('comments.delete-message')}
			</p>
			
			<!-- Modal Actions -->
			<div class="flex justify-end gap-3">
				<button
					onclick={cancelDelete}
					disabled={isDeletingComment}
					class="rounded border border-gray-600 bg-transparent px-4 py-2 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{$_('comments.cancel')}
				</button>
				<button
					onclick={confirmDelete}
					disabled={isDeletingComment}
					class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
				>
					{#if isDeletingComment}
						<Loader2 class="size-4 animate-spin" />
					{/if}
					{isDeletingComment ? $_('comments.deleting') : $_('comments.delete')}
				</button>
			</div>
		</div>
	</div>
{/if}