<script lang="ts">
	import type {
		MovieDetails,
		Movie,
		BackDropImage,
		ImageSizeType,
		MovieType
	} from '@hypertube/shared';
	import { movieModalActions } from '@/services/store';
	import { MovieBadges } from '../movie-badges';
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getBackdropImage } from '@/services/api';

	interface Props {
		movie: MovieDetails | Movie;
		data: { token: string };
	}

	let { movie, data }: Props = $props();

	let backdropImage: BackDropImage | null = $state(null);
	let isLoading = $state(true);
	let currentMovieId = $state<number | null>(null);
	let abortController = $state<AbortController | null>(null);

	// Determine movie type - check if it has 'media_type' or infer from other properties
	const movieType: MovieType = 'media_type' in movie ? movie.media_type || 'movie' : 'movie';

	const loadBackdropImage = async (
		movieId: number,
		size: ImageSizeType
	): Promise<BackDropImage> => {
		// Cancel any previous request
		if (abortController) {
			abortController.abort();
		}

		abortController = new AbortController();

		const backdrop_image_data = await getBackdropImage(movieId, size, movieType, data.token);
		backdropImage = backdrop_image_data;
		return backdrop_image_data;
	};

	// Load backdrop image only when movie ID actually changes
	$effect(() => {
		// Only load if movie ID has changed
		if (currentMovieId !== movie.id) {
			currentMovieId = movie.id;
			isLoading = true;

			loadBackdropImage(movie.id, 'small')
				.catch((error) => {
					// Don't log aborted requests
					if (error.name !== 'AbortError') {
						backdropImage = {
							aspect_ratio: 0,
							height: 0,
							width: 0,
							iso_639_1: '',
							file_path: '',
							vote_average: 0,
							vote_count: 0,
							url: '/img/default-backdrop2.png',
							langFound: false
						};
					}
				})
				.finally(() => {
					isLoading = false;
				});
		}

		// Cleanup function
		return () => {
			if (abortController) {
				abortController.abort();
			}
		};
	});

	function openMovie() {
		// Navigate to the new movie (this will add current movie to history)
		movieModalActions.navigateTo(movie.id, movieType);

		// Scroll to top of modal content
		setTimeout(() => {
			const scrollContainer = document.querySelector('[data-dialog-content] > div > div > div');
			if (scrollContainer) {
				scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}, 50);
	}
</script>

<div
	class="w-full cursor-pointer overflow-hidden rounded-lg bg-neutral-800 text-left shadow-lg transition-transform duration-300 hover:scale-105"
	onclick={openMovie}
	role="button"
	tabindex={0}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openMovie();
		}
	}}
	aria-label={`View details for ${movie.title || movie.name}`}
>
	<!-- Movie Image -->
	<div class="relative aspect-[5/3] bg-neutral-700">
		{#if isLoading}
			<Skeleton class="h-full w-full rounded-t-lg rounded-b-none" />
		{:else if backdropImage?.url}
			<img src={backdropImage.url} alt={''} class="h-full w-full object-cover" />
		{/if}
	</div>

	<!-- Movie Info BELOW the image -->
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
			<div class="hidden flex-1 sm:block">
				<MovieBadges {movie} />
			</div>

			<!-- Add Button -->
			<button
				aria-label="Add to watchlist"
				class="flex h-6 w-6 items-center justify-center rounded-full border border-gray-500 text-gray-400 transition-colors hover:border-white hover:text-white"
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
		<p class="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-gray-400">
			{movie.overview || ''}
		</p>
	</div>
</div>
