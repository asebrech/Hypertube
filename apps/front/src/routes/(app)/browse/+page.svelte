<script lang="ts">
	import MovieList from '@/components/tadflix/movie-list/movie-list.svelte';
	import type { Movie, Genre } from '@hypertube/shared';
	import { getMovieDiscover, getGenresList } from '@/services/api';
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { Select, SelectTrigger, SelectItem, SelectContent } from '@/components/ui/select';

	let isLoading: boolean = $state(false);
	let movies: Movie[] = $state([]);
	let selectedGenres: Genre[] = $state([]);
	let genres: Genre[] = $state([]);
	let releaseYear: string | undefined = $state(undefined);
	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);
	let castId: number[] | undefined = $state(undefined);
	let sortBy: string = $state('popularity.desc');
	let originalLanguage: string | undefined = $state(undefined);

	const loadDiscoverMovies = async () => {
		isLoading = true;
		try {
			const response = await getMovieDiscover(
				selectedGenres.map((genre) => genre.id),
				castId,
				currentPage,
				'movie',
				releaseYear,
				originalLanguage,
				sortBy
			);
			movies = movies.concat(response.movies);
			hasMorePages = response.hasMorePages;
			currentPage++;
		} catch (error) {
			console.error('Error loading discover movies:', error);
		} finally {
			isLoading = false;
		}
	};

	onMount(async () => {
		genres = await getGenresList();
		await loadDiscoverMovies();
		observeSentinel();
	});

	let sentinel: HTMLDivElement;

	const observeSentinel = () => {
		const observer = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMorePages && !isLoading) {
					await loadDiscoverMovies();
				}
			},
			{ rootMargin: '200px' }
		);
		if (sentinel) {
			observer.observe(sentinel);
		}
	};

	const years = Array.from({ length: 50 }, (_, i) => `${2025 - i}`);

	const sortOptions = [
		{ value: 'popularity.desc', label: 'Most Popular' },
		{ value: 'release_date.desc', label: 'Latest Release' },
		{ value: 'vote_average.desc', label: 'Top Rated' }
	];

	const languages = [
		{ value: 'en', label: 'English' },
		{ value: 'fr', label: 'French' },
		{ value: 'ja', label: 'Japanese' }
	];

	const handleChange = (name: string, value: string | number | undefined) => {
		if (name === 'genre') {
			selectedGenres = genres.filter((g) => g.id === Number(value));
		} else if (name === 'year') {
			releaseYear = value as string;
		} else if (name === 'sort') {
			sortBy = value as string;
		} else if (name === 'language') {
			originalLanguage = value as string;
		}
		// Reset movies and pagination when filters change
		movies = [];
		currentPage = 1;
		hasMorePages = true;
		loadDiscoverMovies();
	};
</script>

<div class="flex flex-wrap gap-4 px-4 pt-[120px]">
	<!-- Genre -->
	<select name="genre" on:change={handleChange}>
		<option disabled selected>{$_('filters.select_genre')}</option>
		{#each genres as genre}
			<option value={genre.id}>{genre.name}</option>
		{/each}
	</select>
	<Select
		type="single"
		bind:value={releaseYear}
		name={'year'}
		onValueChange={() => handleChange('year', releaseYear)}
	>
		<SelectTrigger>
			{$_('filters.select_year')}
		</SelectTrigger>
		<SelectContent>
			{#each years as year}
				<SelectItem value={year} label={year} />
			{/each}
		</SelectContent>
	</Select>
	<!-- Year -->
	<!-- <select name="year" on:change={handleChange}>
		<option disabled selected>{$_('filters.select_year')}</option>
		{#each years as year}
			<option value={year}>{year}</option>
		{/each}
	</select> -->

	<!-- Sort -->
	<select name="sort" on:change={handleChange}>
		{#each sortOptions as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	<!-- Language -->
	<select name="language" on:change={handleChange}>
		<option disabled selected>{$_('filters.select_language')}</option>
		{#each languages as lang}
			<option value={lang.value}>{lang.label}</option>
		{/each}
	</select>
</div>

{#if movies.length === 0 && !isLoading}
	<div class="flex h-[80vh] items-center justify-center">
		<p class="text-lg text-gray-500">{$_('search.noresults')}</p>
	</div>
{/if}

{#if movies.length > 0}
	<div class="flex flex-col gap-8 py-[150px]">
		<MovieList {movies} />
	</div>
{/if}

<div bind:this={sentinel}></div>
