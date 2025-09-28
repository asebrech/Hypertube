import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

const register = async ({ request }: RequestEvent) => {
	const data = await request.formData();
	const firstName = data.get('firstName');
	const lastName = data.get('lastName');
	const username = data.get('username');
	const email = data.get('email');
	const password = data.get('password');
	const profilePicture = data.get('profilePicture') as File | null;

	if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
		return fail(400, { invalid: true });
	}

	const payload = JSON.stringify({
		firstName,
		lastName,
		username,
		email,
		password
	});

	const config = {
		method: 'post',
		url: `${SECRET_BACK_URL}/user/register`,
		headers: {
			'Content-Type': 'application/json'
		},
		data: payload
	};

	try {
		const registerResponse = await axios.request(config);
		
		// If registration was successful and there's a profile picture, try to upload it
		if (profilePicture && profilePicture.size > 0) {
			try {
				// First, we need to login to get a token for the upload
				const loginConfig = {
					method: 'post',
					url: `${SECRET_BACK_URL}/user/login`,
					headers: {
						'Content-Type': 'application/json'
					},
					data: JSON.stringify({ email, password })
				};

				const loginResponse = await axios.request(loginConfig);
				const token = loginResponse.data.token?.token;

				if (token) {
					// Now upload the profile picture
					const formData = new FormData();
					formData.append('profilePicture', profilePicture);

					const uploadConfig = {
						method: 'post',
						url: `${SECRET_BACK_URL}/users/upload-profile-picture`,
						headers: {
							'Content-Type': 'multipart/form-data',
							'Authorization': `Bearer ${token}`
						},
						data: formData
					};

					await axios.request(uploadConfig);
				}
			} catch (uploadError) {
				// Profile picture upload failed, but registration succeeded
				// This is not a critical error, so we continue to login page
				console.error('Profile picture upload failed after registration:', uploadError);
			}
		}

		redirect(303, '/login');
	} catch (error) {
		if (axios.isAxiosError(error) && error.response && error.response.status === 422) {
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
		} else {
			throw error;
		}
	}
};

export const actions = { register };
