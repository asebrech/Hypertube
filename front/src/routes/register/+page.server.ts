import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

export const load = async ({ locals }: { locals: App.Locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}
};

const register = async ({ request }: RequestEvent) => {
	const data = await request.formData();
	const username = data.get('username');
	const email = data.get('email');
	const password = data.get('password');

	if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
		return fail(400, { invalid: true });
	}

	const payload = JSON.stringify({
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
		await axios.request(config);
		redirect(303, '/login');
	} catch (error) {
		if (axios.isAxiosError(error) && error.response && error.response.status === 422) {
			return fail(400, { invalid: true });
		} else {
			throw error;
		}
	}
};

export const actions = { register };
