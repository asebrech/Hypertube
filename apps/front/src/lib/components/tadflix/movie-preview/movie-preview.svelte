<script lang="ts">
	import { Badge } from '@/components/ui/badge';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getMovieDetails } from '@/services/api';
	import type { MovieDetails } from '@hypertube/shared';
	import { onMount } from 'svelte';

	export let movieId: number;
	let isLoading = true;
	let movie: MovieDetails;

	const loadMovieDetails = async (movieId: number): Promise<MovieDetails> => {
		const movieDetailsResponse = await getMovieDetails(movieId);
		movie = movieDetailsResponse;
		return movieDetailsResponse;
	};

	onMount(() => {
		if (movieId) {
			isLoading = true;
			loadMovieDetails(movieId).catch((error) => {
				console.error('Error loading movie details:', error);
			});
			isLoading = false;
		}
	});
</script>

<a href="/movie/{movieId}" target="_blank" rel="noreferrer noopener" class="block min-h-[380px]">
	<div class="flex flex-col items-center">
		{#if movie?.backdrop_path}
			<img
				src={`https://image.tmdb.org/t/p/w500${movie?.backdrop_path}`}
				alt={movie?.title}
				class="aspect-[5/3] w-[300px] rounded-[2px] object-cover"
			/>
		{:else}
			<div class="flex aspect-[5/3] w-[300px] items-center justify-center">
				<Skeleton class="h-full w-full rounded-[2px]" />
			</div>
		{/if}
		<div class="m-2 p-4">
			<h3 class="line-clamp-1 font-medium">{movie?.title}</h3>
			<p class="line-clamp-3 text-sm text-gray-500">{movie?.overview}</p>
			{#if movie?.runtime}
				<p class="text-sm text-gray-500">
					{Math.floor(movie?.runtime / 60)}h {movie?.runtime % 60}m
				</p>
			{/if}
			{#if movie?.genres.length > 0}
				<div class="flex flex-wrap justify-center">
					{#each movie?.genres as genre}
						<Badge
							class="m-1 rounded-[2px] bg-gray-200 px-2 py-1 text-sm text-gray-700"
							key={genre.id}
						>
							{genre.name}
						</Badge>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</a>
