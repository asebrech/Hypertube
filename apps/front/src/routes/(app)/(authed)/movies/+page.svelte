<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		BackDropImage,
		MovieDetails,
		MovieGenre,
		MovieType,
		MovieVideo
	} from '@hypertube/shared';
	import { getLogoImage, getMovieDetails, getMovies, getMovieVideos } from '@/services/api';

	import { MovieCarousel } from '@/components/tadflix/movie-carousel';
	import MovieBanner from '@/components/tadflix/movie-banner/MovieBanner.svelte';
	import { MovieModal } from '@/components/tadflix/movie-modal';
	import { GenreHeader } from '@/components/tadflix/genre-header';
	import Skeleton from '@/components/ui/skeleton/skeleton.svelte';
	import { Loader2 } from 'lucide-svelte';

	const { data } = $props();

	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);
	let isLoading: boolean = $state(false);
	let movieGenres: MovieGenre[] = $state([]);
	let movieBanner: MovieDetails | undefined = $state();
	let movieLogo: BackDropImage | undefined = $state();
	let movieVideoResponse: MovieVideo | undefined = $state();

	const loadMoviePage = async () => {
		if (!hasMorePages) return;
		try {
			isLoading = true;
			const getMovieResponse = await getMovies(currentPage, 'movie', data.token);
			movieGenres = movieGenres.concat(getMovieResponse.movies);
			hasMorePages = getMovieResponse.hasMorePages;
			currentPage++;
			isLoading = false;
		} catch {
		}
	};

	onMount(async () => {
		isLoading = true;
		await loadMoviePage();
		let idx = Math.floor(Math.random() * movieGenres[0].movies.length);
		movieBanner = await getMovieDetails(movieGenres[0].movies[idx].id, 'movie', data.token);
		movieLogo = await getLogoImage(movieGenres[0].movies[idx].id, 'small', 'movie', data.token);
		movieVideoResponse = await getMovieVideos(movieGenres[0].movies[idx].id, 'movie', data.token);
		isLoading = false;
		observeSentinel();
	});

	let sentinel: HTMLDivElement;

	const observeSentinel = () => {
		const observer = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMorePages && !isLoading) {
					await loadMoviePage();
				}
			},
			{ rootMargin: '200px' }
		);
		if (sentinel) {
			observer.observe(sentinel);
		}
	};
</script>

<div class="flex flex-col gap-8">
	{#if movieBanner}
		<MovieBanner
			logo={movieLogo}
			movie={movieBanner}
			movieVideo={movieVideoResponse}
			type="movie"
			instance="home"
		/>
	{:else}
		<Skeleton class="h-[80vh]" />
	{/if}
	{#each movieGenres as genre}
		<div class="flex w-full flex-col gap-[8px] overflow-hidden">
			<GenreHeader genreId={genre.id} genreName={genre.name} />
			{#if genre.id == 0}
				<MovieCarousel movies={[...genre.movies.slice(-1), ...genre.movies.slice(0, -1)]} genreId={genre.id} variant={'top-ten'} data={data}/>
			{:else}
				<MovieCarousel movies={genre.movies} genreId={genre.id} data={data}/>
			{/if}
		</div>
	{/each}
	{#if isLoading}
		<div class="mt-4">
			<Loader2 class="mx-auto h-8 w-8 animate-spin text-red-500" />
		</div>
	{/if}
</div>

<div bind:this={sentinel}></div>

<!-- Movie Modal -->
<MovieModal data={data} />
