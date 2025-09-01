<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { Eye, EyeOff, XCircle } from 'lucide-svelte';

	type Props = Omit<HTMLInputAttributes, 'type'> & {
		id: string;
		name: string;
		errors?: string[];
	};

	let {
		id,
		name,
		value = $bindable(''),
		placeholder = '',
		autocomplete = 'current-password',
		required = false,
		disabled = false,
		errors = [],
		class: className,
		...restProps
	}: Props = $props();

	let showPassword = $state(false);
	const hasErrors = $derived(errors && errors.length > 0);

	const togglePasswordVisibility = () => {
		showPassword = !showPassword;
	};
</script>

<div class="space-y-1">
	<div class="relative">
		<input
			{id}
			{name}
			bind:value
			type={showPassword ? 'text' : 'password'}
			{placeholder}
			{autocomplete}
			{required}
			{disabled}
			class={cn(
				'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pr-10 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				hasErrors && 'border-red-500 focus-visible:ring-red-500',
				className
			)}
			{...restProps}
		/>
		<button
			type="button"
			class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
			onclick={togglePasswordVisibility}
			aria-label={showPassword ? 'Hide password' : 'Show password'}
		>
			{#if showPassword}
				<EyeOff class="h-4 w-4" />
			{:else}
				<Eye class="h-4 w-4" />
			{/if}
		</button>
	</div>
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
