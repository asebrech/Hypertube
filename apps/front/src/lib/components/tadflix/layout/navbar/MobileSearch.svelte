<script lang="ts">
	import { Search, X } from 'lucide-svelte';
	import { _ } from 'svelte-i18n';
	import { searchQuery } from '@/services/store';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	let isOpen = $state(false);
	let inputElement = $state<HTMLInputElement>();

	function toggleSearch() {
		isOpen = !isOpen;
		if (isOpen) {
			// Focus the input after a short delay to allow the transition
			setTimeout(() => {
				inputElement?.focus();
			}, 100);
		} else {
			// Clear search when closing
			if ($searchQuery === '') {
				goto('/', { replaceState: true, noScroll: true, keepFocus: true });
			}
		}
	}

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		searchQuery.set(event.currentTarget.value.trim());
		if ($searchQuery.length === 0) {
			goto('/', { replaceState: true, noScroll: true, keepFocus: true });
			return;
		}

		goto(`/search?q=${encodeURIComponent($searchQuery)}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function handleClose() {
		isOpen = false;
		searchQuery.set('');
		goto('/', { replaceState: true, noScroll: true, keepFocus: true });
	}
</script>

<!-- Mobile Search Button -->
<button
	onclick={toggleSearch}
	class="flex items-center justify-center p-2 text-white sm:hidden"
	aria-label="Toggle search"
>
	<Search size={20} />
</button>

<!-- Mobile Search Overlay -->
{#if isOpen}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-x-0 top-16 z-40 bg-[#141414] p-4 shadow-lg sm:hidden"
	>
		<div class="relative flex items-center">
			<span class="pointer-events-none absolute left-3 text-gray-400">
				<Search size={18} />
			</span>
			<input
				bind:this={inputElement}
				type="search"
				placeholder={$_('search.placeholder')}
				class="h-[40px] w-full rounded-md bg-black/80 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
				oninput={handleInput}
				value={$searchQuery}
			/>
			<button
				onclick={handleClose}
				class="absolute right-2 flex items-center justify-center p-2 text-gray-400 hover:text-white"
				aria-label="Close search"
			>
				<X size={20} />
			</button>
		</div>
	</div>
{/if}
