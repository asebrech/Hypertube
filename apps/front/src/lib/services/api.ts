import axios from 'axios';
import { locale } from 'svelte-i18n';
import { PUBLIC_BACK_URL } from '$env/static/public';
import { get } from 'svelte/store';
import type {
	ImageSizeType,
	Movie,
	MovieCredits,
	MovieDetails,
	MovieType,
	Comment,
	PaginatedComments,
	PersonDetails
} from '@hypertube/shared';

export async function getMovies(
	page_to_load: number,
	type: MovieType = 'movie',
	token: string | null = null
) {
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

export async function getMovieDiscover(
	genreIds: number[] | undefined,
	castId: number | undefined,
	page: number,
	type: MovieType = 'movie',
	releaseYear: string | undefined,
	originalLanguage: string | undefined = undefined,
	sortBy: string,
	token: string | null = null
) {
	const params: Record<string, any> = {
		page,
		type,
		sortBy,
		lang: get(locale)
	};

	if (genreIds && genreIds.length > 0) params.genreId = genreIds.join(',');
	if (castId) params.castId = castId;
	if (releaseYear) params.releaseYear = releaseYear;
	if (originalLanguage) params.originalLanguage = originalLanguage;

	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/discover`,
		params,
		headers: {
			...(token && { Authorization: `Bearer ${token}` })
		}
	};

	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movie discover:', error);
		throw error;
	}
}

export async function getMovieDetails(
	movieId: number,
	type: MovieType = 'movie'
): Promise<MovieDetails> {
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

export async function getBackdropImage(
	movieId: any,
	size: ImageSizeType,
	type: MovieType = 'movie'
) {
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

export async function getGenresList() {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/genres`,
		params: {
			lang: get(locale)
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching genres:', error);
		throw error;
	}
}

export async function getSimilarMovies(
	movieId: number,
	page: number,
	type: MovieType = 'movie'
): Promise<{ movies: Movie[]; hasMorePages: boolean }> {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/similar`,
		params: {
			tmdb_movie_id: String(movieId),
			page: page,
			lang: get(locale),
			type: type
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching similar movies:', error);
		throw error;
	}
}

export async function getMovieCredits(
	movieId: number,
	type: MovieType = 'movie'
): Promise<MovieCredits> {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/credits`,
		params: {
			tmdb_movie_id: String(movieId),
			lang: get(locale),
			type: type
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movie credits:', error);
		throw error;
	}
}

export async function getPeopleDetails(castId: number): Promise<PersonDetails> {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movies/people`,
		params: {
			tmdb_people_id: castId,
			lang: get(locale)
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching people details:', error);
		throw error;
	}
}

// Comment API functions
export async function getMovieComments(
	movieId: number,
	page: number = 1,
	limit: number = 20,
	token: string
): Promise<PaginatedComments> {
	const config = {
		method: 'get',
		url: `${PUBLIC_BACK_URL}/movie/${movieId}/comments`,
		params: {
			page,
			limit
		},
		headers: {
			Authorization: `Bearer ${token}`
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error fetching movie comments:', error);
		throw error;
	}
}

export async function createMovieComment(
	movieId: number,
	content: string,
	token: string
): Promise<Comment> {
	const config = {
		method: 'post',
		url: `${PUBLIC_BACK_URL}/movie/${movieId}/comments`,
		data: {
			content
		},
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	};
	try {
		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error creating comment:', error);
		throw error;
	}
}

export async function deleteComment(commentId: number, token: string): Promise<void> {
	try {
		const config = {
			method: 'delete',
			url: `${PUBLIC_BACK_URL}/comments/${commentId}`,
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		await axios(config);
	} catch (error) {
		console.error('Error deleting comment:', error);
		throw error;
	}
}

export async function updateComment(
	commentId: number,
	content: string,
	token: string
): Promise<Comment> {
	try {
		const config = {
			method: 'patch',
			url: `${PUBLIC_BACK_URL}/comments/${commentId}`,
			data: {
				content
			},
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		};

		const response = await axios(config);
		return response.data;
	} catch (error) {
		console.error('Error updating comment:', error);
		throw error;
	}
}