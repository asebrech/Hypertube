import { SECRET_BACK_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const session = cookies.get('session');

	if (!session) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const ids = url.searchParams.get('ids');
	if (!ids) {
		return new Response(JSON.stringify({ error: 'User IDs are required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const response = await fetch(`${SECRET_BACK_URL}/users?ids=${encodeURIComponent(ids)}`, {
			headers: {
				Authorization: `Bearer ${session}`
			}
		});

		if (!response.ok) {
			return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const usersData = await response.json();
		return new Response(JSON.stringify(usersData), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
