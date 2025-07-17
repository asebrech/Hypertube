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
		{ value: 'popularity.desc', label: 'filters.mostpopular' },
		{ value: 'release_date.desc', label: 'filters.latestrelease' },
		{ value: 'vote_average.desc', label: 'filters.toprated' }
	];

	const languages = [
		{ value: 'en', label: 'English' },
		{ value: 'fr', label: 'French' },
		{ value: 'ja', label: 'Japanese' },
		{ value: 'zh', label: 'Chinese' },
		{ value: 'es', label: 'Spanish' },
		{ value: 'de', label: 'German' },
		{ value: 'it', label: 'Italian' },
		{ value: 'ko', label: 'Korean' },
		{ value: 'ru', label: 'Russian' },
		{ value: 'hi', label: 'Hindi' },
		{ value: 'ar', label: 'Arabic' },
		{ value: 'pt', label: 'Portuguese' },
		{ value: 'tr', label: 'Turkish' },
		{ value: 'nl', label: 'Dutch' },
		{ value: 'sv', label: 'Swedish' },
		{ value: 'no', label: 'Norwegian' },
		{ value: 'da', label: 'Danish' },
		{ value: 'fi', label: 'Finnish' },
		{ value: 'pl', label: 'Polish' },
		{ value: 'cs', label: 'Czech' }
	];

	const handleChange = (name: string, value: string | string[] | number | undefined) => {
		if (name === 'genre' && Array.isArray(value)) {
			selectedGenres = genres.filter((genre) => value?.some((v) => String(v) === String(genre.id)));
		} else if (name === 'year' && typeof value === 'string') {
			releaseYear = value;
		} else if (name === 'sort' && typeof value === 'string') {
			sortBy = value;
		} else if (name === 'language' && typeof value === 'string') {
			originalLanguage = value;
		}
		// Reset movies and pagination when filters change
		movies = [];
		currentPage = 1;
		hasMorePages = true;
		// Reload movies with new filters
		loadDiscoverMovies();
	};
</script>

<div
	class="mx-[10%] flex gap-4
        p-4 pt-[120px]
        sm:mx-[10.714%]
        md:mx-[8.333%]
        lg:mx-[6.818%]
        xl:mx-[5.769%]
    "
>
	<!-- Genre -->
	<Select type="multiple" name="genre" onValueChange={(val) => handleChange('genre', val)}>
		<SelectTrigger>
			{$_('filters.select_genre')}
		</SelectTrigger>
		<SelectContent>
			{#each genres as genre}
				<SelectItem
					value={String(genre.id)}
					label={genre.name}
					class="flex items-center justify-between"
				>
					{genre.name}
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>

	<!-- Year -->
	<Select
		type="single"
		bind:value={releaseYear}
		name="year"
		onValueChange={(val) => handleChange('year', val)}
	>
		<SelectTrigger>
			{releaseYear ? releaseYear : $_('filters.select_year')}
		</SelectTrigger>
		<SelectContent>
			{#each years as year}
				<SelectItem value={year} label={year}>
					{year}
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>

	<!-- Sort -->
	<Select
		type="single"
		bind:value={sortBy}
		name="sort"
		onValueChange={(val) => handleChange('sort', val)}
	>
		<SelectTrigger>
			{$_(sortOptions.find((opt) => opt.value === sortBy)?.label || 'filters.select_sort')}
		</SelectTrigger>
		<SelectContent>
			{#each sortOptions as option}
				<SelectItem value={option.value} label={option.label}>
					{$_(option.label)}
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>

	<!-- Language -->
	<Select
		type="single"
		bind:value={originalLanguage}
		name="language"
		onValueChange={(val) => handleChange('language', val)}
	>
		<SelectTrigger>
			{$_('filters.select_language')}
		</SelectTrigger>
		<SelectContent>
			{#each languages as lang}
				<SelectItem value={lang.value} label={lang.label}>
					{lang.label}
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>
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
