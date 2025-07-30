import { PUBLIC_BACK_URL } from '$env/static/public';
import type { PageServerLoad } from './$types';

type LoadResult = {
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
};

function getPreferredResolution(resolutions: {
	'480p': boolean;
	'720p': boolean;
	'1080p': boolean;
}): string | null {
	if (resolutions['1080p']) return '1080';
	if (resolutions['720p']) return '720';
	if (resolutions['480p']) return '480';
	return null;
}

function getAvailableResolutions(resolutions: {
	'480p': boolean;
	'720p': boolean;
	'1080p': boolean;
}): string[] {
	const available: string[] = [];
	if (resolutions['480p']) available.push('480');
	if (resolutions['720p']) available.push('720');
	if (resolutions['1080p']) available.push('1080');
	return available;
}

export const load: PageServerLoad = async ({ params, fetch, cookies }): Promise<LoadResult> => {
	const movieId = params.id!;
	const token = cookies.get('session');

	const headers: HeadersInit = {};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const torrentResponse = await fetch(`${PUBLIC_BACK_URL}/torrent/${movieId}`, {
		headers
	});
	if (!torrentResponse.ok) {
		throw new Error('Failed to fetch torrent data');
	}

	const readinessResponse = await fetch(`${PUBLIC_BACK_URL}/torrent/ready/${movieId}`, {
		headers
	});
	if (!readinessResponse.ok) {
		throw new Error('Failed to check video readiness');
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
};
