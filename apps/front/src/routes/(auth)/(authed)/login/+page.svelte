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
			<Card.Title class="text-2xl">{$_('auth.login.title')}</Card.Title>
			<Card.Description>{$_('auth.login.description')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4">
				<form action="?/login" method="POST" use:enhance>
					<div class="grid gap-4">
						<div class="grid gap-2">
							{#if form?.credentials}
								<p class="error">{$_('auth.login.error_credentials')}</p>
							{/if}
							<Label for="email">{$_('auth.login.email_label')}</Label>
							<Input id="email" type="email" name="email" placeholder={$_('auth.login.email_placeholder')} required />
						</div>
						<div class="grid gap-2">
							<div class="flex items-center">
								<Label for="password">{$_('auth.login.password_label')}</Label>
								<a href="/forgot-password" class="ml-auto inline-block text-sm underline">
									{$_('auth.login.forgot_password')}
								</a>
							</div>
							<Input id="password" type="password" name="password" required />
						</div>
						<Button type="submit" class="w-full">{$_('auth.login.login_button')}</Button>
					</div>
				</form>
				<form method="POST" action="/login/google" use:enhance>
					<Button variant="outline" class="w-full" type="submit">{$_('auth.login.login_with_google')}</Button>
				</form>
				<form method="POST" action="/login/github" use:enhance>
					<Button variant="outline" class="w-full" type="submit">{$_('auth.login.login_with_github')}</Button>
				</form>
				<form method="POST" action="/login/fortyTwo" use:enhance>
					<Button variant="outline" class="w-full" type="submit">{$_('auth.login.login_with_42')}</Button>
				</form>
			</div>
			<div class="mt-4 text-center text-sm">
				{$_('auth.login.no_account')}
				<a href="/register" class="underline">{$_('auth.login.sign_up_link')}</a>
			</div>
		</Card.Content>
	</Card.Root>
