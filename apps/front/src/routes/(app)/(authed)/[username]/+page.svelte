<script lang="ts">
	import { Film, MessageCircle, Calendar, Edit3, Mail } from 'lucide-svelte';
	import { UserComments } from '$lib/components/tadflix/comments';
	import { openHoverCardId } from '$lib/services/store';
	import { get } from 'svelte/store';
	import { _ } from 'svelte-i18n';
	import { MovieList } from '@/components/tadflix/movie-list';
	import MovieModal from '@/components/tadflix/movie-modal/movie-modal.svelte';

	const { data } = $props();

	async function handleMouseEnter(id: string) {
		openHoverCardId.set('profile-' + id);
	}

	function handleMouseLeave(id: string) {
		if (get(openHoverCardId) === 'profile-' + id) openHoverCardId.set(null);
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};
</script>

<svelte:head>
	<title>{data.profileUser.username || $_('profile.unknown-user')} - Datflix</title>
</svelte:head>

<!-- Hero Section with Netflix Background -->
<div
	class="relative min-h-screen bg-cover bg-center bg-no-repeat text-white"
	style="background-image: url('/img/netflix-background.jpg');"
>
	<!-- Background Overlay -->
	<div class="absolute inset-0 bg-black/50"></div>

	<div class="relative z-10">
		<!-- Profile Hero Section -->
		<div class="pt-24 pb-16">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex flex-col items-start gap-8 md:flex-row">
					<!-- Avatar -->
					<div class="group relative">
						{#if data.profileUser.profilePicture}
							<div class="h-32 w-32 overflow-hidden rounded-lg shadow-2xl md:h-40 md:w-40">
								<img
									src={data.profileUser.profilePicture}
									alt="{data.profileUser.username}'s profile"
									class="h-full w-full object-cover"
								/>
							</div>
						{:else}
							<div
								class="flex h-32 w-32 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-800 shadow-2xl md:h-40 md:w-40"
							>
								<span class="text-5xl font-bold text-white md:text-6xl">
									{data.profileUser.username?.charAt(0)?.toUpperCase() || '?'}
								</span>
							</div>
						{/if}
					</div>

					<!-- Profile Info -->
					<div class="flex-1">
						<div class="space-y-4">
							<!-- Username -->
							<h1 class="text-4xl font-bold text-white md:text-6xl">
								{data.profileUser.username || $_('profile.unknown-user')}
							</h1>

							<!-- Full Name -->
							<p class="text-xl font-light text-gray-300 md:text-2xl">
								{#if data.profileUser.firstName || data.profileUser.lastName}
									{data.profileUser.firstName || ''} {data.profileUser.lastName || ''}
								{:else}
									<span class="text-gray-500 italic">{$_('profile.no-display-name')}</span>
								{/if}
							</p>

							<!-- Member Since -->
							<div class="flex items-center gap-3 text-gray-400">
								<Calendar class="h-5 w-5" />
								<span>{$_('profile.member-since')} {formatDate(data.profileUser.createdAt)}</span>
							</div>

							{#if data.isOwnProfile && data.currentUser}
								<div class="flex items-center gap-3 text-gray-400">
									<Mail class="h-5 w-5" />
									<span>{data.currentUser.email}</span>
								</div>
							{/if}

							<!-- Profile Actions -->
							{#if data.isOwnProfile}
								<div class="pt-6">
									<a
										href="/account"
										class="inline-flex items-center gap-3 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-red-700 hover:shadow-xl"
									>
										<Edit3 class="h-5 w-5" />
										<span>{$_('profile.modify-profile')}</span>
									</a>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats Section -->
		<div class="pb-16">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Movies with Progress -->
					<div
						class="bg-opacity-60 hover:border-opacity-80 group rounded-lg border border-gray-700 bg-black p-6 backdrop-blur-sm transition-all duration-300 hover:border-red-500"
					>
						<div class="flex items-center gap-4">
							<div
								class="bg-opacity-80 group-hover:bg-opacity-100 flex h-12 w-12 items-center justify-center rounded-lg bg-red-500 shadow-lg transition-colors"
							>
								<Film class="h-6 w-6 text-white" />
							</div>
							<div>
								<p class="text-3xl font-bold text-white">{data.profileUser.moviesWatched || 0}</p>
								<p class="text-sm text-gray-400">{$_('profile.movies-watched')}</p>
							</div>
						</div>
					</div>

					<!-- Comments -->
					<div
						class="bg-opacity-60 hover:border-opacity-80 group rounded-lg border border-gray-700 bg-black p-6 backdrop-blur-sm transition-all duration-300 hover:border-blue-500"
					>
						<div class="flex items-center gap-4">
							<div
								class="bg-opacity-80 group-hover:bg-opacity-100 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 shadow-lg transition-colors"
							>
								<MessageCircle class="h-6 w-6 text-white" />
							</div>
							<div>
								<p class="text-3xl font-bold text-white">{data.profileUser.totalComments || 0}</p>
								<p class="text-sm text-gray-400">{$_('profile.comments-posted')}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Watched Movies Section -->
		{#if data.profileUser.watchedMoviesData && data.profileUser.watchedMoviesData.length > 0}
			<div class="pb-16">
				<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<h2 class="mb-8 text-2xl font-bold text-white">
						{$_('profile.recently-watched-movies')}
					</h2>
					<MovieList movies={data.profileUser.watchedMoviesData.map((movie: any) => ({
						id: movie.tmdbId,
						title: movie.title,
						type: movie.type,
						torrent_available: movie.torrent_available,
						is_watched: true,
						watch_progress_seconds: movie.watch_progress_seconds || 0
					}))} data={data} />
				</div>
			</div>
		{/if}

		<!-- User Comments Section -->
		<div class="pb-16">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<h2 class="mb-8 text-2xl font-bold text-white">
					{#if data.isOwnProfile}
						{$_('profile.your-comments')}
					{:else}
						{$_('profile.user-comments', { values: { username: data.profileUser.username } })}
					{/if}
				</h2>
				<div class="bg-opacity-40 rounded-lg border border-gray-800 bg-black p-6 backdrop-blur-sm">
					<UserComments
						profileUserId={data.profileUser.id}
						profileUsername={data.profileUser.username}
						isOwnProfile={data.isOwnProfile}
						compact={true}
						maxHeight="none"
						showMovieContext={true}
						showHeader={false}
					/>
				</div>
			</div>
		</div>
	</div>
</div>

<MovieModal data={data} />