import axios from 'axios';
import { locale } from 'svelte-i18n';
import { PUBLIC_BACK_URL } from '$env/static/public';
import { get } from 'svelte/store';

export async function getMovies(page_to_load: number) {
	const token = localStorage.getItem('token')
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies`,
		params: {
			page: page_to_load,
			lang: get(locale)
		},
		headers: {
			Authorization: token ? `Bearer ${token}` : ''
		},
		withCredentials: true
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movies:', error);
		throw error;
	}
}

export async function getMovieDetails(movieId: number) {
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
