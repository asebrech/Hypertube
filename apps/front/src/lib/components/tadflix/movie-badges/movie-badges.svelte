<script lang="ts">
	import type { Movie, MovieDetails } from '@hypertube/shared';
	import { Star } from 'lucide-svelte';

	interface Props {
		movie: Movie | MovieDetails;
		showLanguage?: boolean;
		showQuality?: boolean;
	}

	let { movie, showLanguage = true, showQuality = true }: Props = $props();
</script>

<div class="flex flex-wrap items-center gap-2">
	<!-- Language Badge -->
	{#if showLanguage && 'original_language' in movie && movie.original_language}
		<div
			class="flex items-center justify-center border border-[#808080] px-1.5 py-0.5 text-xs uppercase"
		>
			<span class="text-[#E5E5E5]">{movie.original_language}</span>
		</div>
	{/if}

	<!-- Quality Badge - Dynamic based on video availability and rating -->
	{#if showQuality}
		{#if 'video' in movie && movie.video}
			<div class="flex items-center justify-center border border-[#808080] px-1.5 py-0.5 text-xs">
				<span class="text-[#E5E5E5]">HD</span>
			</div>
		{:else if movie.vote_average && movie.vote_average >= 7.5}
			<div class="flex items-center justify-center border border-green-500 px-1.5 py-0.5 text-xs">
				<span class="flex items-center gap-1 text-green-400">
					<Star size={12} fill="currentColor" />
					{movie.vote_average.toFixed(1)}
				</span>
			</div>
		{:else if movie.vote_average && movie.vote_average >= 6}
			<div class="flex items-center justify-center border border-yellow-500 px-1.5 py-0.5 text-xs">
				<span class="flex items-center gap-1 text-yellow-400">
					<Star size={12} fill="currentColor" />
					{movie.vote_average.toFixed(1)}
				</span>
			</div>
		{:else if movie.vote_average && movie.vote_average > 0}
			<div class="flex items-center justify-center border border-red-500 px-1.5 py-0.5 text-xs">
				<span class="flex items-center gap-1 text-red-400">
					<Star size={12} fill="currentColor" />
					{movie.vote_average.toFixed(1)}
				</span>
			</div>
		{/if}
	{/if}
</div>
