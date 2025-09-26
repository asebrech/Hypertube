import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getUserByUsername } from '$lib/services/api';

export const load: PageLoad = async ({ params, parent }) => {
	const parentData = await parent();
	const currentUser = parentData.user;
	const token = parentData.token;
	const username = params.username ? decodeURIComponent(params.username) : null;

	if (!username) {
		throw error(404, 'Username not found');
	}

	try {
		const profileUser = await getUserByUsername(username);

		if (!profileUser) {
			throw error(404, 'User not found');
		}

		// Check if this is the current user's own profile
		const isOwnProfile = currentUser?.username === username;

		return {
			profileUser,
			isOwnProfile,
			currentUser: {
				...currentUser,
				token: token
			}
		};
	} catch (err) {
		console.error('Error loading user profile:', err);
		throw error(404, 'User not found');
	}
};
