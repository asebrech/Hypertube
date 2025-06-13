<script lang="ts">
	import { Badge } from '@/components/ui/badge';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getMovieDetails } from '@/services/api';
	import type { MovieDetails } from '@hypertube/shared';
	import { onMount } from 'svelte';
	import ButtonPreview from '$lib/components/tadflix/buttons/button-preview/button-preview.svelte';
	import { Play, Plus, ChevronDown, Languages } from 'lucide-svelte';
	import Icon from '$lib/assets/tadflix-small.svelte';
	import { Dot } from 'lucide-svelte';
	import { locale } from 'svelte-i18n';
	import { get } from 'svelte/store';

	export let movieId: number;
	let isLoading = true;
	let movie: MovieDetails;

	const loadMovieDetails = async (movieId: number): Promise<MovieDetails> => {
		const movieDetailsResponse = await getMovieDetails(movieId);
		movie = movieDetailsResponse;
		console.log('Movie details loaded:', movie);
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

<a href="/movie/{movieId}" target="_blank" rel="noreferrer noopener" class="block">
	<div class="bg-secondary flex flex-col items-center gap-2 pb-2">
		{#if movie?.backdrop_path}
			<div
				class="flex aspect-[5/3] w-[300px] items-end rounded-[2px] bg-cover bg-center"
				style="background-image: url('https://image.tmdb.org/t/p/w500{movie.backdrop_path}');"
			>
				<div class="w-full rounded-b-[2px] bg-gradient-to-t from-black/60 to-transparent p-4">
					<Icon />
					<h3 class="line-clamp-1 font-medium">{movie?.title}</h3>
				</div>
			</div>
		{:else}
			<div class="flex aspect-[5/3] w-[300px] items-center justify-center">
				<Skeleton class="h-full w-full rounded-[2px]" />
			</div>
		{/if}
		<div class="flex w-full flex-col gap-2 p-4">
			{#if isLoading}
				<div class="mt-2">
					<Skeleton class="h-6 w-24" />
				</div>
			{:else}
				<div class="flex items-center justify-between">
					<div class="flex gap-2">
						<ButtonPreview variant="filled">
							<Play fill={'black'} />
						</ButtonPreview>
						<ButtonPreview variant="outline">
							<Plus />
						</ButtonPreview>
					</div>
					<ButtonPreview variant="outline">
						<ChevronDown />
					</ButtonPreview>
				</div>
			{/if}
			<!-- <p class="line-clamp-3 text-sm text-gray-500">{movie?.overview}</p> -->
			{#if movie?.runtime}
				<div class="flex items-center gap-2">
					<p class="border border-gray-300 px-[4px] py-[0px] text-[12px] uppercase text-gray-300">
						{movie.release_date
							? new Date(movie.release_date).toLocaleDateString(get(locale) as string, {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})
							: 'Unknown Release Date'}
					</p>
					<p class="text-sm text-gray-300">
						{Math.floor(movie?.runtime / 60)} h {movie?.runtime % 60} min
					</p>
					<p class="border border-gray-300 px-[4px] py-[0px] text-[12px] uppercase text-gray-300">
						{movie.original_language}
					</p>
				</div>
			{/if}
			{#if movie?.genres.length > 0}
				<div class="flex flex-wrap items-center">
					{#each movie?.genres as genre, i (genre.id)}
						<p class="font-montserrat text-[16px] font-normal">{genre.name}</p>
						{#if i < movie.genres.length - 1}
							<Dot color="gray" />
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</a>
