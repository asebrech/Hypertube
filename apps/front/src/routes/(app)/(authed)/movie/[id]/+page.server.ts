import { PUBLIC_BACK_URL } from '$env/static/public';
import { getMovieDetails } from '@/services/api';
import type { PageServerLoad } from './$types';

interface LoadResult {
	movieId: string;
	title: string;
	overview: string;
	isAllVideoReady: boolean;
	preferredResolution: string | null;
	availableResolutions: string[];
	resolutions: {
		'480p': boolean;
		'720p': boolean;
		'1080p': boolean;
	};
	token: string | undefined;
	error?: string;
}

interface ResolutionStatus {
	'480p': boolean;
	'720p': boolean;
	'1080p': boolean;
}

const RESOLUTION_ORDER = ['1080p', '720p', '480p'] as const;

function getPreferredResolution(resolutions: ResolutionStatus): string | null {
	for (const resolution of RESOLUTION_ORDER) {
		if (resolutions[resolution]) {
			return resolution.replace('p', '');
		}
	}
	return null;
}

function getAvailableResolutions(resolutions: ResolutionStatus): string[] {
	return Object.entries(resolutions)
		.filter(([, available]) => available)
		.map(([key]) => key.replace('p', ''));
}

async function fetchWithAuth(url: string, token?: string, fetchFn: typeof fetch = fetch) {
	const headers: HeadersInit = {};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return fetchFn(url, { headers });
}

async function getErrorMessage(response: Response): Promise<string> {
	try {
		const errorData = await response.json();
		if (errorData.message) {
			return errorData.message;
		}
		if (errorData.error) {
			return errorData.error;
		}
		if (errorData.details) {
			return errorData.details;
		}
	} catch {
	}
	return response.statusText || 'Unknown error occurred';
}

export const load: PageServerLoad = async ({ params, fetch: fetchFn, cookies }): Promise<LoadResult> => {
	const movieId = params.id!;
	const token = cookies.get('session');

	const defaultResult: LoadResult = {
		movieId,
		title: '',
		overview: '',
		isAllVideoReady: false,
		preferredResolution: null,
		availableResolutions: [],
		resolutions: { '480p': false, '720p': false, '1080p': false },
		token
	};

	try {
		// Check if torrent exists
		const torrentResponse = await fetchWithAuth(`${PUBLIC_BACK_URL}/torrent/${movieId}`, token, fetchFn);
		if (!torrentResponse.ok) {
			const errorMessage = await getErrorMessage(torrentResponse);
			return {
				...defaultResult,
				error: torrentResponse.status === 404 ? 'Movie not found' : errorMessage
			};
		}

		// Check video readiness
		const readinessResponse = await fetchWithAuth(`${PUBLIC_BACK_URL}/torrent/ready/${movieId}`, token, fetchFn);
		if (!readinessResponse.ok) {
			const errorMessage = await getErrorMessage(readinessResponse);
			return {
				...defaultResult,
				error: errorMessage
			};
		}

		const movieDetails = await getMovieDetails(parseInt(movieId), 'movie', token);

		const readinessData = await readinessResponse.json();
		const availableResolutions = getAvailableResolutions(readinessData.resolutions);
		const preferredResolution = getPreferredResolution(readinessData.resolutions);

		return {
			movieId,
			title: movieDetails.title,
			overview: movieDetails.overview,
			isAllVideoReady: readinessData.allReady,
			preferredResolution,
			availableResolutions,
			resolutions: readinessData.resolutions,
			token
		};
	} catch {
		return {
			...defaultResult,
			error: 'Network error occurred'
		};
	}
};
