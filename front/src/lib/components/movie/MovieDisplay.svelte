<script lang="ts">
	import Button from "../ui/button/button.svelte";
	
	interface Props {
		title: string;
		description: string;
		backgroundUrl: string;
		rRate: number; //age limit
	}
	let { title, description, backgroundUrl, rRate}: Props = $props();
</script>


<div class="relative w-full">
	<img
		src={backgroundUrl}
		alt="movie-background"
		class="w-full h-auto object-contain"
	/>

	<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full pl-12">
		<div class="flex gap-5 text-white flex-col w-full">
			<span class="uppercase text-wrap text-7xl leading-14 font-extrabold md:max-w-44 text-center">{title}</span>
			<span class="md:max-w-[40%]">{description}</span>
			<div class="flex gap-2 justify-between relative w-full  ">
				<div class="flex gap-2">
					<Button class="bg-white">PLAY</Button>
					<Button class="bg-[#6D6D6EB3]">MORE INFO</Button>
				</div>
				{#if rRate}
				<div class="flex gap-5 items-center">
					<div>RE</div>
					<div class="bg-purple-300 text-nowrap pr-8 h-full flex pl-3 border-l-4 items-center">TV-{rRate}</div>

				</div>
				{/if}
			</div>
		</div>
	</div>
</div>