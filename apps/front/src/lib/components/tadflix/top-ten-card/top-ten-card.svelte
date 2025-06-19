<script lang="ts">
	import { Card, CardHeader, CardTitle } from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
	import { getPosterImage } from '@/services/api';
	import type { BackDropImage } from '@hypertube/shared';
	import Rank from './rank.svelte';

	export let movie_id: number;
	export let isVisible: boolean;
	export let title: string;
	export let orderNumber: number;

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

<Card class="flex aspect-[5/4] flex-row rounded-[2px] border-none bg-transparent p-1">
	<div class="relative inline-block h-full w-full font-bold">
		<div class="absolute left-0 top-0 h-full w-[50%]">
			<Rank {orderNumber} />
		</div>
		<div
			class="absolute right-0 top-0 h-full w-[50%]"
			style="background-size: cover; background-position: center; background-image: url({poster_image?.url});"
		></div>
	</div>
</Card>
