<script lang="ts">
	import { onMount } from 'svelte';
	import Datflix from '@/assets/datflix.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '@/utils';
	import LanguageSelector from '../LanguageSelector.svelte';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { _ } from 'svelte-i18n';
	import { Skeleton } from '@/components/ui/skeleton';
	import { Input } from '@/components/ui/input';
	import { searchQuery } from '@/services/store';
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';

	interface Props {
		data: any;
		showSkeleton?: boolean;
	}

	let { data, showSkeleton = false }: Props = $props();
	let searchOpen: boolean = $state(false);

	function isLinkCurrentPage(link: Link): boolean {
		return page.url.pathname === link.href;
	}

	interface Link {
		label: string;
		href: string;
	}

	let links: Link[] = [
		{ label: 'navbar.home', href: '/' },
		{ label: 'navbar.shows', href: '/shows' },
		{ label: 'navbar.movies', href: '/movies' },
		{ label: 'navbar.my-list', href: '/my-list' },
		{ label: 'navbar.browse', href: '/browse' }
	];

	// Track scroll position and direction
	let lastScrollY = $state(0);
	let isScrollingDown = $state(false);
	let scrolled = $state(false);

	onMount(() => {
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
	class={`fixed top-0 z-50 flex max-h-16 w-full items-center justify-between px-8 py-4 text-white transition-colors duration-[1000ms]
    ${
			scrolled
				? 'bg-black bg-[linear-gradient(to_bottom,_rgba(0,0,0,1),_rgba(0,0,0,0))]'
				: 'bg-gradient-to-b from-black to-transparent transition-all duration-300'
		}
  `}
>
	<div class="flex items-center space-x-10">
		<!-- Logo -->
		<a href="/" class="mr-8 text-3xl font-bold text-red-600">
			<span class="sr-only">DatFlix</span>
			<Datflix size="sm" />
		</a>

		<!-- Navigation Links -->
		{#if showSkeleton}
			<Skeleton class="flex h-8 w-32" />
		{:else}
			<div class="hidden gap-6 md:flex">
				{#each links as link}
					<a
						href={link.href}
						class={cn(
							'text-white transition-colors hover:text-gray-300',
							isLinkCurrentPage(link) ? 'font-bold' : 'font-light'
						)}
					>
						<p class="text-[12px]">
							{$_(link.label)}
						</p>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Right Side Controls -->
	<div class="flex items-center gap-4">
		{#if showSkeleton}
			<Skeleton class="h-8 w-20" />
		{:else}
			<div class="relative flex items-center">
				<div class="overflow-hidden">
					<div
						class="relative flex w-[250px] items-center transition-all duration-500"
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
			<div>
				<LanguageSelector />
			</div>
		{/if}

		{#if !page.data.user}
			<a href="/login">
				<Button variant="outline" class="border-white bg-transparent text-white hover:bg-white/10">
					{$_('auth.sign_in')}
				</Button>
			</a>
		{:else}
			{#if showSkeleton}
				<Skeleton class="h-8 w-8 rounded" />
			{:else}
				<a href="/account">
					<div
						class="flex h-8 w-8 items-center justify-center rounded bg-red-500 font-bold uppercase text-white"
					>
						:)
					</div>
				</a>
			{/if}

			{#if page.data.user}
				{#if showSkeleton}
					<Skeleton class="h-8 w-16" />
				{:else}
					<form action="/logout" method="POST" use:enhance>
						<Button type="submit">{$_('log_out')}</Button>
					</form>
				{/if}
			{/if}
		{/if}
	</div>
</nav>

<style>
	/* Smooth transitions */
	#navbar {
		transition:
			background-color 0.4s ease,
			box-shadow 0.4s ease;
	}

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
