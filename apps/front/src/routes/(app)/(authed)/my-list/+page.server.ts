import type { RequestEvent } from '@sveltejs/kit';
import { SECRET_BACK_URL } from '$env/static/private';
import axios from 'axios';

export async function load({ locals, cookies }: RequestEvent) {
	const token = cookies.get('session');
	
	if (!locals.user || !token) {
		return {
			bookmarkedMovies: [],
			watchedMovies: [],
			error: 'Not authenticated'
		};
	}

	try {
		// Fetch bookmarked movies
		const bookmarkedResponse = await axios.get(`${SECRET_BACK_URL}/movies/user`, {
			headers: {
				Authorization: `Bearer ${token}`
			},
			params: {
				isBookmarked: true,
				page: 1,
				limit: 50 // Get more items for initial load
			}
		});

		// Fetch watched movies
		const watchedResponse = await axios.get(`${SECRET_BACK_URL}/movies/user`, {
			headers: {
				Authorization: `Bearer ${token}`
			},
			params: {
				isWatched: true,
				page: 1,
				limit: 50 // Get more items for initial load
			}
		});

		return {
			bookmarkedMovies: bookmarkedResponse.data.movies || [],
			watchedMovies: watchedResponse.data.movies || [],
			bookmarkedPagination: bookmarkedResponse.data.pagination || {},
			watchedPagination: watchedResponse.data.pagination || {},
			token
		};
	} catch (error) {
		console.error('Error fetching user movies:', error);
		return {
			bookmarkedMovies: [],
			watchedMovies: [],
			error: 'Failed to fetch movies'
		};
	}
}