<script lang="ts">
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getBackdropImage } from '@/services/api';
	import type { BackDropImage, ImageSizeType, MovieType } from '@hypertube/shared';

	let backdropImage: BackDropImage | null = $state(null);
	let isLoading = $state(true);

	interface Props {
		movieId: number;
		isVisible: boolean;
		title: string;
		type: MovieType | undefined;
	}

	let { movieId, isVisible, title, type }: Props = $props();

	const loadBackdropImage = async (movieId: any, size: ImageSizeType): Promise<BackDropImage> => {
		const backdrop_image_data = await getBackdropImage(movieId, size, type);
		backdropImage = backdrop_image_data;
		return backdrop_image_data;
	};

	//add on change to isVisible

	$effect(() => {
		if (isVisible) {
			isLoading = true;
			loadBackdropImage(movieId, 'small')
				.catch((error) => {
					console.error('Error loading backdrop image:', error);
					backdropImage = null;
				})
				.finally(() => {
					isLoading = false;
				});
		}
	});
</script>

<Card
	class="flex aspect-[5/3] flex-row rounded-[2px] border-none p-0"
	style="background-size: cover; background-position: center; background-image: url({backdropImage?.url});"
>
	{#if isLoading}
		<div class="h-full w-full">
			<Skeleton class="h-full w-full rounded-[2px]" />
		</div>
	{:else if !backdropImage?.langFound}
		<CardHeader class="bg-black bg-opacity-50 p-4">
			<CardTitle>{title}</CardTitle>
		</CardHeader>
	{/if}
</Card>
