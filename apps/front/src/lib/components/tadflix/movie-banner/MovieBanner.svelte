<script lang="ts">
	import { Button } from '@/components/ui/button';
	import type { BackDropImage, MovieDetails } from '@hypertube/shared';

	interface Props {
		movie: MovieDetails;
		logo?: BackDropImage;
	}

	let expanded = $state(false);
	let contentEl: HTMLParagraphElement;
	let isClamped = $state(false);

	$effect(() => {
		if (contentEl) {
			const { scrollHeight, clientHeight } = contentEl;
			isClamped = scrollHeight > clientHeight;
		}
	});

	let { movie, logo }: Props = $props();
</script>

<div class="relative max-h-[80vh] w-full">
	<img
		src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path}`}
		alt="movie-background"
		class="h-full w-full object-cover"
	/>
	<div class="absolute top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform pl-12">
		<div class="flex w-full flex-col gap-5 text-white">
			{#if logo}
				<img src={logo.url} alt="movie-background" class="max-w-[40%] object-cover" />
			{:else}
				<span
					class="text-center text-7xl leading-14 font-extrabold text-wrap uppercase md:max-w-44"
				>
					{movie.title}
				</span>
			{/if}

			<div class="hidden md:block md:max-w-[40%]">
				<p bind:this={contentEl} class={`${expanded ? '' : 'line-clamp-3'}`}>
					{movie.overview}
				</p>
			</div>
			{#if isClamped}
				<button
					onclick={() => (expanded = !expanded)}
					class="hidden self-start text-xs text-blue-600 hover:underline md:block"
				>
					{expanded ? 'See less' : 'See more'}
				</button>
			{/if}
			<div class="relative flex w-full justify-between gap-2">
				<div class="flex gap-2">
					<Button class="bg-white">PLAY</Button>
					<Button class="bg-[#6D6D6EB3]">MORE INFO</Button>
				</div>
				{#if movie.vote_average}
					<div class="flex items-center gap-5">
						<div>RE</div>
						<div class="flex h-full items-center border-l-4 bg-purple-300 pr-8 pl-3 text-nowrap">
							TV-{movie.revenue}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
