import { json, error } from '@sveltejs/kit';
import { SECRET_BACK_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

// GET /api/admin/movies-without-status - List all movies without download status
export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	const session = cookies.get('session');

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Forward query parameters to backend
		const queryParams = url.searchParams.toString();
		const backendUrl = `${SECRET_BACK_URL}/admin/movies/movies-without-status${queryParams ? `?${queryParams}` : ''}`;

		const response = await fetch(backendUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${session}`,
				'Content-Type': 'application/json'
			}
		});

        console.log('Response status from backend:', response.status);
        console.log('Response from backend:', response);
		if (!response.ok) {
			if (response.status === 401) {
				throw error(401, 'Unauthorized');
			} else if (response.status === 403) {
				throw error(403, 'Forbidden - Admin access required');
			}
			throw error(response.status, 'Failed to fetch movies without status');
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		console.error('Error fetching movies without status:', err);
		throw error(500, 'Internal server error');
	}
};