/**
 * OAuth Error Handler Utility
 *
 * Provides standardized OAuth error handling across the application
 */

export interface OAuthError {
	type: string;
	provider: string;
	details?: string | null;
}

export interface OAuthErrorInfo {
	messageKey: string;
	fallbackMessage: string;
	isRetryable: boolean;
	suggestedActionKeys?: string[];
}

/**
 * Maps OAuth error types to user-friendly information
 */
export const OAUTH_ERROR_MAP: Record<string, OAuthErrorInfo> = {
	access_denied: {
		messageKey: 'auth.oauth.error_access_denied',
		fallbackMessage: 'Login was cancelled. You chose not to authorize the application.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_try_again', 'auth.oauth.action_use_different_method']
	},
	state_mismatch: {
		messageKey: 'auth.oauth.error_state_mismatch',
		fallbackMessage: 'Security verification failed. Please try logging in again.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_clear_cookies', 'auth.oauth.action_try_again']
	},
	invalid_request: {
		messageKey: 'auth.oauth.error_invalid_request',
		fallbackMessage: 'Invalid login request. Please try again.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_try_again', 'auth.oauth.action_clear_cache']
	},
	invalid_client: {
		messageKey: 'auth.oauth.error_invalid_client',
		fallbackMessage: 'Application configuration error. Please contact support.',
		isRetryable: false,
		suggestedActionKeys: [
			'auth.oauth.action_contact_support',
			'auth.oauth.action_use_different_method'
		]
	},
	invalid_scope: {
		messageKey: 'auth.oauth.error_invalid_scope',
		fallbackMessage: 'Invalid permissions requested. Please try again.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_try_again', 'auth.oauth.action_use_different_method']
	},
	server_error: {
		messageKey: 'auth.oauth.error_server_error',
		fallbackMessage: 'Authentication service is temporarily unavailable. Please try again later.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_try_later', 'auth.oauth.action_use_different_method']
	},
	unauthorized: {
		messageKey: 'auth.oauth.error_unauthorized',
		fallbackMessage: 'Authorization failed. Please try again.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_try_again', 'auth.oauth.action_check_account']
	},
	processing_error: {
		messageKey: 'auth.oauth.error_processing_error',
		fallbackMessage: 'An error occurred while processing your login. Please try again.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_try_again', 'auth.oauth.action_clear_browser_data']
	},
	email_error: {
		messageKey: 'auth.oauth.error_email_error',
		fallbackMessage: 'There was an issue with your email during login. Please try again.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_verify_email', 'auth.oauth.action_try_again']
	},
	user_error: {
		messageKey: 'auth.oauth.error_user_error',
		fallbackMessage: 'There was an issue creating or updating your account. Please try again.',
		isRetryable: true,
		suggestedActionKeys: [
			'auth.oauth.action_try_again',
			'auth.oauth.action_contact_support_persist'
		]
	},
	token_error: {
		messageKey: 'auth.oauth.error_token_error',
		fallbackMessage: 'There was an issue generating your login token. Please try again.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_try_again', 'auth.oauth.action_clear_cookies']
	},
	oauth_error: {
		messageKey: 'auth.oauth.error_oauth_error',
		fallbackMessage: 'Authentication failed. Please try again.',
		isRetryable: true,
		suggestedActionKeys: ['auth.oauth.action_try_again', 'auth.oauth.action_use_different_method']
	},
	unknown_error: {
		messageKey: 'auth.oauth.error_oauth_error',
		fallbackMessage: 'An unknown error occurred during authentication. Please try again.',
		isRetryable: true,
		suggestedActionKeys: [
			'auth.oauth.action_try_again',
			'auth.oauth.action_contact_support_persist'
		]
	}
};

/**
 * Gets OAuth error information for display
 */
export function getOAuthErrorInfo(error: OAuthError): OAuthErrorInfo {
	const errorInfo = OAUTH_ERROR_MAP[error.type] || OAUTH_ERROR_MAP.unknown_error;

	// Customize fallback message with provider and details if available
	let fallbackMessage = errorInfo.fallbackMessage;
	if (error.provider) {
		fallbackMessage = fallbackMessage.replace(
			/authentication|login/gi,
			`${error.provider} authentication`
		);
	}
	if (error.details) {
		fallbackMessage += ` Details: ${error.details}`;
	}

	return {
		...errorInfo,
		fallbackMessage
	};
}

/**
 * Checks if an OAuth error is retryable
 */
export function isOAuthErrorRetryable(errorType: string): boolean {
	const errorInfo = OAUTH_ERROR_MAP[errorType];
	return errorInfo?.isRetryable ?? true;
}

/**
 * Gets suggested actions for an OAuth error
 */
export function getOAuthErrorActions(errorType: string): string[] {
	const errorInfo = OAUTH_ERROR_MAP[errorType];
	return errorInfo?.suggestedActionKeys ?? ['auth.oauth.action_try_again'];
}

/**
 * Formats OAuth error for logging/debugging
 */
export function formatOAuthErrorForLogging(error: OAuthError): string {
	return `OAuth Error: ${error.type} (${error.provider}) - ${error.details || 'No additional details'}`;
}
