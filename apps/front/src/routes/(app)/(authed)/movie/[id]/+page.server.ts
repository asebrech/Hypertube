import { getMovieComments, getMovieDetails } from '@/services/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	let tmdbId = Number(params.id);
	let movie = await getMovieDetails(tmdbId);
	let comments = await getMovieComments(tmdbId);
	console.log(comments)
	return {
		movie,
		comments
	};
};
