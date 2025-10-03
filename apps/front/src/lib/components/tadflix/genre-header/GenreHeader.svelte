<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		genreId: number;
		genreName: string;
		class?: string;
	}

	let { genreId, genreName, class: className = '' }: Props = $props();
</script>

<div class={`mx-[10%] sm:mx-[10.714%] md:mx-[8.333%] lg:mx-[6.818%] xl:mx-[5.769%] ${className}`}>
	<a
		href={`/browse?genre=${genreId}`}
		class="group flex w-fit flex-row items-center gap-2 text-xs font-normal text-white/80 transition-colors hover:text-white sm:text-sm lg:text-lg"
	>
		<div>{genreName}</div>
		<div class="relative flex items-center overflow-hidden text-[#54b9c5]">
			<span
				class="ml-1 inline-block max-w-0 overflow-hidden text-xs font-light whitespace-nowrap text-[#54b9c5] opacity-0 transition-all duration-1000 group-hover:max-w-[200px] group-hover:translate-y-0 group-hover:opacity-100"
			>
				{$_('browse.explore')}
			</span>
			<ChevronRight
				size={12}
				class="inline-block transform opacity-0 transition-all duration-1000 group-hover:translate-x-1 group-hover:opacity-100"
			/>
		</div>
	</a>
</div>