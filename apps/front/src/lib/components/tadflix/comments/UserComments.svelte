<script lang="ts">
	import CommentItem from './CommentItem.svelte';
	import { getUserComments, deleteComment } from '$lib/services/api';
	import type { Comment, PaginatedComments } from '@hypertube/shared';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { Loader2, ExternalLink, MessageSquare } from 'lucide-svelte';

	interface UserCommentsProps {
		profileUserId: number;
		profileUsername: string;
		isOwnProfile?: boolean;
		compact?: boolean;
		maxHeight?: string;
		showMovieContext?: boolean;
		showHeader?: boolean;
	}

	const { 
		profileUserId, 
		profileUsername, 
		isOwnProfile = false,
		compact = false,
		maxHeight = 'none',
		showMovieContext = true,
		showHeader = true
	}: UserCommentsProps = $props();

	const user = $derived($page.data.user);
	const token = $derived($page.data.token);
	const currentUser = $derived(user?.username || user?.name || 'User');
	const currentUserId = $derived(user?.id);

	let comments = $state<Comment[]>([]);
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
			const response: PaginatedComments = await getUserComments(profileUserId, page, 6, token);

			if (append) {
				const existingIds = new Set(comments.map((c) => c.id));
				const newComments = response.data.filter((comment) => !existingIds.has(comment.id));
				comments = [...comments, ...newComments];
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
			loadComments(currentPage + 1, false);
		}
	};

	const handleUpdateComment = (updatedComment: Comment) => {
		// Update the comment in the local state
		comments = comments.map((comment) =>
			comment.id === updatedComment.id ? updatedComment : comment
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
			comments = comments.filter((comment) => comment.id !== commentToDelete);
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
		if (token) {
			loadComments();
		}
	});
</script>

	<div class="flex w-full flex-col gap-4" style="max-height: {maxHeight}; overflow-y: {maxHeight !== 'none' ? 'auto' : 'visible'};">
	<!-- Header -->
	{#if showHeader}
		<div class="flex items-center gap-3 {compact ? 'mb-2' : 'mb-4'}">
			<MessageSquare size={compact ? 20 : 24} class="text-red-500" />
			<div class="flex flex-col">
				<h2 class="font-poppins {compact ? 'text-lg' : 'text-xl'} font-medium tracking-wide text-white">
					{isOwnProfile ? $_('comments.your-comments') : $_('comments.user-comments', { values: { user: profileUsername } })}
				</h2>
				{#if comments.length > 0}
					<span class="text-sm text-gray-400">
						{comments.length} {comments.length === 1 ? $_('comments.comment') : $_('comments.comments')}
					</span>
				{/if}
			</div>
		</div>
	{/if}	<!-- Comments Section -->
	{#if !token}
		<div class="py-8 text-center">
			<a
				href="/login"
				class="inline-flex items-baseline justify-center gap-2 text-white underline transition-colors hover:text-red-400"
			>
				{$_('comments.login-required')}
				<ExternalLink class="size-4 flex-shrink-0 self-center" />
			</a>
		</div>
	{:else if isLoading && comments.length === 0}
		<div class="flex items-center justify-center gap-2 py-8 text-center text-white">
			<Loader2 class="size-5 animate-spin" />
			{$_('comments.loading')}
		</div>
	{:else if error && comments.length === 0}
		<div class="py-8 text-center text-red-500">{error}</div>
	{:else if comments.length > 0}
		<div class="flex flex-col gap-{compact ? '3' : '4'}">
			{#each comments as comment (comment.id)}
				<div class="group rounded-lg bg-gray-900/20 hover:bg-gray-900/40 {compact ? 'p-4' : 'p-6'} border border-gray-800/30 hover:border-gray-700/40 transition-all duration-200">
					<!-- Movie Context -->
					{#if showMovieContext && comment.movieTitle && comment.movieId}
						<div class="mb-3 flex items-center gap-2 text-xs">
							<span class="text-gray-500">{$_('comments.commented-on')}</span>
							<button 
								class="text-white hover:text-red-400 transition-colors underline underline-offset-2 font-medium"
								onclick={() => {
									// Navigate to movie page
									window.location.href = `/movie/${comment.movieId}`;
								}}
							>
								{comment.movieTitle}
							</button>
						</div>
					{/if}
					
					<!-- Comment Content -->
					<div class="pl-0">
						<CommentItem
							{comment}
							{currentUserId}
							{token}
							data={$page.data}
							onDelete={handleDeleteComment}
							onUpdate={handleUpdateComment}
						/>
					</div>
				</div>
			{/each}

			<!-- Pagination Controls -->
			{#if hasMore || currentPage > 1}
				<div class="flex items-center justify-center gap-3 {compact ? 'mt-4 pt-3' : 'mt-8 pt-6'} border-t border-gray-800/50">
					<!-- Previous Page Button -->
					<button
						onclick={() => {
							if (currentPage > 1) {
								loadComments(currentPage - 1);
							}
						}}
						disabled={currentPage <= 1 || isLoading}
						class="flex items-center gap-2 rounded-md bg-gray-800/60 hover:bg-gray-700/60 {compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800/60"
					>
						← {$_('comments.previous')}
					</button>

					<!-- Page Info -->
					<div class="flex items-center gap-2 px-2">
						<span class="text-gray-400 {compact ? 'text-xs' : 'text-sm'}">{$_('comments.page')}</span>
						<span class="text-white font-semibold {compact ? 'text-xs' : 'text-sm'}">{currentPage}</span>
					</div>

					<!-- Next Page Button -->
					<button
						onclick={loadMoreComments}
						disabled={!hasMore || isLoading}
						class="flex items-center gap-2 rounded-md bg-red-600/80 hover:bg-red-700/80 {compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600/80"
					>
						{#if isLoading}
							<Loader2 class="size-4 animate-spin" />
						{:else}
							{$_('comments.next')} →
						{/if}
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="py-8 text-center text-white">
			{isOwnProfile ? $_('comments.no-comments-own') : $_('comments.no-comments-user', { values: { user: profileUsername } })}
		</div>
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
					class="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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