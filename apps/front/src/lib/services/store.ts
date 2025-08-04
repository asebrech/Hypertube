import { writable } from 'svelte/store';
import type { MovieType, MovieDetails, MovieVideo, BackDropImage, Movie } from '@hypertube/shared';

export const user = writable<{ id: number; email: string }>();
export const is18Ready = writable<boolean>(false);
export const searchQuery = writable<string>('');
export const openHoverCardId = writable<string | null>(null);

// Modal store for movie details with navigation history
export const movieModal = writable<{
	isOpen: boolean;
	movieId?: number;
	type?: MovieType;
	history: Array<{ movieId: number; type: MovieType }>;
}>({
	isOpen: false,
	movieId: undefined,
	type: undefined,
	history: []
});

// Cache for movie data to avoid reloading
export const movieDataCache = writable<{
	[key: string]: {
		details?: MovieDetails;
		video?: MovieVideo;
		logo?: BackDropImage;
		similarMovies?: Movie[];
	};
}>({});

// Helper functions for modal navigation
export const movieModalActions = {
	open: (movieId: number, type: MovieType) => {
		movieModal.update((state) => ({
			...state,
			isOpen: true,
			movieId,
			type,
			history: [] // Reset history when opening fresh
		}));
	},

	navigateTo: (movieId: number, type: MovieType) => {
		movieModal.update((state) => {
			// Add current movie to history if it exists
			const newHistory =
				state.movieId && state.type
					? [...state.history, { movieId: state.movieId, type: state.type }]
					: state.history;

			return {
				...state,
				movieId,
				type,
				history: newHistory
			};
		});
	},

	goBack: () => {
		movieModal.update((state) => {
			if (state.history.length === 0) return state;

			const previous = state.history[state.history.length - 1];
			const newHistory = state.history.slice(0, -1);

			return {
				...state,
				movieId: previous.movieId,
				type: previous.type,
				history: newHistory
			};
		});
	},

	close: () => {
		movieModal.set({
			isOpen: false,
			movieId: undefined,
			type: undefined,
			history: []
		});
	}
};
