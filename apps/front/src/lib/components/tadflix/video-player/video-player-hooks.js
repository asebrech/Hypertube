import { PUBLIC_BACK_URL } from '$env/static/public';

// API service for video player operations
export class VideoPlayerAPI {
	constructor(token, movieId) {
		this.token = token;
		this.movieId = movieId;
		this.headers = {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` })
		};
	}

	async markAsWatched() {
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

	async saveProgress(currentTime) {
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

	async getProgress() {
		if (!this.token) return 0;

		try {
			const response = await fetch(`${PUBLIC_BACK_URL}/movies/${this.movieId}/progress`, {
				headers: this.headers
			});

			if (response.ok) {
				const data = await response.json();
				return data.progress || 0;
			}
		} catch (error) {
			console.error('Error getting watch progress:', error);
		}
		return 0;
	}
}

// Authentication hooks for Video.js
export class VideoPlayerHooks {
	static createAuthHook(token) {
		return (options) => {
			if (!options.headers) {
				options.headers = {};
			}
			if (token) {
				options.headers.Authorization = `Bearer ${token}`;
			}
			return options;
		};
	}

	static setupAuthentication(token, videojs) {
		if (!token || typeof videojs === 'undefined' || !videojs.Vhs) return;
		
		videojs.Vhs.xhr.onRequest(VideoPlayerHooks.createAuthHook(token));
	}
}
