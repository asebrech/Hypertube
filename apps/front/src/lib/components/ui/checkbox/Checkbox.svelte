<script lang="ts">
	import { Check } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	interface CheckboxProps {
		id?: string;
		name?: string;
		checked?: boolean;
		disabled?: boolean;
		class?: string;
		onCheckedChange?: (checked: boolean) => void;
	}

	let {
		id,
		name,
		checked = $bindable(false),
		disabled = false,
		class: className = '',
		onCheckedChange,
		...restProps
	}: CheckboxProps = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		checked = target.checked;
		onCheckedChange?.(checked);
	}
</script>

<div class="relative flex items-center">
	<input
		{id}
		{name}
		type="checkbox"
		bind:checked
		{disabled}
		onchange={handleChange}
		class={cn(
			'peer h-4 w-4 shrink-0 rounded border-1 border-gray-400 bg-white',
			'focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:outline-none',
			'disabled:cursor-not-allowed disabled:opacity-50',
			'checked:border-gray-400 checked:bg-white',
			'transition-colors hover:border-gray-300',
			'cursor-pointer appearance-none',
			className
		)}
		data-state={checked ? 'checked' : 'unchecked'}
		{...restProps}
	/>
	{#if checked}
		<Check class="pointer-events-none absolute top-0 left-0 h-4 w-4 stroke-[3] p-0.5 text-black" />
	{/if}
</div>
