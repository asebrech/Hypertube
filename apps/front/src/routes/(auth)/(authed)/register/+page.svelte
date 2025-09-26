<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { PasswordInput } from '$lib/components/ui/password-input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		GoogleButton,
		GithubButton,
		FortyTwoButton
	} from '$lib/components/ui/oauth-buttons/index.js';
	import { _ } from 'svelte-i18n';
	import {
		validatePassword,
		validateEmail,
		validateUsername,
		validateFirstName,
		validateLastName,
		translateValidationErrors
	} from '@hypertube/shared';

	type FormData = {
		invalid?: boolean;
		errors?: {
			email?: string;
			username?: string;
			password?: string;
			firstName?: string;
			lastName?: string;
			general?: string;
		};
	};

	let { form }: { form: FormData | null } = $props();
	import { enhance } from '$app/forms';

	// Client-side validation errors
	let clientPasswordErrors: string[] = $state([]);
	let clientEmailErrors: string[] = $state([]);
	let clientUsernameErrors: string[] = $state([]);
	let clientFirstNameErrors: string[] = $state([]);
	let clientLastNameErrors: string[] = $state([]);

	// Combined errors (client + server)
	let passwordErrors: string[] = $state([]);
	let emailErrors: string[] = $state([]);
	let usernameErrors: string[] = $state([]);
	let firstNameErrors: string[] = $state([]);
	let lastNameErrors: string[] = $state([]);

	// Effect to merge client and server errors
	$effect(() => {
		passwordErrors = [...clientPasswordErrors];
		emailErrors = [...clientEmailErrors];
		usernameErrors = [...clientUsernameErrors];
		firstNameErrors = [...clientFirstNameErrors];
		lastNameErrors = [...clientLastNameErrors];

		// Add server errors if they exist
		if (form?.errors) {
			if (form.errors.password) {
				passwordErrors.push($_(`validation.server_errors.${form.errors.password}`));
			}
			if (form.errors.email) {
				emailErrors.push($_(`validation.server_errors.${form.errors.email}`));
			}
			if (form.errors.username) {
				usernameErrors.push($_(`validation.server_errors.${form.errors.username}`));
			}
			if (form.errors.firstName) {
				firstNameErrors.push($_(`validation.server_errors.${form.errors.firstName}`));
			}
			if (form.errors.lastName) {
				lastNameErrors.push($_(`validation.server_errors.${form.errors.lastName}`));
			}
		}
	});

	function validatePasswordWithTranslation(password: string) {
		const errorKeys = validatePassword(password);
		return translateValidationErrors(errorKeys, (key) => $_(key));
	}

	function validateEmailWithTranslation(email: string) {
		const errorKeys = validateEmail(email);
		return translateValidationErrors(errorKeys, (key) => $_(key));
	}

	function validateUsernameWithTranslation(username: string) {
		const errorKeys = validateUsername(username);
		return translateValidationErrors(errorKeys, (key) => $_(key));
	}

	function validateFirstNameWithTranslation(firstName: string) {
		const errorKeys = validateFirstName(firstName);
		return translateValidationErrors(errorKeys, (key) => $_(key));
	}

	function validateLastNameWithTranslation(lastName: string) {
		const errorKeys = validateLastName(lastName);
		return translateValidationErrors(errorKeys, (key) => $_(key));
	}
</script>

<Card.Root class="mx-auto max-w-sm my-16 border-none bg-black/70">
	<Card.Header>
		<Card.Title class="text-xl">{$_('auth.sign_up')}</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			<form action="?/register" method="POST" use:enhance>
				<div class="grid gap-4">
					{#if form?.invalid && !form?.errors}
						<p class="error">{$_('auth.form_error')}</p>
					{/if}
					<div class="grid grid-cols-2 gap-4">
						<div class="grid gap-2">
							<Label for="firstName">{$_('auth.first_name')}</Label>
							<Input
								id="firstName"
								name="firstName"
								placeholder="Neo"
								required
								errors={firstNameErrors}
								onfocusout={(e) => {
									const target = e.target as HTMLInputElement;
									clientFirstNameErrors = validateFirstNameWithTranslation(target.value);
								}}
							/>
						</div>
						<div class="grid gap-2">
							<Label for="lastName">{$_('auth.last_name')}</Label>
							<Input
								id="lastName"
								name="lastName"
								placeholder="Cat"
								required
								errors={lastNameErrors}
								onfocusout={(e) => {
									const target = e.target as HTMLInputElement;
									clientLastNameErrors = validateLastNameWithTranslation(target.value);
								}}
							/>
						</div>
					</div>
					<div class="grid gap-2">
						<Label for="username">{$_('auth.username')}</Label>
						<Input
							id="username"
							name="username"
							placeholder="username"
							required
							errors={usernameErrors}
							onfocusout={(e) => {
								const target = e.target as HTMLInputElement;
								clientUsernameErrors = validateUsernameWithTranslation(target.value);
							}}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="email">{$_('auth.email')}</Label>
						<Input
							id="email"
							type="email"
							name="email"
							placeholder="m@example.com"
							required
							errors={emailErrors}
							onfocusout={(e) => {
								const target = e.target as HTMLInputElement;
								clientEmailErrors = validateEmailWithTranslation(target.value);
							}}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="password">{$_('auth.password')}</Label>
						<PasswordInput
							id="password"
							name="password"
							errors={passwordErrors}
							onfocusout={(e) => {
								const target = e.target as HTMLInputElement;
								clientPasswordErrors = validatePasswordWithTranslation(target.value);
							}}
						/>
					</div>
					<Button type="submit" class="w-full">{$_('auth.create_account')}</Button>
				</div>
			</form>

			<div class="flex items-center gap-2">
				<span class="w-full border-t border-gray-600"></span>
				<span class="px-2 text-gray-400">{$_('auth.or')}</span>
				<span class="w-full border-t border-gray-600"></span>
			</div>

			<div class="grid gap-3">
				<GoogleButton action="/login/google" text={$_('auth.register_with_google')} />
				<GithubButton action="/login/github" text={$_('auth.register_with_github')} />
				<FortyTwoButton action="/login/fortyTwo" text={$_('auth.register_with_42')} />
			</div>
		</div>
		<div class="mt-4 text-center text-sm">
			{$_('auth.already_have_account')}
			<a href="/login" class="underline"> {$_('auth.sign_in')} </a>
		</div>
	</Card.Content>
</Card.Root>
