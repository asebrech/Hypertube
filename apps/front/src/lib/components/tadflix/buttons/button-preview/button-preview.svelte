<script lang="ts" module>
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';
	import { Button } from '$lib/components/ui/button';

	export const buttonVariants = tv({
		base: 'rounded-full',
		variants: {
			variant: {
				outline:
					'text-secondary-foreground bg-secondary/50 hover:bg-secondary hover:text-accent-foreground border border-[2px] border-white/50 hover:border-white',
				filled: 'bg-primary text-primary-foreground hover:bg-primary/80'
			},
			size: {
				default: 'w-[36px] h-[36px]'
			}
		},
		defaultVariants: {
			variant: 'outline',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		variant = 'outline',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		children,
		...restProps
	}: ButtonProps = $props();
</script>

<Button class={cn(buttonVariants({ variant, size }), className)} {href} {...restProps}>
	{@render children?.()}
</Button>
