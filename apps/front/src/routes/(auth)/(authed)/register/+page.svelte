<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { _ } from 'svelte-i18n';

	let { form } = $props();
	import { enhance } from '$app/forms';

	// Example validation state - you can replace this with actual validation logic
	let passwordErrors: string[] = $state([]);
	let emailErrors: string[] = $state([]);
	let usernameErrors: string[] = $state([]);
	let firstNameErrors: string[] = $state([]);
	let lastNameErrors: string[] = $state([]);

	// Example function to validate password
	function validatePassword(password: string) {
		const errors: string[] = [];
		if (password.length < 12) {
			errors.push($_('validation.password.min_length'));
		}
		if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
			errors.push($_('validation.password.special_char'));
		}
		if (!/[A-Z]/.test(password)) {
			errors.push($_('validation.password.uppercase'));
		}
		if (!/[a-z]/.test(password)) {
			errors.push($_('validation.password.lowercase'));
		}
		if (!/[0-9]/.test(password)) {
			errors.push($_('validation.password.number'));
		}
		return errors;
	}

	// Example function to validate email
	function validateEmail(email: string) {
		const errors: string[] = [];
		if (!email.includes('@')) {
			errors.push($_('validation.email.invalid'));
		}
		return errors;
	}

	// Example function to validate username
	function validateUsername(username: string) {
		const errors: string[] = [];
		if (username.length < 3) {
			errors.push($_('validation.username.min_length'));
		}
		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			errors.push($_('validation.username.invalid_chars'));
		}
		return errors;
	}

	// Function to validate first name
	function validateFirstName(firstName: string) {
		const errors: string[] = [];
		if (firstName.length > 0 && firstName.length < 2) {
			errors.push($_('validation.firstName.min_length'));
		}
		if (firstName.length > 64) {
			errors.push($_('validation.firstName.max_length'));
		}
		return errors;
	}

	// Function to validate last name
	function validateLastName(lastName: string) {
		const errors: string[] = [];
		if (lastName.length > 0 && lastName.length < 2) {
			errors.push($_('validation.lastName.min_length'));
		}
		if (lastName.length > 64) {
			errors.push($_('validation.lastName.max_length'));
		}
		return errors;
	}
</script>

<Card.Root class="mx-auto max-w-sm  border-none bg-black/70">
	<Card.Header>
		<Card.Title class="text-xl">{$_('auth.sign_up')}</Card.Title>
		<Card.Description>{$_('auth.enter_info')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			<form action="?/register" method="POST" use:enhance>
				<div class="grid gap-4">
					{#if form?.invalid}
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
									firstNameErrors = validateFirstName(target.value);
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
									lastNameErrors = validateLastName(target.value);
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
								usernameErrors = validateUsername(target.value);
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
								emailErrors = validateEmail(target.value);
							}}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="password">{$_('auth.password')}</Label>
						<Input
							id="password"
							name="password"
							type="password"
							errors={passwordErrors}
							onfocusout={(e) => {
								const target = e.target as HTMLInputElement;
								passwordErrors = validatePassword(target.value);
							}}
						/>
					</div>
					<Button type="submit" class="w-full">{$_('auth.create_account')}</Button>
				</div>
			</form>
			<form method="POST" action="/login/google" use:enhance>
				<Button variant="outline" class="w-full" type="submit"
					>{$_('auth.register_with_google')}</Button
				>
			</form>
			<form method="POST" action="/login/github" use:enhance>
				<Button variant="outline" class="w-full" type="submit"
					>{$_('auth.register_with_github')}</Button
				>
			</form>
		</div>
		<div class="mt-4 text-center text-sm">
			{$_('auth.already_have_account')}
			<a href="/login" class="underline"> {$_('auth.sign_in')} </a>
		</div>
	</Card.Content>
</Card.Root>
