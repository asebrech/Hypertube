<script lang="ts">
	import type { Comment } from '@hypertube/shared';
	import type { Snippet } from 'svelte';
	import CommentItem from './CommentItem.svelte';

	interface CommentContainerProps {
		title: string;
		comments: Comment[];
	}

	let { title, comments }: CommentContainerProps = $props();
</script>

<div class="flex w-full flex-col">
	<div class="flex justify-between">
		<span>Commentary</span>
		<span>{title}</span>
	</div>
	{#if comments.length > 0}
		<div class="flex flex-col gap-4 md:gap-6">
			{#each comments as comment}
				<CommentItem {comment}></CommentItem>
			{/each}
		</div>
	{:else}
		<span>No comment found</span>
	{/if}
</div>
