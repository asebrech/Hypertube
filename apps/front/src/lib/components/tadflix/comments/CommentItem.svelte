<script lang="ts">
	import type { Comment } from "@hypertube/shared";

	interface CommentItemProps {
		comment: Comment
	}

	const { comment }: CommentItemProps = $props();
	let expanded = $state(false);
	let contentEl: HTMLParagraphElement;
	let isClamped = $state(false);

	$effect(() => {
		if (contentEl) {
			const { scrollHeight, clientHeight } = contentEl;
			isClamped = scrollHeight > clientHeight;
		}
	});
</script>

<div class="flex w-full gap-3 md:gap-6">
	<img
		class="h-6 w-6 rounded-full object-cover md:h-12 md:w-12"
		src={comment.userImageUrl}
		alt={'comment-user-img'}
	/>
	<div class="flex flex-col">
		<p
			bind:this={contentEl}
			class={`text-sm transition-all duration-300 md:text-base ${expanded ? '' : 'line-clamp-3'}`}
		>
			{comment.content}
		</p>
		{#if isClamped}
			<button
				onclick={() => (expanded = !expanded)}
				class="mt-1 self-start text-xs text-blue-600 hover:underline"
			>
				{expanded ? 'See less' : 'See more'}
			</button>
		{/if}
	</div>
</div>
