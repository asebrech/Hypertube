<script lang="ts">
	import { Dialog, DialogContent } from '@/components/ui/dialog';
	import { movieModal } from '@/services/store';
	import { getMovieDetails, getMovieVideos, getLogoImage, getSimilarMovies, getPosterImage } from '@/services/api';
	import type { BackDropImage, MovieDetails, MovieVideo, MovieType, Movie } from '@hypertube/shared';
	import { X, Plus, ThumbsUp } from 'lucide-svelte';
	import { SimilarMovieCard } from '../similar-movie-card';
	import MovieBanner from '../movie-banner/MovieBanner.svelte';
	import ButtonPreview from '../buttons/button-preview/button-preview.svelte';
	import { _ } from 'svelte-i18n';

	// Store subscription
	let modalData = $state({
		isOpen: false,
		movieId: undefined as number | undefined,
		type: undefined as MovieType | undefined
	});

	// Movie data
	let movie: MovieDetails | undefined = $state(undefined);
	let movieVideo: MovieVideo | undefined = $state(undefined);
	let movieLogo: BackDropImage | undefined = $state(undefined);
	let similarMovies: Movie[] = $state([]);

	// Subscribe to modal store
	$effect(() => {
		const unsubscribe = movieModal.subscribe((value) => {
			modalData = {
				isOpen: value.isOpen,
				movieId: value.movieId,
				type: value.type
			};
		});
		return unsubscribe;
	});

	// Load movie data when modal opens
	$effect(() => {
		if (modalData.movieId && modalData.type) {
			getMovieDetails(modalData.movieId, modalData.type)
				.then((data) => {
					movie = data;
				})
				.catch((error) => {
					console.error('Error fetching movie details:', error);
				});

			getMovieVideos(modalData.movieId, modalData.type)
				.then((data) => {
					movieVideo = data;
				})
				.catch((error) => {
					console.error('Error fetching movie video:', error);
				});

			getLogoImage(modalData.movieId, 'original', modalData.type)
				.then((data) => {
					movieLogo = data;
				})
				.catch((error) => {
					console.error('Error fetching movie logo:', error);
				});

			getSimilarMovies(modalData.movieId, 1, modalData.type)
				.then((data) => {
					similarMovies = data.movies;
				})
				.catch((error) => {
					console.error('Error fetching similar movies:', error);
				});
		}
	});

	function closeModal() {
		movieModal.set({
			isOpen: false,
			movieId: undefined,
			type: undefined
		});
	}
</script>

<Dialog open={modalData.isOpen} onOpenChange={(open) => !open && closeModal()}>
	<DialogContent
		class="h-full max-h-none w-full max-w-none gap-0 overflow-y-auto border-none bg-[#181818] p-0 md:max-h-[95vh] md:max-w-[850px] md:rounded-lg"
		showCloseButton={false}
		data-dialog-content
	>
		{#if movie}
			<!-- Close Button positioned over the banner -->
			<div class="relative">
				<div class="absolute top-2 right-2 z-50 md:top-4 md:right-4">
					<button
						onclick={closeModal}
						class="flex h-8 w-8 items-center justify-center rounded-full border-none bg-[#2A2A2A] opacity-75 transition-opacity hover:opacity-100 md:h-9 md:w-9"
					>
						<X size={20} class="text-white md:size-[22px]" />
					</button>
				</div>

				<!-- MovieBanner Component -->
				{#key movie.id}
					<MovieBanner
						{movie}
						logo={movieLogo}
						{movieVideo}
						showDescription={false}
						showMoreInfoButton={false}
						showVoteAverage={false}
						class="max-h-[50vh] md:max-h-[60vh] [&>div:first-child]:rounded-none"
					>
						{#snippet customActions()}
							<!-- Add Button -->
							<ButtonPreview variant="outline">
								<Plus size={16} />
							</ButtonPreview>

							<!-- Like Button -->
							<ButtonPreview variant="outline">
								<ThumbsUp size={16} />
							</ButtonPreview>
						{/snippet}
					</MovieBanner>
				{/key}
			</div>

			<!-- Movie Info Section -->
			<div class="p-4 md:p-8 lg:p-12">
				<div class="flex flex-col gap-8 lg:flex-row lg:gap-16">
					<!-- Left Column - Main Info -->
					<div class="flex-1">
						<!-- Movie Details -->
						<div class="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#BCBCBC] md:text-sm">
							{#if movie.vote_average}
								<span class="font-medium text-[#46D369]">New</span>
							{/if}
							{#if movie.runtime}
								<span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
							{/if}
							{#if movie.release_date}
								<span>{new Date(movie.release_date).getFullYear()}</span>
							{/if}
							<div class="border border-[#808080] px-1.5 py-0.5 text-xs">
								<span class="text-[#E5E5E5]">HD</span>
							</div>
						</div>

						<!-- Description -->
						{#if movie.overview}
							<p class="mb-4 text-sm leading-relaxed text-white md:text-base">
								{movie.overview}
							</p>
						{/if}
					</div>

					<!-- Right Column - Cast & Genres -->
					<div class="w-full shrink-0 lg:w-60">
						{#if movie.genres && movie.genres.length > 0}
							<div class="mb-3">
								<span class="text-sm text-[#777777]">Genres: </span>
								<span class="text-sm text-white">
									{movie.genres.map((g: any) => g.name).join(', ')}
								</span>
							</div>
						{/if}

						<!-- Additional info could go here -->
						<div class="text-sm text-[#777777]">This show is: Dark, Suspenseful, Exciting</div>
					</div>
				</div>

				<!-- Similar Movies Section -->
				{#if similarMovies.length > 0}
					<div class="mt-12">
						<div class="flex items-center gap-4 mb-6">
							<h3 class="text-xl font-bold text-white">More Like This</h3>
							<div class="flex-1 h-px bg-gray-700"></div>
						</div>
						<div class="grid gap-4 grid-cols-3">
							{#each similarMovies as similarMovie}
								<SimilarMovieCard 
									movie={similarMovie} 
									posterUrl={similarMovie.poster_path ? `https://image.tmdb.org/t/p/w500${similarMovie.poster_path}` : undefined}
								/>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</DialogContent>
</Dialog>
