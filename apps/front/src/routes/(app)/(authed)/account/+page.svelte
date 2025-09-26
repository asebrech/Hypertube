<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ProfilePictureUpload from '$lib/components/ProfilePictureUpload.svelte';
	import { _ } from 'svelte-i18n';
	import { goto, invalidateAll } from '$app/navigation';
	import { ChevronLeft } from 'lucide-svelte';
	import {
		validatePassword,
		validateEmail,
		validateUsername,
		validateFirstName,
		validateLastName,
		translateValidationErrors
	} from '@hypertube/shared';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	type FormData = {
		invalid?: boolean;
		success?: boolean;
		profilePictureMessage?: string;
		user?: {
			id: number;
			firstName?: string;
			lastName?: string;
			username?: string;
			email: string;
			profilePicture?: string;
		};
		errors?: {
			email?: string;
			username?: string;
			firstName?: string;
			lastName?: string;
			currentPassword?: string;
			newPassword?: string;
			general?: string;
			profilePicture?: string;
		};
	};

	let { form, data }: { form: FormData | null; data: any } = $props();

	// Client-side validation errors
	let clientPasswordErrors: string[] = $state([]);
	let clientEmailErrors: string[] = $state([]);
	let clientUsernameErrors: string[] = $state([]);
	let clientFirstNameErrors: string[] = $state([]);
	let clientLastNameErrors: string[] = $state([]);
	let clientCurrentPasswordErrors: string[] = $state([]);
	let clientConfirmPasswordErrors: string[] = $state([]);

	// Combined errors (client + server)
	let passwordErrors: string[] = $state([]);
	let emailErrors: string[] = $state([]);
	let usernameErrors: string[] = $state([]);
	let firstNameErrors: string[] = $state([]);
	let lastNameErrors: string[] = $state([]);
	let currentPasswordErrors: string[] = $state([]);
	let confirmPasswordErrors: string[] = $state([]);

	// Form values
	let firstName = $state('');
	let lastName = $state('');
	let username = $state('');
	let email = $state('');
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Profile picture state
	let currentProfilePicture = $state('');
	let selectedProfilePicture = $state<File | null>(null);
	let imageKey = $state(0); // Key to force image re-render

	// Effect to merge client and server errors
	$effect(() => {
		passwordErrors = [...clientPasswordErrors];
		emailErrors = [...clientEmailErrors];
		usernameErrors = [...clientUsernameErrors];
		firstNameErrors = [...clientFirstNameErrors];
		lastNameErrors = [...clientLastNameErrors];
		currentPasswordErrors = [...clientCurrentPasswordErrors];
		confirmPasswordErrors = [...clientConfirmPasswordErrors];

		// Add server errors if they exist
		if (form?.errors) {
			if (form.errors.newPassword) {
				passwordErrors.push($_(`validation.server_errors.${form.errors.newPassword}`));
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
			if (form.errors.currentPassword) {
				currentPasswordErrors.push($_('account.error_current_password'));
			}
		}
	});

	$effect(() => {
		if (data.user) {
			firstName = data.user.firstName || '';
			lastName = data.user.lastName || '';
			username = data.user.username || '';
			email = data.user.email || '';
		}

		if (form?.success && form.user) {
			firstName = form.user.firstName || '';
			lastName = form.user.lastName || '';
			username = form.user.username || '';
			email = form.user.email || '';
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			selectedProfilePicture = null; // Reset selected file after successful submission
			
			// Update profile picture if it was updated
			if (form.user.profilePicture) {
				currentProfilePicture = form.user.profilePicture;
			}
			
			imageKey++; // Force image re-render
		}
	});

	function validateCurrentPassword() {
		if (newPassword.length > 0 && !currentPassword) {
			clientCurrentPasswordErrors = [$_('account.required_for_password')];
		} else {
			clientCurrentPasswordErrors = [];
		}
	}

	function validateConfirmPassword() {
		if (newPassword.length > 0) {
			if (!confirmPassword) {
				clientConfirmPasswordErrors = [$_('account.confirm_password_required')];
			} else if (newPassword !== confirmPassword) {
				clientConfirmPasswordErrors = [$_('account.passwords_do_not_match')];
			} else {
				clientConfirmPasswordErrors = [];
			}
		} else {
			clientConfirmPasswordErrors = [];
		}
	}

	function validateNewPassword() {
		if (newPassword.length > 0) {
			const rawErrors = validatePassword(newPassword);
			clientPasswordErrors = translateValidationErrors(rawErrors, $_);

			if (!currentPassword) {
				clientCurrentPasswordErrors = [$_('account.required_for_password')];
			} else {
				clientCurrentPasswordErrors = [];
			}

			validateConfirmPassword();
		} else {
			clientPasswordErrors = [];
			clientCurrentPasswordErrors = [];
			clientConfirmPasswordErrors = [];
		}
	}

	function handleFileSelected(file: File) {
		selectedProfilePicture = file;
	}

	function handleImageRemoved() {
		selectedProfilePicture = null;
	}

	$effect(() => {
		if (data?.user?.profilePicture) {
			currentProfilePicture = data.user.profilePicture;
		}
	});

	// Navigate back to user's profile
	const goBackToProfile = () => {
		const username = data?.user?.username;
		if (username) {
			goto(`/${encodeURIComponent(username)}`);
		} else {
			goto('/profile'); // Fallback
		}
	};
</script>

<div
	class="relative min-h-screen bg-cover bg-center bg-no-repeat py-16"
	style="background-image: url('/img/netflix-background.jpg');"
>
	<div class="absolute inset-0 bg-black/50"></div>
	<div class="relative z-10 flex min-h-screen flex-1 items-center justify-center p-4">
		<Card.Root class="mx-auto max-w-lg border-none bg-black/70">
			<Card.Header>
				<div class="flex items-center gap-3">
					<button
						onclick={goBackToProfile}
						class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors group"
						aria-label="Back to profile"
					>
						<ChevronLeft class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
					</button>
					<div class="flex-1">
						<Card.Title class="text-xl text-white">{$_('account.title')}</Card.Title>
						<Card.Description class="text-gray-300">{$_('account.description')}</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-6">
					{#if form?.success}
						<div class="rounded-md border border-green-700 bg-green-900/50 p-4">
							<p class="text-sm text-green-100">{$_('account.success_message')}</p>
							{#if form?.profilePictureMessage}
								<p class="text-sm text-green-100 mt-1">{form.profilePictureMessage}</p>
							{/if}
						</div>
					{/if}

					{#if form?.errors?.general}
						<div class="rounded-md border border-red-700 bg-red-900/50 p-4">
							<p class="text-sm text-red-100">{$_('account.error_general')}</p>
						</div>
					{/if}

					<form
						action="?/updateAccount"
						method="POST"
						enctype="multipart/form-data"
						use:enhance={({ formData }) => {
							// Add the selected profile picture to the form data
							if (selectedProfilePicture) {
								formData.append('profilePicture', selectedProfilePicture);
							}
							
							return async ({ result, update }) => {
								await update();
							};
						}}
					>
						<div class="grid gap-6">
							<!-- Profile Picture Section -->
							<div class="grid gap-4">
								<h3 class="text-lg font-medium text-white">{$_('account.profile-picture')}</h3>

								<div class="flex justify-center">
									<ProfilePictureUpload
										{currentProfilePicture}
										{imageKey}
										selectedFile={selectedProfilePicture}
										onFileSelected={handleFileSelected}
										onImageRemoved={handleImageRemoved}
										{username}
									/>
								</div>
							</div>
							<!-- Personal Information Section -->
							<div class="grid gap-4">
								<h3 class="text-lg font-medium text-white">{$_('account.personal_info')}</h3>

								<div class="grid grid-cols-2 gap-4">
									<div class="grid gap-2">
										<Label for="firstName">{$_('auth.first_name')}</Label>
										<Input
											id="firstName"
											name="firstName"
											bind:value={firstName}
											placeholder={$_('account.placeholders.first_name')}
											errors={firstNameErrors}
											onfocusout={(e) => {
												const target = e.target as HTMLInputElement;
												const rawErrors = validateFirstName(target.value);
												clientFirstNameErrors = translateValidationErrors(rawErrors, $_);
											}}
										/>
									</div>
									<div class="grid gap-2">
										<Label for="lastName">{$_('auth.last_name')}</Label>
										<Input
											id="lastName"
											name="lastName"
											bind:value={lastName}
											placeholder={$_('account.placeholders.last_name')}
											errors={lastNameErrors}
											onfocusout={(e) => {
												const target = e.target as HTMLInputElement;
												const rawErrors = validateLastName(target.value);
												clientLastNameErrors = translateValidationErrors(rawErrors, $_);
											}}
										/>
									</div>
								</div>

								<div class="grid gap-2">
									<Label for="username">{$_('auth.username')}</Label>
									<Input
										id="username"
										name="username"
										bind:value={username}
										placeholder={$_('account.placeholders.username')}
										errors={usernameErrors}
										onfocusout={(e) => {
											const target = e.target as HTMLInputElement;
											const rawErrors = validateUsername(target.value);
											clientUsernameErrors = translateValidationErrors(rawErrors, $_);
										}}
									/>
								</div>

								<div class="grid gap-2">
									<Label for="email">{$_('auth.email')}</Label>
									<Input
										id="email"
										type="email"
										name="email"
										bind:value={email}
										placeholder={$_('account.placeholders.email')}
										errors={emailErrors}
										onfocusout={(e) => {
											const target = e.target as HTMLInputElement;
											const rawErrors = validateEmail(target.value);
											clientEmailErrors = translateValidationErrors(rawErrors, $_);
										}}
									/>
								</div>
							</div>

							<!-- Security Section - Only for non-OAuth users -->
							{#if !data.user.isOAuthUser}
								<div class="grid gap-4">
									<h3 class="text-lg font-medium text-white">{$_('account.security')}</h3>

									<div class="grid gap-2">
										<Label for="currentPassword">{$_('account.current_password')}</Label>
										<Input
											id="currentPassword"
											name="currentPassword"
											type="password"
											placeholder={$_('account.placeholders.current_password')}
											errors={currentPasswordErrors}
											bind:value={currentPassword}
											onfocusout={validateCurrentPassword}
										/>
									</div>

									<div class="grid gap-2">
										<Label for="newPassword">{$_('account.new_password')}</Label>
										<Input
											id="newPassword"
											name="newPassword"
											type="password"
											placeholder={$_('account.placeholders.new_password')}
											errors={passwordErrors}
											bind:value={newPassword}
											onfocusout={validateNewPassword}
										/>
									</div>

									<div class="grid gap-2">
										<Label for="confirmPassword">{$_('account.confirm_password')}</Label>
										<Input
											id="confirmPassword"
											name="confirmPassword"
											type="password"
											placeholder={$_('account.placeholders.confirm_password')}
											errors={confirmPasswordErrors}
											bind:value={confirmPassword}
											onfocusout={validateConfirmPassword}
										/>
									</div>
								</div>
							{:else}
								<!-- OAuth User Info -->
								<div class="grid gap-4">
									<h3 class="text-lg font-medium text-white">{$_('account.security')}</h3>
									<div class="rounded-md border border-gray-700 bg-gray-800 p-4">
										<p class="text-sm text-gray-300">
											{$_('account.oauth_user_info')}
										</p>
									</div>
								</div>
							{/if}

							<Button type="submit" class="w-full">{$_('account.save_changes')}</Button>
						</div>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
