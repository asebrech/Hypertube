import { PUBLIC_BACK_URL } from '$env/static/public';

interface VideoPlayerAPIHeaders {
	'Content-Type': string;
	Authorization?: string;
}

// API service for video player operations
export class VideoPlayerAPI {
	private token: string | undefined;
	private movieId: string;
	private headers: VideoPlayerAPIHeaders;

	constructor(token: string | undefined, movieId: string) {
		this.token = token;
		this.movieId = movieId;
		this.headers = {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` })
		};
	}

	async markAsWatched(): Promise<boolean> {
		if (!this.token) return false;

		try {
			const response = await fetch(`${PUBLIC_BACK_URL}/movies/${this.movieId}/watched`, {
				method: 'POST',
				headers: this.headers
			});
			return response.ok;
		} catch (error) {
			console.error('Error marking movie as watched:', error);
			return false;
		}
	}

	async saveProgress(currentTime: number): Promise<boolean> {
		if (!this.token) return false;

		try {
			const response = await fetch(`${PUBLIC_BACK_URL}/movies/${this.movieId}/progress`, {
				method: 'POST',
				headers: this.headers,
				body: JSON.stringify({ currentTime })
			});
			return response.ok;
		} catch (error) {
			console.error('Error saving watch progress:', error);
			return false;
		}
	}

	async getProgress(): Promise<number> {
		if (!this.token) return 0;

		try {
			const response = await fetch(`${PUBLIC_BACK_URL}/movies/${this.movieId}/progress`, {
				headers: this.headers
			});

			if (!response.ok) return 0;

			const data = await response.json();
			return data.currentTime || 0;
		} catch (error) {
			console.error('Error fetching watch progress:', error);
			return 0;
		}
	}
}

interface XHROptions {
	headers?: Record<string, string>;
	[key: string]: unknown;
}

interface VideoJSWithVhs {
	Vhs?: {
		xhr?: {
			beforeRequest?: (options: XHROptions) => XHROptions;
		};
	};
}

// Video.js hooks and authentication
export class VideoPlayerHooks {
	static setupAuthentication(token: string | undefined, videojs: VideoJSWithVhs): void {
		if (!token || !videojs.Vhs) return;

		videojs.Vhs.xhr.beforeRequest = (options: XHROptions) => {
			if (options.headers) {
				options.headers.Authorization = `Bearer ${token}`;
			} else {
				options.headers = { Authorization: `Bearer ${token}` };
			}
			return options;
		};
	}

	static createAuthHook(token: string) {
		return (options: XHROptions) => {
			if (options.headers) {
				options.headers.Authorization = `Bearer ${token}`;
			} else {
				options.headers = { Authorization: `Bearer ${token}` };
			}
			return options;
		};
	}
}
