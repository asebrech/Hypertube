<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import { _ } from 'svelte-i18n';
	let { form } = $props();
</script>

<Card.Root class="mx-auto max-w-sm border-none bg-black/70">
	<Card.Header>
		<Card.Title class="text-2xl">{$_('auth.forgot_password.title')}</Card.Title>
		<Card.Description>{$_('auth.forgot_password.description')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			{#if form?.success}
				<div class="p-4 rounded bg-gray-900/40 border border-gray-700/50">
					<p class="text-gray-200 text-sm mb-2">{$_('auth.forgot_password.email_sent')}</p>
					<p class="text-gray-300 text-sm mb-1">
						{$_('auth.forgot_password.email_sent_message')}
					</p>
					<p class="text-gray-500 text-xs">{$_('auth.forgot_password.link_expires')}</p>
					
					{#if form?.resetUrl}
						<div class="mt-3 p-2 bg-blue-900/15 rounded text-xs text-gray-400">
							<p class="mb-1">Dev: {form.devNote}</p>
							<a href={form.resetUrl} class="text-blue-300 underline break-all">{form.resetUrl}</a>
						</div>
					{/if}
				</div>
				<div class="text-center">
					<a href="/login" class="text-sm underline text-gray-400 hover:text-white transition-colors duration-200">{$_('auth.forgot_password.back_to_login')}</a>
				</div>
			{:else}
				<form action="?/forgotPassword" method="POST" use:enhance>
					<div class="grid gap-4">
						{#if form?.error}
							<p class="error text-red-500 text-sm">{$_('auth.forgot_password.error_general')}</p>
						{/if}
						{#if form?.invalid}
							<p class="error text-red-500 text-sm">{$_('auth.forgot_password.error_invalid_email')}</p>
						{/if}
						<div class="grid gap-2">
							<Label for="email">{$_('auth.forgot_password.email_label')}</Label>
							<Input id="email" type="email" name="email" placeholder={$_('auth.forgot_password.email_placeholder')} required />
						</div>
						<Button type="submit" class="w-full">{$_('auth.forgot_password.send_button')}</Button>
					</div>
				</form>
				<div class="mt-4 text-center text-sm">
					{$_('auth.forgot_password.remember_password')}
					<a href="/login" class="underline">{$_('auth.forgot_password.back_to_login')}</a>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>


