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

	// Create FormData for multipart form submission
	const formData = new FormData();
	formData.append('firstName', firstName?.toString() || '');
	formData.append('lastName', lastName?.toString() || '');
	formData.append('username', username?.toString() || '');
	formData.append('email', email);
	formData.append('password', password);

	// Add profile picture if provided
	if (profilePicture && profilePicture.size > 0) {
		formData.append('profilePicture', profilePicture);
	}

	const config = {
		method: 'post',
		url: `${SECRET_BACK_URL}/user/register`,
		data: formData
	};

	try {
		const registerResponse = await axios.request(config);
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
