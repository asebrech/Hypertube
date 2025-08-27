import { SECRET_BACK_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const session = cookies.get('session');

	if (!session) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const response = await fetch(`${SECRET_BACK_URL}/users/me`, {
			headers: {
				Authorization: `Bearer ${session}`
			}
		});

		if (!response.ok) {
			return new Response(JSON.stringify({ error: 'Failed to fetch user data' }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const userData = await response.json();
		return new Response(JSON.stringify(userData), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
