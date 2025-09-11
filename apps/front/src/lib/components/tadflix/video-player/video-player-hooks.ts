import { PUBLIC_BACK_URL } from '$env/static/public';

export class VideoPlayerAPI {
	private token: string | undefined;
	private movieId: string;
	private headers: Record<string, string>;

	constructor(token: string | undefined, movieId: string) {
		this.token = token;
		this.movieId = movieId;
		this.headers = {
			'Content-Type': 'application/json'
		};
		if (token) {
			this.headers.Authorization = `Bearer ${token}`;
		}
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
			return data.progress || 0;
		} catch (error) {
			console.error('Error fetching watch progress:', error);
			return 0;
		}
	}

	async fetchAvailableSubtitles(): Promise<string[]> {
		try {
			const response = await fetch(`${PUBLIC_BACK_URL}/movies/${this.movieId}/subtitles`, {
				headers: this.headers
			});

			if (response.ok) {
				const data = await response.json();
				return data.availableLanguages || [];
			} else {
				console.warn('Failed to fetch subtitles:', response.statusText);
				return [];
			}
		} catch (error) {
			console.error('Error fetching subtitles:', error);
			return [];
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
		if (!token) return;

		if (videojs.Vhs?.xhr) {
			videojs.Vhs.xhr.beforeRequest = (options: XHROptions) => {
				if (options.headers) {
					options.headers.Authorization = `Bearer ${token}`;
				} else {
					options.headers = { Authorization: `Bearer ${token}` };
				}
				return options;
			};
		}
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
