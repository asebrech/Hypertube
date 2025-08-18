<script lang="ts">
	import CommentItem from './CommentItem.svelte';
	import CommentInput from './CommentInput.svelte';
	import { getMovieComments } from '$lib/services/api';
	import type { Comment, PaginatedComments } from '@hypertube/shared';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

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

	let comments = $state<Comment[]>(initialComments);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let hasMore = $state(true);
	let currentPage = $state(1);

	const loadComments = async (page: number = 1, append: boolean = false) => {
		if (isLoading) return;

		isLoading = true;
		error = null;

		try {
			const response: PaginatedComments = await getMovieComments(movieId, page, 20, token);

			if (append) {
				comments = [...comments, ...response.data];
			} else {
				comments = response.data;
			}

			hasMore = response.meta.current_page < response.meta.last_page;
			currentPage = response.meta.current_page;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load comments';
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
		// TODO: Implement edit functionality
		console.log('Edit comment:', commentId);
	};

	const handleDeleteComment = (commentId: number) => {
		// TODO: Implement delete functionality
		console.log('Delete comment:', commentId);
	};

	onMount(() => {
		loadComments();
	});
</script>

<div class="flex w-full flex-col gap-7">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h2 class="font-poppins text-2xl leading-[1.5] font-medium tracking-wide text-white">
			Commentary
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
				<div class="py-8 text-center text-white">Loading comments...</div>
			{:else if error && comments.length === 0}
				<div class="py-8 text-center text-red-500">{error}</div>
			{:else if comments.length > 0}
				<div class="flex flex-col gap-4">
					{#each comments as comment (comment.id)}
						<CommentItem
							{comment}
							{currentUser}
							onEdit={handleEditComment}
							onDelete={handleDeleteComment}
						/>
					{/each}

					<!-- Load More Button -->
					{#if hasMore}
						<button
							onclick={loadMoreComments}
							disabled={isLoading}
							class="mt-4 self-center rounded border border-[rgba(255,255,255,0.5)] bg-[#2A2A2A] px-6 py-2 text-white hover:bg-[#3A3A3A]"
							class:opacity-50={isLoading}
							class:cursor-not-allowed={isLoading}
						>
							{isLoading ? 'Loading...' : 'Load More Comments'}
						</button>
					{/if}
				</div>
			{:else}
				<div class="py-8 text-center text-white">No comments found</div>
			{/if}
			<!-- Comment Input -->
			<CommentInput {movieId} username={currentUser} {token} onCommentAdded={handleCommentAdded} />
		</div>
	{:else}
		<div class="py-8 text-center text-white">Please log in to view and post comments</div>
	{/if}
</div>
