import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getUserByUsername } from '$lib/services/api';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
	const username = params.username ? decodeURIComponent(params.username) : null;

	if (!username) {
		throw error(404, 'Username not found');
	}

	try {
		const profileUser = await getUserByUsername(username);

		if (!profileUser) {
			throw error(404, 'User not found');
		}

		const currentUser = locals.user;
		const token = cookies.get('session');

		const isOwnProfile = currentUser?.username === username;

		return {
			profileUser,
			isOwnProfile,
			currentUser: currentUser
				? {
						...currentUser,
						token: token
					}
				: null,
			token: token,
			user: currentUser
		};
	} catch (err) {
		console.error('Error loading user profile:', err);
		throw error(404, 'User not found');
	}
};
