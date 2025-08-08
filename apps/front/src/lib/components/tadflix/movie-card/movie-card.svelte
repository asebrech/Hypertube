<script lang="ts">
	import { Badge } from '@/components/ui/badge';
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getBackdropImage } from '@/services/api';
	import type { BackDropImage, ImageSizeType, MovieType } from '@hypertube/shared';
	import { _ } from 'svelte-i18n';

	let backdropImage: BackDropImage | null = $state(null);
	let isLoading = $state(true);

	interface Props {
		movieId: number;
		isVisible: boolean;
		title: string;
		type: MovieType | undefined;
		isWatched?: boolean;
		isBookmarked?: boolean;
	}

	let { movieId, isVisible, title, type, isWatched = false, isBookmarked = false }: Props = $props();

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
					backdropImage = {
						aspect_ratio: 0,
						height: 0,
						width: 0,
						iso_639_1: '',
						file_path: '',
						vote_average: 0,
						vote_count: 0,
						url: '/img/default-backdrop2.png',
						langFound: false
					};
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
	{#if isWatched && isBookmarked}
		<div class="absolute bottom-0 flex w-full justify-center p-[3px]">
			<Badge variant={'red'}>
				{$_('movie-action.watched')} & {$_('movie-action.bookmarked')}
			</Badge>
		</div>
	{:else if isWatched}
		<div class="absolute bottom-0 flex w-full justify-center p-[3px]">
			<Badge variant={'red'}>
				{$_('movie-action.watched')}
			</Badge>
		</div>
	{:else if isBookmarked}
		<div class="absolute bottom-0 flex w-full justify-center p-[3px]">
			<Badge variant={'red'}>
				{$_('movie-action.bookmarked')}
			</Badge>
		</div>
	{/if}
</Card>
