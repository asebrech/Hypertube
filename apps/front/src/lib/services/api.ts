import axios from 'axios';
import { locale } from 'svelte-i18n';
import { PUBLIC_BACK_URL } from '$env/static/public';
import { get } from 'svelte/store';
import type { ImageSizeType, MovieDetails, MovieType } from '@hypertube/shared';

export async function getMovies(page_to_load: number, type: MovieType = 'movie', token: string | null = null) {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies`,
		params: {
			page: page_to_load,
			lang: get(locale),
			type: type
		},
		headers: {
			...(token && { Authorization: `Bearer ${token}` })
		},
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movies:', error);
		throw error;
	}
}

export async function getMovieDetails(movieId: number, type: MovieType = 'movie'): Promise<MovieDetails> {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/${movieId}`,
		params: {
			lang: get(locale),
			type: type
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movie details:', error);
		throw error;
	}
}

export async function getBackdropImage(movieId: any, size: ImageSizeType, type: MovieType = 'movie') {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/backdropImage`,
		params: {
			tmdb_movie_id: movieId,
			size: size,
			lang: get(locale),
			type: type
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movies:', error);
		throw error;
	}
}

export async function getPosterImage(movieId: any, size: ImageSizeType, type: MovieType = 'movie') {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/posterImage`,
		params: {
			tmdb_movie_id: movieId,
			size: size,
			lang: get(locale),
			type: type
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movies:', error);
		throw error;
	}
}

export async function getLogoImage(movieId: any, size: ImageSizeType, type: MovieType = 'movie') {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/logoImage`,
		params: {
			tmdb_movie_id: movieId,
			size: size,
			lang: get(locale),
			type: type
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movies:', error);
		throw error;
	}
}

export async function getMovieVideos(movieId: number, type: MovieType = 'movie') {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/${movieId}/videos`,
		params: {
			lang: get(locale),
			type: type
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movie videos:', error);
		throw error;
	}
}

export async function getMovieSearch(
	query: string,
	page: number,
	type: MovieType = 'movie',
	options?: { signal?: AbortSignal }
) {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/search`,
		params: {
			query: query,
			lang: get(locale),
			page: page,
			type: type
		},
		...(options?.signal ? { signal: options.signal } : {})
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movie search:', error);
		throw error;
	}
}
