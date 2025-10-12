<script lang="ts">
	import { Badge } from '@/components/ui/badge';
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getBackdropImage } from '@/services/api';
	import { movieModalActions } from '@/services/store';
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
		isAvailable?: boolean;
		watchProgressSeconds?: number;
		data: { token: string };
	}

	let {
		movieId,
		isVisible,
		title,
		type,
		isWatched = false,
		isAvailable = true,
		watchProgressSeconds = 0,
		data,
	}: Props = $props();

	const loadBackdropImage = async (movieId: any, size: ImageSizeType): Promise<BackDropImage> => {
		let backdrop_image_data = await getBackdropImage(movieId, size, type, data.token);
		if (!backdrop_image_data) {
			backdrop_image_data = {
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
		}
		backdropImage = backdrop_image_data;
		return backdrop_image_data;
	};

	//add on change to isVisible

	$effect(() => {
		if (isVisible) {
			isLoading = true;
			loadBackdropImage(movieId, 'small')
				.catch((error) => {
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

	function openModal() {
		if (type) {
			movieModalActions.open(movieId, type);
		}
	}
</script>

<Card
	class="relative flex aspect-[5/3] cursor-pointer flex-row rounded-[2px] border-none p-0 transition-transform duration-200 hover:scale-105"
	style="background-size: cover; background-position: center; background-image: url({backdropImage?.url});"
	onclick={openModal}
>
	{#if isLoading}
		<div class="h-full w-full">
			<Skeleton class="h-full w-full rounded-[2px]" />
		</div>
	{:else if !backdropImage?.langFound}
		<CardHeader class="relative z-10 flex h-full items-end p-2 sm:p-4">
			<CardTitle class="text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">{title}</CardTitle>
		</CardHeader>
	{/if}
	{#if !isAvailable}
		<div class="absolute bottom-0 flex w-full justify-center">
			<Badge variant={'red'}>
				{$_('movie-action.not-available')}
			</Badge>
		</div>
	{:else if isWatched}
		<div class="absolute bottom-0 flex w-full justify-center">
			<Badge variant={'red'}>
				{$_('movie-action.watched')}
			</Badge>
		</div>
	{:else if watchProgressSeconds > 0}
		<div class="absolute bottom-0 flex w-full justify-center">
			<Badge variant={'red'}>
				{$_('movie-action.resume')}
			</Badge>
		</div>
	{/if}
</Card>
