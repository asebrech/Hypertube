<script lang="ts">
	import { onMount } from 'svelte';
	import type { BackDropImage, MovieDetails, MovieGenre, MovieVideo } from '@hypertube/shared';
	import { getLogoImage, getMovieDetails, getMovies, getMovieVideos } from '@/services/api';

	import { MovieCarousel } from '@/components/tadflix/movie-carousel';
	import MovieBanner from '@/components/tadflix/movie-banner/MovieBanner.svelte';
	import Skeleton from '@/components/ui/skeleton/skeleton.svelte';
	import { ChevronRight } from 'lucide-svelte';
	import { _ } from 'svelte-i18n';

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
		<div class="z-9 flex w-full flex-col gap-[8px] overflow-hidden">
			<div class="mx-[10%] sm:mx-[10.714%] md:mx-[8.333%] lg:mx-[6.818%] xl:mx-[5.769%]">
				<a
					href={`/browse?genre=${genre.id}`}
					class="group flex w-fit flex-row items-center gap-2 text-xs font-normal text-white/80 transition-colors hover:text-white sm:text-sm lg:text-lg"
				>
					<div>{genre.name}</div>
					<div class="relative flex items-center overflow-hidden text-[#54b9c5]">
						<span
							class="ml-1 inline-block max-w-0 overflow-hidden whitespace-nowrap text-xs font-light text-[#54b9c5] opacity-0 transition-all duration-1000 group-hover:max-w-[200px] group-hover:translate-y-0 group-hover:opacity-100"
						>
							{$_('browse.explore')}
						</span>
						<ChevronRight
							size={12}
							class="inline-block transform opacity-0 transition-all duration-1000 group-hover:translate-x-1 group-hover:opacity-100"
						/>
					</div>
				</a>
			</div>
			{#if genre.id == 0}
				<MovieCarousel movies={genre.movies} genreId={genre.id} variant={'top-ten'} />
			{:else}
				<MovieCarousel movies={genre.movies} genreId={genre.id} />
			{/if}
		</div>
	{/each}
</div>

<div bind:this={sentinel}></div>
