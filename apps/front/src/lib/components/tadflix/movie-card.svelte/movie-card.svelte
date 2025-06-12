<script lang="ts">
	import { Badge } from '@/components/ui/badge';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getMovieDetails } from '@/services/api';
	import type { MovieDetails } from '@hypertube/shared';

	export let movie: { id: number; title: string; overview: string; backdrop_path?: string };

	const loadMovieDetails = async (movieId: number): Promise<MovieDetails> => {
		const movieDetailsResponse = await getMovieDetails(movieId);
		return movieDetailsResponse;
	};
</script>

<a href="/movie/{movie.id}" target="_blank" rel="noreferrer noopener" class="block">
	{#await loadMovieDetails(movie.id)}
		<Skeleton class="h-full w-full" />
	{:then movieDetails}
		<div class="flex flex-col items-center">
			{#if movieDetails.backdrop_path}
				<img
					src={`https://image.tmdb.org/t/p/w500${movieDetails.backdrop_path}`}
					alt={movieDetails.title}
					class="w-[300px] rounded-[2px] object-cover"
				/>
			{/if}
			<div class="m-2 p-4">
				<h3 class="line-clamp-1 font-medium">{movieDetails.title}</h3>
				<p class="line-clamp-3 text-sm text-gray-500">{movieDetails.overview}</p>
				{#if movieDetails.runtime}
					<p class="text-sm text-gray-500">
						{Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m
					</p>
				{/if}
				{#if movieDetails.genres.length > 0}
					<div class="flex flex-wrap justify-center">
						{#each movieDetails.genres as genre}
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
	{/await}
</a>
