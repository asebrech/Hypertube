<script lang="ts">
	import { cn } from '$lib/utils.js';

	interface Props {
		checked?: boolean;
		disabled?: boolean;
		name?: string;
		value?: string;
		onclick?: (event: MouseEvent) => void;
		onchange?: (checked: boolean) => void;
		class?: string;
	}

	let {
		checked = false,
		disabled = false,
		name,
		value,
		onclick,
		onchange,
		class: className,
		...restProps
	}: Props = $props();

	function handleClick(event: MouseEvent) {
		if (disabled) return;
		
		checked = !checked;
		onclick?.(event);
		onchange?.(checked);
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	data-state={checked ? 'checked' : 'unchecked'}
	{disabled}
	{...restProps}
	class={cn(
		'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
		checked ? 'bg-primary' : 'bg-input',
		className
	)}
	onclick={handleClick}
>
	<span
		class={cn(
			'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
			checked ? 'translate-x-5' : 'translate-x-0'
		)}
	></span>
</button>

<!-- Hidden input for form submission -->
{#if name}
	<input type="hidden" {name} {value} {checked} />
{/if}