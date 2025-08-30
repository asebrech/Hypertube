<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { PasswordInput } from '$lib/components/ui/password-input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import { _ } from 'svelte-i18n';
	import { siGoogle, siGithub, si42 } from 'simple-icons';
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
							<PasswordInput id="password" name="password" required />
						</div>
						<Button type="submit" class="w-full">{$_('auth.login.login_button')}</Button>
					</div>
				</form>
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<span class="w-full border-t border-gray-600"></span>
					</div>
					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-black px-2 text-gray-400">OR</span>
					</div>
				</div>
				
				<div class="grid gap-3">
					<form method="POST" action="/login/google" use:enhance>
						<Button variant="outline" class="w-full bg-white hover:bg-gray-100 text-black hover:text-black border-gray-300 font-semibold" type="submit">
							<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
								<path d={siGoogle.path} />
							</svg>
							{$_('auth.login.login_with_google')}
						</Button>
					</form>
					<form method="POST" action="/login/github" use:enhance>
						<Button variant="outline" class="w-full bg-gray-900 hover:bg-gray-800 text-white border-gray-700 font-semibold" type="submit">
							<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
								<path d={siGithub.path} />
							</svg>
							{$_('auth.login.login_with_github')}
						</Button>
					</form>
					<form method="POST" action="/login/fortyTwo" use:enhance>
						<Button variant="outline" class="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white border-none font-semibold" type="submit">
							<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
								<path d={si42.path} />
							</svg>
							{$_('auth.login.login_with_42')}
						</Button>
					</form>
				</div>
			</div>
			<div class="mt-4 text-center text-sm">
				{$_('auth.login.no_account')}
				<a href="/register" class="underline">{$_('auth.login.sign_up_link')}</a>
			</div>
		</Card.Content>
	</Card.Root>
