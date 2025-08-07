import { PUBLIC_BACK_URL } from '$env/static/public';
import type { PageServerLoad } from './$types';

interface LoadResult {
	movieId: string;
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

export const load: PageServerLoad = async ({ params, fetch: fetchFn, cookies }): Promise<LoadResult> => {
	const movieId = params.id!;
	const token = cookies.get('session');

	const defaultResult: LoadResult = {
		movieId,
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
			return {
				...defaultResult,
				error: torrentResponse.status === 404 ? 'Movie not found' : 'Failed to fetch movie data'
			};
		}

		// Check video readiness
		const readinessResponse = await fetchWithAuth(`${PUBLIC_BACK_URL}/torrent/ready/${movieId}`, token, fetchFn);
		if (!readinessResponse.ok) {
			return {
				...defaultResult,
				error: 'Failed to check video readiness'
			};
		}

		const readinessData = await readinessResponse.json();
		const availableResolutions = getAvailableResolutions(readinessData.resolutions);
		const preferredResolution = getPreferredResolution(readinessData.resolutions);

		return {
			movieId,
			isAllVideoReady: readinessData.allReady,
			preferredResolution,
			availableResolutions,
			resolutions: readinessData.resolutions,
			token
		};
	} catch (error) {
		console.error('Error loading movie data:', error);
		return {
			...defaultResult,
			error: 'Network error occurred'
		};
	}
};
