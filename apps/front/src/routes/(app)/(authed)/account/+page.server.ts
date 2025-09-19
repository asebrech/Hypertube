import { fail, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

export async function load({ locals, cookies }: RequestEvent) {
	let fullUserData = locals.user;
	
	// If we have a user, fetch their full profile data using the authenticated /me endpoint
	if (locals.user) {
		try {
			const token = cookies.get('session');
			const meResponse = await axios.get(`${SECRET_BACK_URL}/users/me`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			fullUserData = meResponse.data;
		} catch (error) {
			console.error('Failed to fetch full user profile:', error);
			// Fallback to locals.user if profile fetch fails
		}
	}
	
	return {
		user: fullUserData
	};
}

const updateAccount = async ({ request, locals, cookies }: RequestEvent) => {
	const data = await request.formData();
	const firstName = data.get('firstName');
	const lastName = data.get('lastName');
	const username = data.get('username');
	const email = data.get('email');
	const currentPassword = data.get('currentPassword');
	const newPassword = data.get('newPassword');

	if (!locals.user) {
		return fail(401, { invalid: true, errors: { general: 'unauthorized' } });
	}

	// Build payload with only non-empty fields
	const payload: any = {};

	if (firstName && firstName.toString().trim()) payload.firstName = firstName.toString().trim();
	if (lastName && lastName.toString().trim()) payload.lastName = lastName.toString().trim();
	if (username && username.toString().trim()) payload.username = username.toString().trim();
	if (email && email.toString().trim()) payload.email = email.toString().trim();

	// Handle password change
	if (newPassword && newPassword.toString().trim()) {
		if (!currentPassword || !currentPassword.toString().trim()) {
			return fail(400, {
				invalid: true,
				errors: { currentPassword: 'required' }
			});
		}
		payload.currentPassword = currentPassword.toString();
		payload.newPassword = newPassword.toString();
	}

	const config = {
		method: 'patch',
		url: `${SECRET_BACK_URL}/user/${locals.user.id}`,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${cookies.get('session')}`
		},
		data: JSON.stringify(payload)
	};

	try {
		const response = await axios.request(config);
		return {
			success: true,
			user: response.data.user
		};
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			if (error.response.status === 422) {
				const backendErrors = error.response.data?.errors || [];
				const errors: Record<string, string> = {};

				backendErrors.forEach((errorObj: any) => {
					if (errorObj.field && errorObj.rule) {
						let errorKey = '';

						if (errorObj.rule === 'unique') {
							if (errorObj.field === 'email') {
								errorKey = 'email_already_used';
							} else if (errorObj.field === 'username') {
								errorKey = 'username_already_used';
							} else {
								errorKey = 'already_used';
							}
						} else if (errorObj.rule === 'email') {
							errorKey = 'email_invalid';
						} else if (errorObj.rule === 'password') {
							errorKey = 'password_invalid';
						} else if (errorObj.rule === 'length') {
							errorKey = 'length_invalid';
						} else if (errorObj.rule === 'invalid') {
							errorKey = 'invalid';
						} else if (errorObj.rule === 'required') {
							errorKey = 'required';
						} else {
							errorKey = 'invalid';
						}

						errors[errorObj.field] = errorKey;
					}
				});

				return fail(422, {
					invalid: true,
					errors: errors
				});
			} else if (error.response.status === 400) {
				// Handle current password error
				const message = error.response.data?.message || '';
				if (message.includes('Current password')) {
					return fail(400, {
						invalid: true,
						errors: { currentPassword: 'invalid' }
					});
				}
			} else if (error.response.status === 403) {
				return fail(403, {
					invalid: true,
					errors: { general: 'forbidden' }
				});
			}
		}

		return fail(500, {
			invalid: true,
			errors: { general: 'server_error' }
		});
	}
};

export const actions = { updateAccount };
