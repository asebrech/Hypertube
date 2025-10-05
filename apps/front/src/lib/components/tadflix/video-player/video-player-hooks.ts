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

interface ExtendedXMLHttpRequest extends XMLHttpRequest {
	_requestUrl?: string;
}

// Video.js hooks and authentication
export class VideoPlayerHooks {
	private static originalXHR: {
		open?: typeof XMLHttpRequest.prototype.open;
		send?: typeof XMLHttpRequest.prototype.send;
	} = {};

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

		if (!this.originalXHR.open) {
			this.originalXHR.open = XMLHttpRequest.prototype.open;
			this.originalXHR.send = XMLHttpRequest.prototype.send;

			XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
				(this as ExtendedXMLHttpRequest)._requestUrl = url.toString();
				return VideoPlayerHooks.originalXHR.open!.call(this, method, url, async, user, password);
			};

			XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
				const requestUrl = (this as ExtendedXMLHttpRequest)._requestUrl;
				if (requestUrl && requestUrl.includes('/subtitles/')) {
					this.setRequestHeader('Authorization', `Bearer ${token}`);
				}
				return VideoPlayerHooks.originalXHR.send!.call(this, body);
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
