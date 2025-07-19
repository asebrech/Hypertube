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
	import Skeleton from '@/components/ui/skeleton/skeleton.svelte';

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
		} catch (error) {
			console.error('Error loading movies', error);
		}
	};

	onMount(async () => {
		isLoading = true;
		await loadMoviePage();
		let idx = Math.floor(Math.random() * movieGenres[0].movies.length);
		movieBanner = await getMovieDetails(movieGenres[0].movies[idx].id, 'movie');
		movieLogo = await getLogoImage(movieGenres[0].movies[idx].id, 'small', 'movie');
		movieVideoResponse = await getMovieVideos(movieGenres[0].movies[idx].id, 'movie');
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
		<MovieBanner logo={movieLogo} movie={movieBanner} movieVideo={movieVideoResponse} />
	{:else}
		<Skeleton class="h-[80vh]" />
	{/if}
	{#each movieGenres as genre}
		<div class="flex w-full flex-col gap-[15px] overflow-hidden">
			<h2 class="text-l ml-[58px] font-medium">{genre.name}</h2>
			{#if genre.id == 0}
				<MovieCarousel movies={genre.movies} genreId={genre.id} variant={'top-ten'} />
			{:else}
				<MovieCarousel movies={genre.movies} genreId={genre.id} />
			{/if}
		</div>
	{/each}
</div>

<div bind:this={sentinel}></div>
