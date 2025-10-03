import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

export const load = async ({ url }: RequestEvent) => {
	const oauthError = url.searchParams.get('oauth_error');
	const provider = url.searchParams.get('provider');
	const details = url.searchParams.get('details');

	if (oauthError) {
		return {
			oauthError: {
				type: oauthError,
				provider: provider,
				details: details ? decodeURIComponent(details) : null
			}
		};
	}

	return {};
};

const login = async ({ cookies, request }: RequestEvent) => {
	const data = await request.formData();
	const identifier = data.get('identifier');
	const password = data.get('password');
	const remember = data.get('remember'); // Get the remember me value

	if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier || !password) {
		return fail(400, { invalid: true });
	}

	const payload = JSON.stringify({
		identifier,
		password,
		remember: remember === 'on'
	});

	const config = {
		method: 'post',
		url: `${SECRET_BACK_URL}/user/login`,
		headers: {
			'Content-Type': 'application/json'
		},
		data: payload
	};

	try {
		const response = await axios.request(config);
		const token = response.data.token.token;

		const isRememberMe = remember === 'on';
		const maxAge = isRememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: true,
			maxAge: maxAge
		});
		redirect(302, '/');
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			const errorData = error.response.data;
			if (errorData?.error === 'IDENTIFIER_NOT_FOUND') {
				return fail(400, { identifierNotFound: true, identifier });
			} else if (errorData?.error === 'INVALID_PASSWORD') {
				return fail(400, { invalidPassword: true, identifier });
			}

			return fail(400, { credentials: true, identifier });
		} else {
			throw error;
		}
	}
};

export const actions = { login };
