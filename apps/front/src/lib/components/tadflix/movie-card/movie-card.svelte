<script lang="ts">
	import { Badge } from '@/components/ui/badge';
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getBackdropImage } from '@/services/api';
	import type { BackDropImage, ImageSizeType, MovieType, UserMovieAction } from '@hypertube/shared';

	let backdropImage: BackDropImage | null = $state(null);
	let isLoading = $state(true);

	interface Props {
		movieId: number;
		isVisible: boolean;
		title: string;
		type: MovieType;
		userAction?: UserMovieAction | null;
	}

	let { movieId, isVisible, title, type, userAction }: Props = $props();

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
	{#if userAction}
		<div class="absolute bottom-0 flex w-full justify-center p-[3px]">
			<Badge variant={'red'}>
				{userAction}
			</Badge>
		</div>
	{/if}
</Card>
