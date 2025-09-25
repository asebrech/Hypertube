import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Vérifier si l'utilisateur est connecté
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Vérifier si l'utilisateur est admin
	if (!locals.user.isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	return {
		user: locals.user
	};
};
