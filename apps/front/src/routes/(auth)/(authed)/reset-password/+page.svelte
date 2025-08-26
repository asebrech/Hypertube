<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	
	let { data, form } = $props();
	
	$effect(() => {
		if (form?.success) {
			setTimeout(() => goto('/login'), 3000);
		}
	});
</script>

<Card.Root class="mx-auto max-w-sm border-none bg-black/70">
	<Card.Header>
		<Card.Title class="text-2xl">{$_('auth.reset_password.title')}</Card.Title>
		<Card.Description>{$_('auth.reset_password.description')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			{#if form?.success}
				<div class="p-4 rounded bg-gray-900/40 border border-gray-700/50">
					<p class="text-gray-200 text-sm mb-1">{$_('auth.reset_password.success_message')}</p>
					<p class="text-gray-500 text-xs">{$_('auth.reset_password.redirect_message')}</p>
				</div>
				<div class="text-center">
					<a href="/login" class="text-sm underline text-gray-400 hover:text-white transition-colors duration-200">{$_('auth.reset_password.go_to_login')}</a>
				</div>
			{:else}
				<form action="?/resetPassword" method="POST" use:enhance>
					<div class="grid gap-4">
						<input type="hidden" name="token" value={data.token} />
						{#if form?.error || form?.invalid}
							<p class="error text-red-500 text-sm">{form?.message || $_('auth.reset_password.error_message')}</p>
						{/if}
						<div class="grid gap-2">
							<Label for="password">{$_('auth.reset_password.new_password_label')}</Label>
							<Input 
								id="password" 
								type="password" 
								name="password" 
								autocomplete="new-password"
								required 
							/>
							<p class="text-xs text-gray-500">
								{$_('auth.reset_password.password_requirements')}
							</p>
						</div>
						<div class="grid gap-2">
							<Label for="confirmPassword">{$_('auth.reset_password.confirm_password_label')}</Label>
							<Input 
								id="confirmPassword" 
								type="password" 
								name="confirmPassword" 
								autocomplete="new-password"
								required 
							/>
						</div>
						<Button type="submit" class="w-full">{$_('auth.reset_password.reset_button')}</Button>
					</div>
				</form>
				<div class="mt-4 text-center text-sm">
					{$_('auth.reset_password.remember_password')}
					<a href="/login" class="underline">{$_('auth.reset_password.back_to_login')}</a>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
