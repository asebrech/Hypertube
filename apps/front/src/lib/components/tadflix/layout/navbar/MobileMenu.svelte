<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { cn } from '@/utils';
	import { Menu, X } from 'lucide-svelte';
	import { scale, fade } from 'svelte/transition';
	import { Button } from '@/components/ui/button';
	import { enhance } from '$app/forms';
	import UserProfilePicture from '@/components/UserProfilePicture.svelte';
	import LanguageSelector from '../LanguageSelector.svelte';

	interface Link {
		label: string;
		href: string;
	}

	interface Props {
		links: Link[];
		currentPath: string;
		user: any;
		onMenuToggle?: (isOpen: boolean) => void;
	}

	let { links, currentPath, user, onMenuToggle }: Props = $props();
	let isOpen = $state(false);

	function toggleMenu() {
		isOpen = !isOpen;
		onMenuToggle?.(isOpen);
	}

	function closeMenu() {
		isOpen = false;
		onMenuToggle?.(false);
	}

	function isLinkCurrentPage(link: Link): boolean {
		return currentPath === link.href;
	}
</script>

<!-- Mobile Menu Button -->
<button
	onclick={toggleMenu}
	class="flex items-center justify-center p-2 text-white md:hidden"
	aria-label="Toggle menu"
>
	{#if isOpen}
		<X size={24} />
	{:else}
		<Menu size={24} />
	{/if}
</button>

<!-- Mobile Menu Overlay -->
{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 top-16 z-40 bg-black/95 md:hidden"
		onclick={closeMenu}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex h-full flex-col overflow-y-auto p-6"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- User Profile Section (if logged in) -->
			{#if user}
				<div class="mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
					<a
						href="/{user?.username ? encodeURIComponent(user.username) : 'profile'}"
						onclick={closeMenu}
					>
						<UserProfilePicture
							profilePicture={user?.profilePicture}
							username={user?.username}
							size="medium"
							class="cursor-pointer transition-all hover:ring-2 hover:ring-white/20"
							alt="{user?.username || 'Your'} profile"
						/>
					</a>
					<div class="flex flex-col">
						<span class="text-lg font-semibold text-white">{user?.username || 'User'}</span>
						<a
							href="/{user?.username ? encodeURIComponent(user.username) : 'profile'}"
							class="text-sm text-gray-400 hover:text-white"
							onclick={closeMenu}
						>
							View profile
						</a>
					</div>
				</div>
			{/if}

			<!-- Navigation Links -->
			<nav class="mb-8 flex flex-col space-y-1">
				{#each links as link}
					<a
						href={link.href}
						onclick={closeMenu}
						class={cn(
							'rounded-lg px-4 py-3 text-lg transition-colors',
							isLinkCurrentPage(link)
								? 'bg-red-600/20 font-bold text-white'
								: 'font-light text-gray-300 hover:bg-white/10 hover:text-white'
						)}
					>
						{$_(link.label)}
					</a>
				{/each}
			</nav>

			<!-- Language Selector -->
			<div class="mb-6 border-t border-white/10 pt-6">
				<div class="mb-2 text-sm font-semibold text-gray-400">Language</div>
				<LanguageSelector />
			</div>

			<!-- Auth Actions -->
			<div class="mt-auto border-t border-white/10 pt-6">
				{#if !user}
					<a href="/login" onclick={closeMenu} class="block w-full">
						<Button
							variant="outline"
							class="w-full border-white bg-transparent text-white hover:bg-white/10"
						>
							{$_('auth.sign_in')}
						</Button>
					</a>
				{:else}
					<form action="/logout" method="POST" use:enhance>
						<Button type="submit" class="w-full">
							{$_('log_out')}
						</Button>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}
