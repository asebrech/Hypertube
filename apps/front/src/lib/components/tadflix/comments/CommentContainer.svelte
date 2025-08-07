<script lang="ts">
	import CommentItem from './CommentItem.svelte';
	import CommentInput from './CommentInput.svelte';
	import { getMovieComments } from '$lib/services/api';
	import type { Comment, PaginatedComments } from '@hypertube/shared';

	interface CommentContainerProps {
		movieId: number;
		movieTitle: string;
		currentUser: string;
		token: string;
		initialComments?: Comment[];
	}

	const { movieId, movieTitle, currentUser, token, initialComments = [] }: CommentContainerProps = $props();

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

	// Load initial comments if none provided
	$effect(() => {
		if (initialComments.length === 0) {
			loadComments();
		}
	});
</script>

<div class="w-full flex flex-col gap-7">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div class="flex items-center gap-32">
			<h2 class="text-white text-2xl font-medium leading-[1.5] tracking-wide font-poppins">
				Commentary
			</h2>
			<span class="text-white text-lg leading-[1.22] font-montserrat">
				{movieTitle}
			</span>
		</div>
	</div>

	<!-- Comments Section -->
	<div class="flex flex-col gap-4">
		<!-- Comment Input -->
		<CommentInput 
			{movieId} 
			{currentUser} 
			{token} 
			onCommentAdded={handleCommentAdded} 
		/>

		<!-- Comments List -->
		{#if isLoading && comments.length === 0}
			<div class="text-white text-center py-8">Loading comments...</div>
		{:else if error && comments.length === 0}
			<div class="text-red-500 text-center py-8">{error}</div>
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
						class="text-white bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-[rgba(255,255,255,0.5)] rounded px-6 py-2 self-center mt-4"
						class:opacity-50={isLoading}
						class:cursor-not-allowed={isLoading}
					>
						{isLoading ? 'Loading...' : 'Load More Comments'}
					</button>
				{/if}
			</div>
		{:else}
			<div class="text-white text-center py-8">No comments found</div>
		{/if}
	</div>
</div>

<style>
	.font-poppins {
		font-family: Poppins, sans-serif;
	}
	
	.font-montserrat {
		font-family: Montserrat, sans-serif;
	}
</style>
