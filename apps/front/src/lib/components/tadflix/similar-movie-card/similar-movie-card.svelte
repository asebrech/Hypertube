<script lang="ts">
	import type { MovieDetails, Movie } from '@hypertube/shared';
	import { movieModalActions } from '@/services/store';

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
	class="w-full bg-neutral-800 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300 text-left"
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
			<img 
				src={posterUrl} 
				alt={movie.title || movie.name}
				class="w-full h-full object-cover"
			/>
		{/if}
	</div>

	<!-- Movie Info -->
	<div class="p-3 space-y-2">
		<!-- Title -->
		<h3 class="text-white text-sm font-bold truncate">
			{movie.title || movie.name}
		</h3>
		
		<!-- Metadata Row -->
		<div class="flex items-center gap-2 text-xs text-gray-300">
			<!-- Year -->
			<span>
				{movie.release_date?.slice(0, 4) || ('first_air_date' in movie ? movie.first_air_date?.slice(0, 4) : null) || '2021'}
			</span>
			
			<!-- Rating Badge -->
			<div class="border border-gray-500 px-1.5 py-0.5 text-xs">
				HD
			</div>
			
			<!-- Add Button -->
			<button 
				aria-label="Add to watchlist"
				class="ml-auto w-6 h-6 rounded-full border border-gray-500 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center justify-center"
				onclick={(e) => {
					e.stopPropagation();
					// Add to watchlist logic here
				}}
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
				</svg>
			</button>
		</div>

		<!-- Description -->
		<p class="text-gray-400 text-xs leading-relaxed line-clamp-2">
			{movie.overview || 'No description available.'}
		</p>
	</div>
</div>
