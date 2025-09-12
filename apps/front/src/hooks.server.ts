import type { Handle } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

export const handle: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('session');

	if (!session) {
		return await resolve(event);
	}

	const config = {
		method: 'get',
		url: `${SECRET_BACK_URL}/me`,
		headers: {
			Authorization: `Bearer ${session}`
		}
	};

	try {
		const response = await axios.request(config);
		const { email, id } = response.data;
		event.locals.user = {
			email,
			id
		};
	} catch (error) {
		if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
			event.cookies.set('session', '', {
				path: '/',
				expires: new Date(0)
			});
			event.locals.user = null;
		} else {
			throw error;
		}
	}

	return await resolve(event);
};
