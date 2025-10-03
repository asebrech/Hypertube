<script lang="ts">
	import MovieList from '@/components/tadflix/movie-list/movie-list.svelte';
	import { MovieModal } from '@/components/tadflix/movie-modal';
	import type { Movie, Genre, PersonDetails } from '@hypertube/shared';
	import { getMovieDiscover, getGenresList, getPeopleDetails } from '@/services/api';
	import { _ } from 'svelte-i18n';
	import { onMount, onDestroy } from 'svelte';
	import { Select, SelectTrigger, SelectItem, SelectContent } from '@/components/ui/select';
	import { X } from 'lucide-svelte';
	import Titlebar from '@/components/tadflix/layout/titlebar/Titlebar.svelte';


	const { data } = $props();

	let isLoading: boolean = $state(false);
	let movies: Movie[] = $state([]);
	let selectedGenres: Genre[] = $state([]);
	let genres: Genre[] = $state([]);
	let releaseYear: string | undefined = $state(undefined);
	let hasMorePages: boolean = $state(true);
	let currentPage: number = $state(1);
	let castId: number | undefined = $state(undefined);
	let cast: PersonDetails | undefined = $state(undefined);
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
				sortBy,
				data.token
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
		const urlParams = new URLSearchParams(window.location.search);
		const genreParam = urlParams.get('genre');
		const castParam = urlParams.get('cast');
		if (window.location.search) {
			window.history.replaceState({}, '', window.location.pathname);
		}
		castId = castParam ? Number(castParam) : undefined;
		genres = await getGenresList(data.token);
		selectedGenres = genres.filter((genre) => genreParam === genre.id.toString());
		if (castId) cast = await getPeopleDetails(castId, data.token);
		await loadDiscoverMovies();
		observeSentinel();
	});

	let sentinel: HTMLDivElement;
	let observer: IntersectionObserver | null = null;

	const observeSentinel = () => {
		// Disconnect existing observer
		if (observer) {
			observer.disconnect();
		}

		observer = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && hasMorePages && !isLoading) {
					await loadDiscoverMovies();
				}
			},
			{ rootMargin: '200px' }
		);
		
		if (sentinel) {
			observer.observe(sentinel);
			
			// Check if sentinel is already visible and trigger load if needed
			setTimeout(() => {
				if (sentinel && hasMorePages && !isLoading) {
					const rect = sentinel.getBoundingClientRect();
					const isVisible = rect.top < window.innerHeight + 200; // 200px rootMargin
					if (isVisible) {
						loadDiscoverMovies();
					}
				}
			}, 100);
		}
	};

	const years = Array.from({ length: 50 }, (_, i) => `${new Date().getFullYear() - i}`);

	const sortOptions = [
		{ value: 'popularity.desc', label: 'filters.mostpopular' },
		{ value: 'release_date.desc', label: 'filters.latestrelease' },
		{ value: 'vote_average.desc', label: 'filters.toprated' }
		// { value: 'title.asc', label: 'filters.originaltitle' },
		// { value: 'title.desc', label: 'filters.originaltitle_desc' }
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
		movies = [];
		currentPage = 1;
		hasMorePages = true;
		loadDiscoverMovies().then(() => {
			// Re-observe sentinel after loading new content
			setTimeout(() => observeSentinel(), 100);
		});
	};

	function handleCastRemove(event: MouseEvent & { currentTarget: EventTarget & HTMLSpanElement }) {
		event.preventDefault();
		castId = undefined;
		cast = undefined;
		movies = [];
		currentPage = 1;
		hasMorePages = true;
		loadDiscoverMovies().then(() => {
			// Re-observe sentinel after loading new content
			setTimeout(() => observeSentinel(), 100);
		});
	}

	function handleGenreRemove(genreId: number) {
		selectedGenres = selectedGenres.filter(genre => genre.id !== genreId);
		movies = [];
		currentPage = 1;
		hasMorePages = true;
		loadDiscoverMovies().then(() => {
			// Re-observe sentinel after loading new content
			setTimeout(() => observeSentinel(), 100);
		});
	}

	onDestroy(() => {
		if (observer) {
			observer.disconnect();
		}
	});
</script>
<Titlebar>
<div class="flex gap-4 w-full">
	<!-- Genre -->
	<Select
		type="multiple"
		name="genre"
		onValueChange={(val) => handleChange('genre', val)}
		value={selectedGenres.map((g) => String(g.id))}
	>
		<SelectTrigger class="border-outline-1 h-[2rem] rounded-none focus:ring-0 focus:ring-offset-0">
			{$_('filters.select_genre')}
		</SelectTrigger>
		<SelectContent
			sideOffset={0}
			class="border-outline-1 m-0 rounded-none border-gray-500 p-0 focus:ring-0 focus:ring-offset-0"
		>
			{#each genres as genre}
				<SelectItem value={String(genre.id)} label={genre.name}>
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
		allowDeselect={true}
		onValueChange={(val) => handleChange('year', val)}
	>
		<SelectTrigger class="border-outline-1 h-[2rem] rounded-none focus:ring-0 focus:ring-offset-0">
			{releaseYear ? releaseYear : $_('filters.select_year')}
		</SelectTrigger>
		<SelectContent
			sideOffset={0}
			class="border-outline-1 m-0 rounded-none border-gray-500 p-0 focus:ring-0 focus:ring-offset-0"
		>
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
		<SelectTrigger class="border-outline-1 h-[2rem] rounded-none focus:ring-0 focus:ring-offset-0">
			{$_(sortOptions.find((opt) => opt.value === sortBy)?.label || 'filters.select_sort')}
		</SelectTrigger>
		<SelectContent
			sideOffset={0}
			class="border-outline-1 m-0 rounded-none border-gray-500 p-0 focus:ring-0 focus:ring-offset-0"
		>
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
		allowDeselect={true}
		onValueChange={(val) => handleChange('language', val)}
	>
		<SelectTrigger class="border-outline-1 h-[2rem] rounded-none focus:ring-0 focus:ring-offset-0">
			{languages.find((lang) => lang.value === originalLanguage)?.label || $_('filters.select_language')}
		</SelectTrigger>
		<SelectContent
			sideOffset={0}
			class="border-outline-1 m-0 rounded-none border-gray-500 p-0 focus:ring-0 focus:ring-offset-0"
		>
			{#each languages as lang}
				<SelectItem value={lang.value} label={lang.label}>
					{lang.label}
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>
</div>

	{#if cast}
		<div class="mx-[10%] mt-8 mb-4 flex items-center gap-2 text-sm text-gray-500">
			{$_('filters.selected_cast')}:
			<span class="flex cursor-pointer items-center gap-1 underline" onclick={handleCastRemove}>
				{cast.name}
				<X class="ml-1 h-4 w-4 text-gray-400 underline" />
			</span>
		</div>
	{/if}
	{#if selectedGenres.length > 0}
	<div class="mx-[10%] mt-8 mb-4 flex items-center gap-2 text-sm text-gray-500">
		{$_('filters.selected_genres')}:
		<div class="flex flex-wrap gap-2">
			{#each selectedGenres as genre}
				<span 
					class="flex cursor-pointer items-center gap-1 underline" 
					onclick={() => handleGenreRemove(genre.id)}
				>
					{genre.name}
					<X class="ml-1 h-4 w-4 text-gray-400 underline" />
				</span>
			{/each}
		</div>
	</div>
{/if}
</Titlebar>
<div class="{cast && selectedGenres.length > 0 ? 'pt-70' : cast || selectedGenres.length > 0 ? 'pt-56' :  'pt-42'}">
	{#if isLoading}
	<div class="flex h-[80vh] items-center justify-center">
		<p class="text-lg text-gray-500">{$_('search.loading')}</p>
	</div>
	{/if}
	
	{#if movies.length === 0 && !isLoading}
	<div class="flex h-[80vh] items-center justify-center">
		<p class="text-lg text-gray-500">{$_('search.noresults')}</p>
	</div>
	{/if}
	
	{#if movies.length > 0}
	<div class="flex flex-col gap-8 pb-[150px]">
		<MovieList {movies} data={data} />
	</div>
	{/if}
</div>

<div bind:this={sentinel}></div>

<!-- Movie Modal -->
<MovieModal data={data} />
