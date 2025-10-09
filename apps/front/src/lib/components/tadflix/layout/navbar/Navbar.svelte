<script lang="ts">
	import Datflix from '@/assets/datflix.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '@/utils';
	import LanguageSelector from '../LanguageSelector.svelte';
	import MobileMenu from './MobileMenu.svelte';
	import MobileSearch from './MobileSearch.svelte';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { _ } from 'svelte-i18n';
	import { Skeleton } from '@/components/ui/skeleton';
	import { Input } from '@/components/ui/input';
	import { searchQuery } from '@/services/store';
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';
	import UserProfilePicture from '@/components/UserProfilePicture.svelte';

	interface Props {
		data: any;
		showSkeleton: boolean;
	}

	let { data, showSkeleton }: Props = $props();
	let searchOpen: boolean = $state(false);
	let mobileMenuOpen: boolean = $state(false);
	let mobileSearchRef: any = $state();
	let mobileMenuRef: any = $state();

	function isLinkCurrentPage(link: Link): boolean {
		return page.url.pathname === link.href;
	}

	function animateOnScroll(): boolean {
		// Don't animate on scroll for specific pages
		const noAnimatePaths = ['/my-list', '/browse', '/search'];
		return !noAnimatePaths.includes(page.url.pathname);
	}

	interface Link {
		label: string;
		href: string;
	}

	// Add admin link if user is admin
	let links = $derived.by(() => {
		const baseLinks = [
			{ label: 'navbar.home', href: '/' },
			{ label: 'navbar.shows', href: '/shows' },
			{ label: 'navbar.movies', href: '/movies' },
			{ label: 'navbar.my-list', href: '/my-list' },
			{ label: 'navbar.browse', href: '/browse' }
		];
		
		if (data?.user?.isAdmin) {
			return [
				...baseLinks,
				{ label: 'navbar.admin', href: '/admin' }
			];
		}
		
		return baseLinks;
	});

	// Track scroll position and direction
	let lastScrollY = $state(0);
	let isScrollingDown = $state(false);
	let scrolled = $state(false);

	$effect(() => {
		// Set up scroll listener
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			// Determine scroll direction
			isScrollingDown = currentScrollY > lastScrollY;

			// Show solid background when:
			// - Scrolled past 50px OR
			// - Scrolling up while not at top
			scrolled = currentScrollY > 50;

			lastScrollY = currentScrollY;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		// Clean up
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		searchQuery.set(event.currentTarget.value.trim());
		if ($searchQuery.length === 0) {
			// If search query is empty, reset results
			goto('/', { replaceState: true, noScroll: true, keepFocus: true });
			return;
		}

		// Update URL query param without reloading
		goto(`/search?q=${encodeURIComponent($searchQuery)}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<!-- Navbar -->
<nav
	class={`fixed top-0 z-50 flex max-h-16 w-full items-center justify-between px-4 py-4 text-white transition-colors duration-[1000ms] sm:px-6 lg:px-8
	${
			mobileMenuOpen
				? 'bg-[#141414]'
				: animateOnScroll()
					? (
						scrolled
							? 'bg-[#141414] bg-[linear-gradient(to_bottom,_rgba(0,0,0,1),_rgba(0,0,0,0))]'
							: 'bg-gradient-to-b from-[#141414] to-transparent transition-all duration-300'
					)
					: 'bg-[#141414]'
		}
  `}
>
	<div class="flex items-center space-x-4 sm:space-x-6 lg:space-x-10">
		<!-- Logo -->
		<a href="/" class="text-3xl font-bold text-red-600">
			<span class="sr-only">DatFlix</span>
			<Datflix size="sm" />
		</a>

		<!-- Navigation Links - Desktop Only -->
		{#if showSkeleton}
			<Skeleton class="hidden h-8 w-32 lg:flex" />
		{:else}
			<div class="hidden gap-4 lg:flex lg:gap-6">
				{#each links as link}
					<a
						href={link.href}
						class={cn(
							'text-white transition-colors hover:text-gray-300',
							isLinkCurrentPage(link) ? 'font-bold' : 'font-light'
						)}
					>
						<p class="text-sm">
							{$_(link.label)}
						</p>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Right Side Controls -->
	<div class="flex items-center gap-2 sm:gap-3 lg:gap-4">
		{#if showSkeleton}
			<Skeleton class="h-8 w-20" />
		{:else}
			<!-- Mobile Search Button -->
			<MobileSearch
				bind:this={mobileSearchRef}
				onSearchToggle={(isOpen) => {
					if (isOpen && mobileMenuOpen) {
						mobileMenuRef?.closeMenu();
					}
				}}
			/>

			<!-- Search - Hidden on mobile, visible on tablet+ -->
			<div class="relative hidden items-center sm:flex">
				<div class="overflow-hidden">
					<div
						class="relative flex w-[200px] items-center transition-all duration-500 lg:w-[250px]"
						style="left: {searchOpen ? '0' : '100%'};"
					>
						<span class="pointer-events-none absolute left-3 text-gray-400">
							<Search size={18} />
						</span>
						<input
							type="search"
							placeholder={$_('search.placeholder')}
							class="h-[32px] w-full bg-black/80 pl-10"
							oninput={handleInput}
							onfocusout={() => {
								if ($searchQuery === '') {
									searchOpen = false;
								}
							}}
						/>
					</div>
				</div>
				{#if !searchOpen}
					<div class="relative top-0">
						<button
							onclick={() => (searchOpen = !searchOpen)}
							class="flex cursor-pointer items-center justify-center bg-none p-2 text-white"
						>
							<Search size={20} />
						</button>
					</div>
				{/if}
			</div>

			<!-- Language Selector - Hidden on mobile -->
			<div class="hidden lg:block">
				<LanguageSelector />
			</div>
		{/if}

		{#if !page.data.user}
			{#if showSkeleton}
				<Skeleton class="h-8 w-20" />
			{:else}
				<!-- Sign In Button - Hidden on mobile -->
				<a href="/login" class="hidden lg:block">
					<Button
						variant="outline"
						class="border-white bg-transparent text-white hover:bg-white/10"
						size="sm"
					>
						{$_('auth.sign_in')}
					</Button>
				</a>
			{/if}
		{:else}
			{#if showSkeleton}
				<Skeleton class="h-8 w-8 rounded" />
			{:else}
				<!-- User Profile - Hidden on mobile -->
				<a
					href="/{data?.user?.username ? encodeURIComponent(data.user.username) : 'profile'}"
					title="View Profile"
					class="hidden lg:block"
				>
					<UserProfilePicture
						profilePicture={data?.user?.profilePicture}
						username={data?.user?.username}
						size="small"
						class="cursor-pointer transition-all hover:ring-2 hover:ring-white/20"
						alt="{data?.user?.username || 'Your'} profile"
					/>
				</a>
			{/if}

			{#if page.data.user}
				{#if showSkeleton}
					<Skeleton class="h-8 w-16" />
				{:else}
					<!-- Logout Button - Hidden on mobile -->
					<form action="/logout" method="POST" use:enhance class="hidden lg:block">
						<Button type="submit" size="sm">{$_('log_out')}</Button>
					</form>
				{/if}
			{/if}
		{/if}

		<!-- Mobile Menu Button -->
		{#if !showSkeleton}
			<MobileMenu
				bind:this={mobileMenuRef}
				links={links}
				currentPath={page.url.pathname}
				user={data?.user}
				onMenuToggle={(isOpen) => {
					mobileMenuOpen = isOpen;
					if (isOpen) {
						mobileSearchRef?.closeSearch();
					}
				}}
			/>
		{/if}
	</div>
</nav>

<style>
	/* Scroll indicator */
	.scroll-indicator {
		position: fixed;
		top: 0;
		left: 0;
		height: 4px;
		background: red;
		z-index: 100;
		transition: width 0.6s ease-out;
	}
</style>
