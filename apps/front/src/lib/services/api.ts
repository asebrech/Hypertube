import axios from 'axios';
import { locale } from 'svelte-i18n';
import { PUBLIC_BACK_URL } from '$env/static/public';
import { get } from 'svelte/store';
import type { Comment, MovieDetails, PaginationType } from '@hypertube/shared';

export async function getMovies(page_to_load: number) {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies`,
		params: {
			page: page_to_load,
			lang: get(locale)
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

export async function getMovieDetails(movieId: number): Promise<MovieDetails> {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/${movieId}`,
		params: {
			lang: get(locale)
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

export async function getBackdropImage(movieId: any, size: string) {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/backdropImage`,
		params: {
			tmdb_movie_id: movieId,
			size: size,
			lang: get(locale)
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

export async function getPosterImage(movieId: any, size: string) {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/posterImage`,
		params: {
			tmdb_movie_id: movieId,
			size: size,
			lang: get(locale)
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

export async function getLogoImage(movieId: any, size: string) {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/logoImage`,
		params: {
			tmdb_movie_id: movieId,
			size: size,
			lang: get(locale)
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

export async function getMovieVideos(movieId: number) {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/${movieId}/videos`,
		params: {
			lang: get(locale)
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

export async function getMovieComments(imdbId: number): Promise<PaginationType<Comment>> {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/comments/${imdbId}`
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movie comments:', error);
		throw error;
	}
}
