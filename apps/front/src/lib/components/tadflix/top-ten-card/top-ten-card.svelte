<script lang="ts">
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getPosterImage } from '@/services/api';
	import type { BackDropImage } from '@hypertube/shared';

	export let movie_id: number;
	export let isVisible: boolean;
	export let title: string;
	let poster_image: BackDropImage | null = null;
	let isLoading = true;

	const loadPosterImage = async (movieId: any, size: string): Promise<BackDropImage> => {
		console.log('Loading poster image for movieId:', movieId, 'with size:', size);
		const poster_image_data = await getPosterImage(movieId, size);
		poster_image = poster_image_data;
		return poster_image_data;
	};

	//add on change to isVisible
	$: if (isVisible) {
		isLoading = true;
		loadPosterImage(movie_id, 'small')
			.catch((error) => {
				console.error('Error loading backdrop image:', error);
				poster_image = null;
			})
			.finally(() => {
				isLoading = false;
			});
	}
</script>

<Card
	class="jystify-end flex aspect-[5/3] flex-row rounded-[2px] border-none p-0"
	style="background-size: cover; background-position: center; background-image: url({poster_image?.url});"
>
	{#if isLoading}
		<div class="h-full w-full">
			<Skeleton class="h-full w-full rounded-[2px]" />
		</div>
	{:else if !poster_image?.langFound}
		<CardHeader class="bg-black bg-opacity-50 p-4">
			<CardTitle>{title}</CardTitle>
		</CardHeader>
	{/if}
</Card>
