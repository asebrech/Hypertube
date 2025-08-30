<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from "$lib/utils.js";
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
				"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-10",
				hasErrors && 'border-red-500 focus-visible:ring-red-500',
				className
			)}
			{...restProps}
		/>
		<button
			type="button"
			class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
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
		<div class="flex items-start space-x-2">
			<XCircle class="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
			<div class="space-y-1">
				{#each errors as error}
					<p class="text-sm text-red-500">{error}</p>
				{/each}
			</div>
		</div>
	{/if}
</div>
