<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { PasswordInput } from '$lib/components/ui/password-input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { ErrorAlert } from '$lib/components/ui/error-alert/index.js';
	import {
		GoogleButton,
		GithubButton,
		FortyTwoButton
	} from '$lib/components/ui/oauth-buttons/index.js';
	import { enhance } from '$app/forms';
	import { _ } from 'svelte-i18n';

	interface LoginForm {
		credentials?: boolean;
		identifierNotFound?: boolean;
		invalidPassword?: boolean;
		invalid?: boolean;
		identifier?: string;
	}

	let { form }: { form: LoginForm | null } = $props();
</script>

<Card.Root class="mx-auto max-w-sm min-w-sm border-none bg-black/70">
	<Card.Header>
		<Card.Title class="text-2xl">{$_('auth.login.title')}</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			{#if form?.identifierNotFound}
				<ErrorAlert
					type="warning"
					messageKey="auth.login.error_account_not_found"
					showCreateAccount={true}
					createAccountLink="/register"
				/>
			{:else if form?.invalidPassword}
				<ErrorAlert
					type="error"
					messageKey="auth.login.error_invalid_password"
					showResetPassword={true}
					resetPasswordLink="/forgot-password"
					email={form.identifier}
				/>
			{:else if form?.credentials}
				<ErrorAlert type="error" messageKey="auth.login.error_credentials" />
			{/if}

			<form action="?/login" method="POST" use:enhance>
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="identifier">{$_('auth.login.identifier_label')}</Label>
						<Input
							id="identifier"
							type="text"
							name="identifier"
							placeholder={$_('auth.login.identifier_placeholder')}
							required
						/>
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
					<div class="flex items-center space-x-2">
						<Checkbox id="remember" name="remember" />
						<Label
							for="remember"
							class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							{$_('auth.login.remember_me')}
						</Label>
					</div>
					<Button type="submit" class="w-full">{$_('auth.login.login_button')}</Button>
				</div>
			</form>
			<div class="flex items-center gap-2">
				<span class="w-full border-t border-gray-600"></span>
				<span class="px-2 text-gray-400">{$_('auth.or')}</span>
				<span class="w-full border-t border-gray-600"></span>
			</div>

			<div class="grid gap-3">
				<GoogleButton action="/login/google" text={$_('auth.login.login_with_google')} />
				<GithubButton action="/login/github" text={$_('auth.login.login_with_github')} />
				<FortyTwoButton action="/login/fortyTwo" text={$_('auth.login.login_with_42')} />
			</div>
		</div>
		<div class="mt-4 text-center text-sm">
			{$_('auth.login.no_account')}
			<a href="/register" class="underline">{$_('auth.login.sign_up_link')}</a>
		</div>
	</Card.Content>
</Card.Root>
