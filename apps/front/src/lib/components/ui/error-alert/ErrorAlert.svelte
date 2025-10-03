<script lang="ts">
	import { AlertTriangle, XCircle } from 'lucide-svelte';
	import { _ } from 'svelte-i18n';

	interface ErrorAlertProps {
		type: 'warning' | 'error';
		messageKey: string;
		fallbackMessage?: string;
		showCreateAccount?: boolean;
		createAccountLink?: string;
		showResetPassword?: boolean;
		resetPasswordLink?: string;
		email?: string;
	}

	const {
		type,
		messageKey,
		fallbackMessage,
		showCreateAccount = false,
		createAccountLink = '/register',
		showResetPassword = false,
		resetPasswordLink = '/forgot-password',
		email = ''
	}: ErrorAlertProps = $props();

	const alertClasses = $derived(
		type === 'warning' ? 'bg-orange-400 text-black' : 'bg-orange-400 text-black'
	);

	const iconClasses = $derived(type === 'warning' ? 'text-black' : 'text-black');

	function renderMessage(
		messageKey: string,
		fallbackMessage: string | undefined,
		email: string,
		showCreateAccount: boolean,
		showResetPassword: boolean
	) {
		if (showResetPassword && email) {
			const resetLinkText = $_('auth.login.reset_password_link');
			const message = $_(messageKey, {
				values: {
					email: email,
					resetPasswordLink: resetLinkText
				}
			});
			return message;
		} else if (showCreateAccount) {
			const createLinkText = $_('auth.login.create_account_link');
			const message = $_(messageKey, {
				values: {
					createAccountLink: createLinkText
				}
			});
			return message;
		}

		const translatedMessage = $_(messageKey);
		if (translatedMessage === messageKey && fallbackMessage) {
			return fallbackMessage;
		}
		return translatedMessage;
	}

	function getMessageParts(
		messageKey: string,
		fallbackMessage: string | undefined,
		email: string,
		showCreateAccount: boolean,
		showResetPassword: boolean
	) {
		if (showResetPassword && email) {
			const resetLinkText = $_('auth.login.reset_password_link');
			const fullMessage = $_(messageKey, {
				values: {
					email: `__EMAIL_BOLD__${email}__EMAIL_BOLD__`,
					resetPasswordLink: `__RESET_LINK__${resetLinkText}__RESET_LINK__`
				}
			});

			const emailParts = fullMessage.split('__EMAIL_BOLD__');
			const beforeEmail = emailParts[0];
			const emailText = emailParts[1];
			const afterEmailWithLink = emailParts[2] || '';

			const linkParts = afterEmailWithLink.split('__RESET_LINK__');
			const afterEmail = linkParts[0];
			const linkText = linkParts[1];
			const afterLink = linkParts[2] || '';

			return {
				beforeEmail: beforeEmail,
				emailText: emailText,
				afterEmail: afterEmail,
				linkText: linkText,
				afterLink: afterLink,
				isResetPassword: true
			};
		} else if (showCreateAccount) {
			const createLinkText = $_('auth.login.create_account_link');
			const fullMessage = $_(messageKey, {
				values: {
					createAccountLink: `__CREATE_LINK__${createLinkText}__CREATE_LINK__`
				}
			});

			const parts = fullMessage.split('__CREATE_LINK__');
			return {
				beforeLink: parts[0],
				linkText: parts[1],
				afterLink: parts[2] || '',
				isResetPassword: false
			};
		}
		const translatedMessage = $_(messageKey);
		const finalMessage =
			translatedMessage === messageKey && fallbackMessage ? fallbackMessage : translatedMessage;

		return {
			beforeLink: finalMessage,
			linkText: '',
			afterLink: '',
			isResetPassword: false
		};
	}

	const messageParts = $derived(
		getMessageParts(messageKey, fallbackMessage, email, showCreateAccount, showResetPassword)
	);
</script>

<div class={`rounded-lg p-4 ${alertClasses}`}>
	<div class="flex items-start space-x-3">
		<div class="flex-shrink-0">
			{#if type === 'warning'}
				<AlertTriangle class={`h-5 w-5 ${iconClasses}`} />
			{:else}
				<XCircle class={`h-5 w-5 ${iconClasses}`} />
			{/if}
		</div>
		<div class="flex-1">
			<p class="text-sm font-medium">
				{#if showResetPassword && email}
					{messageParts.beforeEmail}<span class="font-bold">{messageParts.emailText}</span
					>{messageParts.afterEmail}
					{#if messageParts.linkText}
						<a href={resetPasswordLink} class="ml-1 font-semibold underline hover:no-underline">
							{messageParts.linkText}
						</a>
					{/if}
					{messageParts.afterLink}
				{:else if showCreateAccount}
					{messageParts.beforeLink}
					{#if messageParts.linkText}
						<a href={createAccountLink} class="ml-1 font-semibold underline hover:no-underline">
							{messageParts.linkText}
						</a>
					{/if}
					{messageParts.afterLink}
				{:else}
					{messageParts.beforeLink}
				{/if}
			</p>
		</div>
	</div>
</div>
