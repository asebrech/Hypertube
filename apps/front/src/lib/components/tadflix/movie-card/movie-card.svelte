<script lang="ts">
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getBackdropImage } from '@/services/api';
	import type { BackDropImage } from '@hypertube/shared';

	export let movie_id: number;
	export let isVisible: boolean;
	export let title: string;
	let backdrop_image: BackDropImage | null = null;
	let isLoading = true;

	const loadBackdropImage = async (movieId: any, size: string): Promise<BackDropImage> => {
		const backdrop_image_data = await getBackdropImage(movieId, size);
		backdrop_image = backdrop_image_data;
		return backdrop_image_data;
	};

	//add on change to isVisible
	$: if (isVisible) {
		isLoading = true;
		loadBackdropImage(movie_id, 'small')
			.catch((error) => {
				console.error('Error loading backdrop image:', error);
				backdrop_image = null;
			})
			.finally(() => {
				isLoading = false;
			});
	}
</script>

<Card
	class="jystify-end flex aspect-[5/3] flex-row rounded-[2px] border-none p-0"
	style="background-size: cover; background-position: center; background-image: url({backdrop_image?.url});"
>
	{#if isLoading}
		<div class="h-full w-full">
			<Skeleton class="h-full w-full rounded-[2px]" />
		</div>
	{:else if !backdrop_image?.langFound}
		<CardHeader class="bg-black bg-opacity-50 p-4">
			<CardTitle>{title}</CardTitle>
		</CardHeader>
	{/if}
</Card>
