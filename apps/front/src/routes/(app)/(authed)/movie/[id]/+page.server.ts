import { PUBLIC_BACK_URL } from '$env/static/public';
import type { PageServerLoad } from './$types';

type VideoReadiness = {
	resolution: string;
	ready: boolean;
};

type LoadResult = {
	movieId: string;
	videoReadiness: VideoReadiness[];
	isAllVideoReady: boolean;
	preferredResolution: string | null;
	availableResolutions: string[];
};

async function checkVideoReadiness(
	movieId: string,
	resolution: string,
	fetch: typeof globalThis.fetch
): Promise<boolean> {
	try {
		const response = await fetch(`${PUBLIC_BACK_URL}/torrent/${resolution}/${movieId}`);
		const data = await response.json();
		return data.status === 200;
	} catch (error) {
		console.error(`Error checking ${resolution}p readiness:`, error);
		return false;
	}
}

function getPreferredResolution(readyResolutions: string[]): string | null {
	const preferenceOrder = ['1080', '720', '480'];
	for (const resolution of preferenceOrder) {
		if (readyResolutions.includes(resolution)) {
			return resolution;
		}
	}
	return null;
}

export const load: PageServerLoad = async ({ params, fetch }): Promise<LoadResult> => {
	const movieId = params.id!;

	const response = await fetch(`${PUBLIC_BACK_URL}/torrent/${movieId}`);
	if (!response.ok) {
		throw new Error('Failed to fetch torrent data');
	}

	const resolutions = ['480', '720', '1080'];
	const readinessChecks = await Promise.all(
		resolutions.map(async (resolution) => ({
			resolution,
			ready: await checkVideoReadiness(movieId, resolution, fetch)
		}))
	);

	const readyResolutions = readinessChecks
		.filter((check) => check.ready)
		.map((check) => check.resolution);

	const preferredResolution = getPreferredResolution(readyResolutions);
	const isAllVideoReady = readyResolutions.length === resolutions.length;

	return {
		movieId,
		videoReadiness: readinessChecks,
		isAllVideoReady,
		preferredResolution,
		availableResolutions: readyResolutions
	};
};
