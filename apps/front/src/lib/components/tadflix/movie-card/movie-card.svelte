<script lang="ts">
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getBackdropImage } from '@/services/api';
	import type { BackDropImage } from '@hypertube/shared';
	import { onMount } from 'svelte';

	let backgropImage: BackDropImage | null = $state(null);
	let isLoading = $state(true);

	interface Props {
		movieId: number;
		isVisible: boolean;
		title: string;
	}

	let { movieId, isVisible, title }: Props = $props();

	const loadBackdropImage = async (movieId: any, size: string): Promise<BackDropImage> => {
		const backdrop_image_data = await getBackdropImage(movieId, size);
		backgropImage = backdrop_image_data;
		return backdrop_image_data;
	};

	//add on change to isVisible

	$effect(() => {
		if (isVisible) {
			isLoading = true;
			loadBackdropImage(movieId, 'small')
				.catch((error) => {
					console.error('Error loading backdrop image:', error);
					backgropImage = null;
				})
				.finally(() => {
					isLoading = false;
				});
		}
	});
</script>

<Card
	class="flex aspect-[5/3] flex-row justify-end rounded-[2px] border-none p-0"
	style="background-size: cover; background-position: center; background-image: url({backgropImage?.url});"
>
	{#if isLoading}
		<div class="h-full w-full">
			<Skeleton class="h-full w-full rounded-[2px]" />
		</div>
	{:else if !backgropImage?.langFound}
		<CardHeader class="bg-opacity-50 bg-black p-4">
			<CardTitle>{title}</CardTitle>
		</CardHeader>
	{/if}
</Card>
