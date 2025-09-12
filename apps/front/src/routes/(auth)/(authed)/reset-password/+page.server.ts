import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

export const load = async ({ url }: RequestEvent) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(302, '/login');
	}

	return {
		token
	};
};

const resetPassword = async ({ request, url }: RequestEvent) => {
	const data = await request.formData();
	const password = data.get('password');
	const confirmPassword = data.get('confirmPassword');
	const token = data.get('token') || url.searchParams.get('token');

	if (!token) {
		return fail(400, { invalid: true, message: 'Invalid reset token' });
	}

	if (
		typeof password !== 'string' ||
		typeof confirmPassword !== 'string' ||
		!password ||
		!confirmPassword
	) {
		return fail(400, { invalid: true, message: 'Please fill in all fields' });
	}

	if (password !== confirmPassword) {
		return fail(400, { invalid: true, message: 'Passwords do not match' });
	}

	const payload = JSON.stringify({
		token,
		password
	});

	const config = {
		method: 'post',
		url: `${SECRET_BACK_URL}/user/reset-password`,
		headers: {
			'Content-Type': 'application/json'
		},
		data: payload
	};

	try {
		await axios.request(config);
		return { success: true };
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			const message = error.response.data?.message || 'Something went wrong. Please try again.';
			return fail(400, { error: true, message });
		} else {
			throw error;
		}
	}
};

export const actions = { resetPassword };
