<script lang="ts">
	import { Film, MessageCircle, Calendar, Edit3, Mail } from 'lucide-svelte';
	import { MovieCard } from '$lib/components/tadflix/movie-card';
	import { HoverCard, HoverCardTrigger, HoverCardContent } from '$lib/components/ui/hover-card';
	import { MoviePreview } from '$lib/components/tadflix/movie-preview';
	import { UserComments } from '$lib/components/tadflix/comments';
	import { openHoverCardId } from '$lib/services/store';
	import { get } from 'svelte/store';
	import { _ } from 'svelte-i18n';

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
<div class="min-h-screen bg-cover bg-center bg-no-repeat text-white relative" style="background-image: url('/img/netflix-background.jpg');">
	<!-- Background Overlay -->
	<div class="absolute inset-0 bg-black/50"></div>
	
	<div class="relative z-10">
		<!-- Profile Hero Section -->
		<div class="pt-24 pb-16">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex flex-col md:flex-row items-start gap-8">
					<!-- Avatar -->
					<div class="relative group">
						{#if data.profileUser.profilePicture}
							<div class="w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden shadow-2xl">
								<img 
									src={data.profileUser.profilePicture} 
									alt="{data.profileUser.username}'s profile"
									class="w-full h-full object-cover"
								/>
							</div>
						{:else}
							<div class="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-2xl">
								<span class="text-5xl md:text-6xl font-bold text-white">
									{data.profileUser.username?.charAt(0)?.toUpperCase() || '?'}
								</span>
							</div>
						{/if}
					</div>

					<!-- Profile Info -->
					<div class="flex-1">
						<div class="space-y-4">
							<!-- Username -->
							<h1 class="text-4xl md:text-6xl font-bold text-white">
								{data.profileUser.username || $_('profile.unknown-user')}
							</h1>

							<!-- Full Name -->
							<p class="text-xl md:text-2xl text-gray-300 font-light">
								{#if data.profileUser.firstName || data.profileUser.lastName}
									{data.profileUser.firstName || ''} {data.profileUser.lastName || ''}
								{:else}
									<span class="text-gray-500 italic">{$_('profile.no-display-name')}</span>
								{/if}
							</p>

							<!-- Member Since -->
							<div class="flex items-center gap-3 text-gray-400">
								<Calendar class="w-5 h-5" />
								<span>{$_('profile.member-since')} {formatDate(data.profileUser.createdAt)}</span>
							</div>

							{#if data.isOwnProfile && data.currentUser}
								<div class="flex items-center gap-3 text-gray-400">
									<Mail class="w-5 h-5" />
									<span>{data.currentUser.email}</span>
								</div>
							{/if}

							<!-- Profile Actions -->
							{#if data.isOwnProfile}
								<div class="pt-6">
									<a
										href="/account"
										class="inline-flex items-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
									>
										<Edit3 class="w-5 h-5" />
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
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
					<!-- Movies with Progress -->
					<div class="bg-black bg-opacity-60 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-red-500 hover:border-opacity-80 transition-all duration-300 group">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 bg-red-500 bg-opacity-80 rounded-lg flex items-center justify-center group-hover:bg-opacity-100 transition-colors shadow-lg">
								<Film class="w-6 h-6 text-white" />
							</div>
							<div>
								<p class="text-3xl font-bold text-white">{data.profileUser.moviesWatched || 0}</p>
								<p class="text-gray-400 text-sm">{$_('profile.movies-watched')}</p>
							</div>
						</div>
					</div>

					<!-- Comments -->
					<div class="bg-black bg-opacity-60 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-blue-500 hover:border-opacity-80 transition-all duration-300 group">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 bg-blue-500 bg-opacity-80 rounded-lg flex items-center justify-center group-hover:bg-opacity-100 transition-colors shadow-lg">
								<MessageCircle class="w-6 h-6 text-white" />
							</div>
							<div>
								<p class="text-3xl font-bold text-white">{data.profileUser.totalComments || 0}</p>
								<p class="text-gray-400 text-sm">{$_('profile.comments-posted')}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Watched Movies Section -->
		{#if data.profileUser.watchedMoviesData && data.profileUser.watchedMoviesData.length > 0}
			<div class="pb-16">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 class="text-2xl font-bold text-white mb-8">{$_('profile.recently-watched-movies')}</h2>
					<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{#each data.profileUser.watchedMoviesData as movie}
							<HoverCard open={$openHoverCardId === 'profile-' + String(movie.tmdbId)}>
								<HoverCardTrigger>
									<div
										role="button"
										tabindex="0"
										onmouseenter={async () => await handleMouseEnter(String(movie.tmdbId))}
									>
										<MovieCard 
											movieId={movie.tmdbId}
											isVisible={true}
											title={movie.title}
											type={movie.type}
										/>
									</div>
								</HoverCardTrigger>
								<HoverCardContent
									hideWhenDetached={true}
									collisionPadding={10}
									align="center"
									side="bottom"
									sideOffset={10}
									class="m-0 w-full overflow-hidden rounded-[8px] border-none p-0 max-w-[400px]"
								>
									<div
										role="button"
										tabindex="0"
										onmouseleave={() => handleMouseLeave(String(movie.tmdbId))}
										class={get(openHoverCardId) === null ||
										get(openHoverCardId) === 'profile-' + String(movie.tmdbId)
											? ''
											: 'hidden'}
									>
										<MoviePreview movieId={movie.tmdbId} type={movie.type} />
									</div>
								</HoverCardContent>
							</HoverCard>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- User Comments Section -->
		<div class="pb-16">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 class="text-2xl font-bold text-white mb-8">
					{#if data.isOwnProfile}
						{$_('profile.your-comments')}
					{:else}
						{$_('profile.user-comments', { values: { username: data.profileUser.username } })}
					{/if}
				</h2>
				<div class="bg-black bg-opacity-40 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
					<UserComments 
						profileUserId={data.profileUser.id}
						profileUsername={data.profileUser.username}
						isOwnProfile={data.isOwnProfile}
						compact={true}
						maxHeight="500px"
						showMovieContext={true}
						showHeader={false}
					/>
				</div>
			</div>
		</div>
	</div>
</div>