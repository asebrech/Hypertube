// Video player configuration constants
export const VIDEO_CONFIG = {
	POLL_INTERVAL: 5000,
	TIMEOUT_DURATION: 300000,
	WATCH_TIME_CHECK_INTERVAL: 1000,
	PROGRESS_SAVE_INTERVAL: 10000,
	RESOLUTIONS: [
		{ label: '480p', value: '480' },
		{ label: '720p', value: '720' },
		{ label: '1080p', value: '1080' }
	]
} as const;

export interface Resolution {
	label: string;
	value: string;
	src?: string;
}

// Video player utility functions
export class VideoPlayerUtils {
	static getResolutionSources(baseUrl: string, movieId: string): Resolution[] {
		return VIDEO_CONFIG.RESOLUTIONS.map(res => ({
			...res,
			src: `${baseUrl}/${movieId}/${res.value}p/output.m3u8`
		}));
	}

	static getPreferredSource(availableResolutions: string[], preferredResolution: string = '1080'): Resolution | undefined {
		const readyResolutions = new Set(availableResolutions);
		
		if (readyResolutions.has(preferredResolution)) {
			return VIDEO_CONFIG.RESOLUTIONS.find(res => res.value === preferredResolution);
		}

		const sortedResolutions = ['1080', '720', '480'];
		for (const res of sortedResolutions) {
			if (readyResolutions.has(res)) {
				return VIDEO_CONFIG.RESOLUTIONS.find(r => r.value === res);
			}
		}

		return VIDEO_CONFIG.RESOLUTIONS[0];
	}

	static calculateWatchPercentage(currentTime: number, duration: number): number {
		if (!duration || duration === 0) return 0;
		return (currentTime / duration) * 100;
	}

	static shouldMarkAsWatched(percentage: number): boolean {
		return percentage >= 90;
	}

	static shouldSaveProgress(percentage: number, duration: number): boolean {
		return percentage >= 1 && percentage <= 95 && duration >= 120;
	}
}
