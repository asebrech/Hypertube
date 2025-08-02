<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Play, Plus, ThumbsUp, ThumbsDown, Volume2, VolumeOff } from 'lucide-svelte';
	import { movieModal } from '@/services/store';
	import { getMovieDetails, getMovieVideos, getMovieCredits } from '@/services/api';
	import type { MovieDetails, MovieVideo, MovieCredits, MovieType } from '@hypertube/shared';
	import { Skeleton } from '@/components/ui/skeleton';
	import { Dialog, DialogContent } from '@/components/ui/dialog';
	import ButtonPreview from '$lib/components/tadflix/buttons/button-preview/button-preview.svelte';
	import { locale } from 'svelte-i18n';
	import { get } from 'svelte/store';

	let isOpen = $state(false);
	let movieId = $state<number | undefined>(undefined);
	let type = $state<MovieType | undefined>(undefined);
	let movie = $state<MovieDetails | undefined>(undefined);
	let movieVideo = $state<MovieVideo | undefined>(undefined);
	let movieCredits = $state<MovieCredits | undefined>(undefined);
	let isLoading = $state(true);
	let showVideo = $state(false);
	let isMuted = $state(true);
	let player: YT.Player;
	let playerElement: HTMLDivElement;
	let playerReady = $state(false);
	let videoEnded = $state(false);
	let isApiLoaded = false;

	// Subscribe to modal store
	let unsubscribe: (() => void) | undefined;

	onMount(() => {
		unsubscribe = movieModal.subscribe((modalState) => {
			isOpen = modalState.isOpen;
			movieId = modalState.movieId;
			type = modalState.type;

			if (isOpen && movieId && type) {
				loadMovieData(movieId, type);
			}
		});

		return () => {
			if (unsubscribe) unsubscribe();
		};
	});

	const loadMovieData = async (id: number, movieType: MovieType) => {
		isLoading = true;
		try {
			const [movieDetails, movieVideos, credits] = await Promise.all([
				getMovieDetails(id, movieType),
				getMovieVideos(id, movieType),
				getMovieCredits(id, movieType)
			]);

			movie = movieDetails;
			movieVideo = movieVideos;
			movieCredits = credits;
		} catch (error) {
			console.error('Error loading movie data:', error);
		} finally {
			isLoading = false;
		}
	};

	const closeModal = () => {
		movieModal.set({ isOpen: false, movieId: undefined, type: undefined });
		if (player) {
			player.stopVideo();
		}
		resetVideoState();
	};

	const resetVideoState = () => {
		showVideo = false;
		playerReady = false;
		videoEnded = false;
		isMuted = true;
	};

	const createPlayer = (videoId: string) => {
		if (!videoId || !isApiLoaded || !playerElement) return;

		if (!player) {
			player = new YT.Player(playerElement, {
				videoId: movieVideo?.key,
				events: {
					onReady: () => {
						player.mute();
						player.playVideo();
					},
					onStateChange: (event) => {
						if (event.data === YT.PlayerState.ENDED) {
							videoEnded = true;
						}
						if (event.data === YT.PlayerState.PLAYING) {
							playerReady = true;
							showVideo = true;
						}
					}
				},
				playerVars: {
					autoplay: 1,
					controls: 0,
					loop: 0,
					rel: 0,
					showinfo: 0,
					disablekb: 1
				}
			});
		} else {
			player.loadVideoById(videoId);
		}
	};

	const toggleMute = () => {
		if (!player) return;
		if (isMuted) {
			player.unMute();
		} else {
			player.mute();
		}
		isMuted = !isMuted;
	};

	onMount(() => {
		// @ts-ignore
		window.onYouTubeIframeAPIReady = () => {
			isApiLoaded = true;
			if (movieVideo?.key) createPlayer(movieVideo?.key);
		};

		if (!window.YT) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			document.body.appendChild(tag);
		} else {
			isApiLoaded = true;
			if (movieVideo?.key) createPlayer(movieVideo?.key);
		}
	});

	$effect(() => {
		if (movieVideo?.key && isApiLoaded) {
			createPlayer(movieVideo?.key);
		}
	});
</script>

<Dialog
	open={isOpen}
	onOpenChange={(open) => {
		if (!open) {
			closeModal();
		}
	}}
>
	<DialogContent
		class="max-h-[90vh] w-full max-w-6xl overflow-y-auto border-gray-800 bg-gray-900 p-0"
		showCloseButton={false}
	>
		<!-- Custom Close Button -->
		<button
			onclick={closeModal}
			class="absolute top-4 right-4 z-10 rounded-full bg-gray-800/80 p-2 text-white transition-colors hover:bg-gray-700"
		>
			<X size={20} />
		</button>

		{#if isLoading}
			<!-- Loading State -->
			<div class="aspect-video w-full bg-gray-800">
				<Skeleton class="h-full w-full" />
			</div>
			<div class="p-6">
				<Skeleton class="mb-4 h-8 w-3/4" />
				<Skeleton class="mb-2 h-4 w-full" />
				<Skeleton class="h-4 w-2/3" />
			</div>
		{:else if movie}
			<!-- Video/Backdrop Section -->
			<div class="relative aspect-video w-full overflow-hidden">
				<!-- Background Image -->
				<div
					class="absolute inset-0 bg-cover bg-center"
					style="background-image: url('https://image.tmdb.org/t/p/w1280{movie.backdrop_path ||
						movie.poster_path}');"
				>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"
					/>
				</div>

				<!-- Video Player -->
				{#if showVideo}
					<div class="absolute inset-0">
						<div
							class="absolute top-1/2 left-1/2 min-h-[110%] min-w-[110%] -translate-x-1/2 -translate-y-1/2"
						>
							<div bind:this={playerElement} class="absolute top-0 left-0 h-full w-full"></div>
						</div>
						<div
							class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
						/>
					</div>
				{/if}

				<!-- Controls Overlay -->
				<div class="absolute right-0 bottom-0 left-0 p-8">
					<h1 class="mb-4 text-4xl font-bold text-white">
						{type === 'movie' ? movie.title : movie.name}
					</h1>

					<div class="flex items-center gap-4">
						<button
							class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-200"
						>
							<Play fill="currentColor" size={20} />
						</button>

						<ButtonPreview variant="outline" class="border-white text-white hover:bg-white/20">
							<Plus size={20} />
						</ButtonPreview>

						<ButtonPreview variant="outline" class="border-white text-white hover:bg-white/20">
							<ThumbsUp size={20} />
						</ButtonPreview>

						<ButtonPreview variant="outline" class="border-white text-white hover:bg-white/20">
							<ThumbsDown size={20} />
						</ButtonPreview>

						{#if showVideo}
							<ButtonPreview
								variant="outline"
								class="ml-auto border-white text-white hover:bg-white/20"
								onclick={toggleMute}
							>
								{#if isMuted}
									<VolumeOff size={20} />
								{:else}
									<Volume2 size={20} />
								{/if}
							</ButtonPreview>
						{/if}
					</div>
				</div>
			</div>

			<!-- Movie Details Section -->
			<div class="p-8">
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<!-- Main Content -->
					<div class="lg:col-span-2">
						<!-- Movie Info -->
						<div class="mb-6 flex items-center gap-4 text-sm text-gray-300">
							{#if movie.vote_average}
								<span class="font-semibold text-green-500">
									{Math.round(movie.vote_average * 10)}% Match
								</span>
							{/if}

							{#if movie.release_date}
								<span>
									{new Date(movie.release_date).getFullYear()}
								</span>
							{/if}

							{#if movie.runtime}
								<span>
									{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
								</span>
							{/if}

							{#if movie.adult}
								<span class="border border-gray-400 px-1 text-xs">18+</span>
							{:else}
								<span class="border border-gray-400 px-1 text-xs">PG-13</span>
							{/if}
						</div>

						<!-- Overview -->
						{#if movie.overview}
							<p class="mb-6 leading-relaxed text-white">
								{movie.overview}
							</p>
						{/if}
					</div>

					<!-- Sidebar -->
					<div class="lg:col-span-1">
						<!-- Cast -->
						{#if movieCredits?.cast && movieCredits.cast.length > 0}
							<div class="mb-6">
								<h3 class="mb-3 text-sm font-semibold text-gray-400">Cast:</h3>
								<div class="text-sm text-gray-300">
									{movieCredits.cast
										.slice(0, 4)
										.map((actor) => actor.name)
										.join(', ')}
									{#if movieCredits.cast.length > 4}
										<span>, and more...</span>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Genres -->
						{#if movie.genres && movie.genres.length > 0}
							<div class="mb-6">
								<h3 class="mb-3 text-sm font-semibold text-gray-400">Genres:</h3>
								<div class="text-sm text-gray-300">
									{movie.genres.map((genre) => genre.name).join(', ')}
								</div>
							</div>
						{/if}

						<!-- Languages -->
						{#if movie.spoken_languages && movie.spoken_languages.length > 0}
							<div class="mb-6">
								<h3 class="mb-3 text-sm font-semibold text-gray-400">Audio:</h3>
								<div class="text-sm text-gray-300">
									{movie.spoken_languages.map((lang) => lang.english_name).join(', ')}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</DialogContent>
</Dialog>
