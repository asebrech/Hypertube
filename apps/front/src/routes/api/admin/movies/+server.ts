import { json, error } from '@sveltejs/kit';
import { SECRET_BACK_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

// GET /api/admin/movies - List all downloaded movies
export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	const session = cookies.get('session');

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Forward query parameters to backend
		const queryParams = url.searchParams.toString();
		const backendUrl = `${SECRET_BACK_URL}/admin/movies${queryParams ? `?${queryParams}` : ''}`;

		const response = await fetch(backendUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${session}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			if (response.status === 401) {
				throw error(401, 'Unauthorized');
			} else if (response.status === 403) {
				throw error(403, 'Forbidden - Admin access required');
			}
			throw error(response.status, 'Failed to fetch movies');
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(400, 'Bad Request');
	}
};

// DELETE /api/admin/movies - Delete all movies
export const DELETE: RequestHandler = async ({ cookies, fetch }) => {
	const session = cookies.get('session');

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	try {
		const response = await fetch(`${SECRET_BACK_URL}/admin/movies`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${session}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			if (response.status === 401) {
				throw error(401, 'Unauthorized');
			} else if (response.status === 403) {
				throw error(403, 'Forbidden - Admin access required');
			}
			throw error(response.status, 'Failed to delete all movies');
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(400, 'Bad request');
	}
};
