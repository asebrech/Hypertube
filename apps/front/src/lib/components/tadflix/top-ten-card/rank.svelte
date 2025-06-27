<script lang="ts">
	import * as RankIcons from './rank-icon';

	export let orderNumber: number;
</script>

{#if orderNumber === 1}
	<RankIcons.Rank1 />
{:else if orderNumber === 2}
	<RankIcons.Rank2 />
{:else if orderNumber === 3}
	<RankIcons.Rank3 />
{:else if orderNumber === 4}
	<RankIcons.Rank4 />
{:else if orderNumber === 5}
	<RankIcons.Rank5 />
{:else if orderNumber === 6}
	<RankIcons.Rank6 />
{:else if orderNumber === 7}
	<RankIcons.Rank7 />
{:else if orderNumber === 8}
	<RankIcons.Rank8 />
{:else if orderNumber === 9}
	<RankIcons.Rank9 />
{:else if orderNumber === 10}
	<RankIcons.Rank10 />
{/if}
