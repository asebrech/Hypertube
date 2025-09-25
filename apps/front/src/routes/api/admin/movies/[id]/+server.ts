import { json, error } from '@sveltejs/kit';
import { SECRET_BACK_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

// DELETE /api/admin/movies/[id] - Delete a specific movie
export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	const session = cookies.get('session');
	const movieId = params.id;

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	if (!movieId) {
		throw error(400, 'Movie ID is required');
	}

	try {
		const response = await fetch(`${SECRET_BACK_URL}/admin/movies/${movieId}`, {
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
			} else if (response.status === 404) {
				throw error(404, 'Movie not found');
			}
			throw error(response.status, 'Failed to delete movie');
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		console.error('Error deleting movie:', err);
		throw error(500, 'Internal server error');
	}
};
