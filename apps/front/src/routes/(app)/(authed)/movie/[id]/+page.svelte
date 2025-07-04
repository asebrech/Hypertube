<script lang="ts">
	import CommentContainer from '@/components/tadflix/comments/CommentContainer.svelte';
	import CommentInput from '@/components/tadflix/comments/CommentInput.svelte';
	import CommentItem from '@/components/tadflix/comments/CommentItem.svelte';
	import MovieBanner from '@/components/tadflix/movie-banner/MovieBanner.svelte';
	import type { MovieDetails, PaginationType } from '@hypertube/shared';

	interface MoviePageProps {
		data: {
			movie: MovieDetails;
			comments: PaginationType<Comment>;
		};
	}
	let { data }: MoviePageProps = $props();
</script>

<div class="flex flex-col overflow-y-scroll">
	<MovieBanner movie={data.movie} />
	<div class="flex w-full flex-col p-6 md:p-12">
		<CommentContainer title={data.movie.title} comments={data.comments.data}></CommentContainer>
	</div>
</div>
