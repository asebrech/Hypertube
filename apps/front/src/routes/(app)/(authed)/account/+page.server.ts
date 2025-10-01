import { fail, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

export async function load({ locals, cookies }: RequestEvent) {
	let fullUserData = locals.user;

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
	const allowAdultContent = data.get('allowAdultContent');
	const profilePicture = data.get('profilePicture') as File | null;

	if (!locals.user) {
		return fail(401, { invalid: true, errors: { general: 'unauthorized' } });
	}

	// Handle profile picture upload first if there's a file
	let profilePictureResponse: any = null;
	if (profilePicture && profilePicture.size > 0) {
		try {
			const formData = new FormData();
			formData.append('profilePicture', profilePicture);

			const uploadConfig = {
				method: 'post',
				url: `${SECRET_BACK_URL}/users/upload-profile-picture`,
				headers: {
					Authorization: `Bearer ${cookies.get('session')}`
				},
				data: formData
			};

			profilePictureResponse = await axios.request(uploadConfig);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const messageKey = error.response.data?.messageKey || 'profile.upload.error-upload-failed';
				return fail(400, {
					invalid: true,
					errors: { profilePicture: messageKey }
				});
			}
			return fail(500, {
				invalid: true,
				errors: { profilePicture: 'profile.upload.error-upload-failed' }
			});
		}
	}

	// Prepare payload for other user data updates
	const payload: any = {};

	if (firstName && firstName.toString().trim()) payload.firstName = firstName.toString().trim();
	if (lastName && lastName.toString().trim()) payload.lastName = lastName.toString().trim();
	if (username && username.toString().trim()) payload.username = username.toString().trim();
	if (email && email.toString().trim()) payload.email = email.toString().trim();
	
	// Handle allowAdultContent - explicitly convert to boolean
	if (allowAdultContent !== null) {
		payload.allowAdultContent = allowAdultContent === 'true';
	}

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

	// Only make the user update request if there's something to update
	let userUpdateResponse: any = null;
	if (Object.keys(payload).length > 0) {
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
			userUpdateResponse = await axios.request(config);
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
	}

	// Return success response with updated user data
	const updatedUser = userUpdateResponse?.data?.user || locals.user;

	// If we successfully uploaded a profile picture, we need to refresh the user data
	// to get the updated profile picture URL
	if (profilePictureResponse && !userUpdateResponse) {
		try {
			const token = cookies.get('session');
			const meResponse = await axios.get(`${SECRET_BACK_URL}/users/me`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return {
				success: true,
				user: meResponse.data,
				profilePictureMessageKey: profilePictureResponse.data?.messageKey
			};
		} catch (error) {
			// Continue with the profile picture response even if user data fetch fails
		}
	}

	return {
		success: true,
		user: updatedUser,
		profilePictureMessageKey: profilePictureResponse?.data?.messageKey
	};
};

export const actions = { updateAccount };
