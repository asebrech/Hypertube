import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

const forgotPassword = async ({ request }: RequestEvent) => {
	const data = await request.formData();
	const email = data.get('email');

	if (typeof email !== 'string' || !email) {
		return fail(400, { invalid: true });
	}

	const payload = JSON.stringify({ email });

	const config = {
		method: 'post',
		url: `${SECRET_BACK_URL}/user/forgot-password`,
		headers: {
			'Content-Type': 'application/json'
		},
		data: payload
	};

	try {
		const response = await axios.request(config);
		return {
			success: true,
			...(response.data.resetUrl && {
				resetUrl: response.data.resetUrl,
				devNote: response.data.devNote
			})
		};
	} catch (error) {
		if (axios.isAxiosError(error) && error.response && error.response.status) {
			return fail(400, { error: true });
		} else {
			throw error;
		}
	}
};

export const actions = { forgotPassword };
