<script lang="ts">
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getPosterImage } from '@/services/api';
	import type { BackDropImage, ImageSizeType, MovieType, UserMovieAction } from '@hypertube/shared';
	import Rank from './rank.svelte';
	import { Badge } from '@/components/ui/badge';
	import { _ } from 'svelte-i18n';

	export let movieId: number;
	export let isVisible: boolean;
	export let orderNumber: number;
	export let userAction: UserMovieAction | null = null;
	export let type: MovieType = 'movie';

	let poster_image: BackDropImage | null = null;
	let isLoading = true;

	const loadPosterImage = async (movieId: any, size: ImageSizeType): Promise<BackDropImage> => {
		console.log('Loading poster image for movieId:', movieId, 'with size:', size);
		const poster_image_data = await getPosterImage(movieId, size, type);
		poster_image = poster_image_data;
		return poster_image_data;
	};

	//add on change to isVisible
	$: if (isVisible) {
		isLoading = true;
		loadPosterImage(movieId, 'small')
			.catch((error) => {
				console.error('Error loading backdrop image:', error);
				poster_image = {
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
</script>

<Card class="flex aspect-[9/7] flex-row rounded-[2px] border-none bg-transparent">
	<div class="relative inline-block h-full w-full font-bold">
		<div class="absolute left-0 top-0 h-full w-[50%]">
			<Rank {orderNumber} />
		</div>
		{#if isLoading}
			<Skeleton class="absolute right-0 top-0 h-full w-[50%]" />
		{:else}
			<div
				class="absolute right-0 top-0 h-full w-[50%]"
				style="background-size: cover; background-position: center; background-image: url({poster_image?.url});"
			>
				{#if userAction}
					<div class="absolute bottom-0 flex w-full justify-center">
						<Badge variant={'red'}>
							{$_(`movie-action.${userAction}`)}
						</Badge>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</Card>
