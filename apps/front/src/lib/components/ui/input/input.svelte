<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import type { WithElementRef } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { XCircle } from 'lucide-svelte';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined }) & {
				errors?: string[];
			}
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		errors = [],
		...restProps
	}: Props = $props();

	const hasErrors = $derived(errors && errors.length > 0);
</script>

{#if type === 'file'}
	<div class="space-y-1">
		<input
			bind:this={ref}
			class={cn(
				'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				hasErrors && 'border-red-500 focus-visible:ring-red-500',
				className
			)}
			type="file"
			bind:files
			bind:value
			{...restProps}
		/>
		{#if hasErrors}
			<div class="flex items-start space-x-2">
				<XCircle class="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
				<div class="space-y-1">
					{#each errors as error}
						<p class="text-sm text-red-500">{error}</p>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="space-y-1">
		<input
			bind:this={ref}
			class={cn(
				'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				hasErrors && 'border-red-500 focus-visible:ring-red-500',
				className
			)}
			{type}
			bind:value
			{...restProps}
		/>
		{#if hasErrors}
			<div class="space-y-1">
				{#each errors as error}
					<div class="flex items-center space-x-2">
						<XCircle class="h-4 w-4 flex-shrink-0 text-red-500" />
						<p class="text-sm text-red-500">{error}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
