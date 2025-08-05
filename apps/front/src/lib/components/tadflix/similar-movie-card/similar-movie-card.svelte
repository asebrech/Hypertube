<script lang="ts">
	import type { MovieDetails, Movie } from '@hypertube/shared';
	import { movieModalActions } from '@/services/store';
	import { MovieBadges } from '../movie-badges';

	interface Props {
		movie: MovieDetails | Movie;
		posterUrl?: string;
	}

	let { movie, posterUrl }: Props = $props();

	function openMovie() {
		// Navigate to the new movie (this will add current movie to history)
		movieModalActions.navigateTo(movie.id, 'movie');

		// Scroll to top of modal content
		setTimeout(() => {
			const modalContent = document.querySelector('[data-dialog-content]');
			if (modalContent) {
				modalContent.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}, 50);
	}
</script>

<div
	class="w-full cursor-pointer overflow-hidden rounded-lg bg-neutral-800 text-left shadow-lg transition-transform duration-300 hover:scale-105"
	onclick={openMovie}
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openMovie();
		}
	}}
	aria-label={`View details for ${movie.title || movie.name}`}
>
	<!-- Movie Image -->
	<div class="relative aspect-[2/3] bg-neutral-700">
		{#if posterUrl}
			<img src={posterUrl} alt={movie.title || movie.name} class="h-full w-full object-cover" />
		{/if}
	</div>

	<!-- Movie Info -->
	<div class="space-y-2 p-3">
		<!-- Title -->
		<h3 class="truncate text-sm font-bold text-white">
			{movie.title || movie.name}
		</h3>

		<!-- Metadata Row -->
		<div class="flex items-center gap-2 text-xs text-gray-300">
			<!-- Year -->
			<span>
				{movie.release_date?.slice(0, 4) ||
					('first_air_date' in movie ? movie.first_air_date?.slice(0, 4) : null) ||
					'2021'}
			</span>

			<!-- Quality and Language Badges -->
			<MovieBadges {movie} />

			<!-- Add Button -->
			<button
				aria-label="Add to watchlist"
				class="ml-auto flex h-6 w-6 items-center justify-center rounded-full border border-gray-500 text-gray-400 transition-colors hover:border-white hover:text-white"
				onclick={(e) => {
					e.stopPropagation();
					// Add to watchlist logic here
				}}
			>
				<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
			</button>
		</div>

		<!-- Description -->
		<p class="line-clamp-2 text-xs leading-relaxed text-gray-400">
			{movie.overview || 'No description available.'}
		</p>
	</div>
</div>
