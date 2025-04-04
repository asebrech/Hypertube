<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';

	const getRandomNumber = () => Math.floor(Math.random() * 30) + 1;
</script>

{#each Array(15) as _, i (i)}
	<div class="mb-8">
		<h2 class="mb-4 ml-4 text-xl font-bold">Carousel {i + 1}</h2>
		<Carousel.Root
			opts={{
				align: 'start',
				loop: true
			}}
		>
			<Carousel.Content>
				{#each Array(getRandomNumber()) as _, j (j)}
					<Carousel.Item class="basis-auto pl-1">
						<div class="p-1">
							<Card.Root>
								<Card.Content class="h-45 w-75 flex aspect-square items-center justify-center p-6">
									<span class="text-2xl font-semibold">{j + 1}</span>
								</Card.Content>
							</Card.Root>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<!-- <Carousel.Previous /> -->
			<!-- <Carousel.Next /> -->
		</Carousel.Root>
	</div>
{/each}
