import { writable } from 'svelte/store';
import type {
	MovieType,
	MovieDetails,
	MovieVideo,
	BackDropImage,
	Movie,
	MovieCredits
} from '@hypertube/shared';

export const user = writable<{ id: number; email: string }>();
export const is18Ready = writable<boolean>(false);
export const searchQuery = writable<string>('');
export const openHoverCardId = writable<string | null>(null);

// Video state management for auto-muting
export const videoState = writable<{
	bannerVideoPlaying: boolean;
	previewVideoPlaying: boolean;
	modalBannerVideoPlaying: boolean;
}>({
	bannerVideoPlaying: false,
	previewVideoPlaying: false,
	modalBannerVideoPlaying: false
});

// Modal store for movie details with navigation history
export const movieModal = writable<{
	isOpen: boolean;
	movieId?: number;
	type?: MovieType;
	history: Array<{ movieId: number; type: MovieType }>;
	isLoading: boolean;
}>({
	isOpen: false,
	movieId: undefined,
	type: undefined,
	history: [],
	isLoading: false
});

// Cache for movie data to avoid reloading
export const movieDataCache = writable<{
	[key: string]: {
		isAvailable?: boolean;
		details?: MovieDetails;
		video?: MovieVideo;
		logo?: BackDropImage;
		credits?: MovieCredits;
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
			history: [], // Reset history when opening fresh
			isLoading: true
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
				history: newHistory,
				isLoading: true
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
				history: newHistory,
				isLoading: true
			};
		});
	},

	setLoading: (isLoading: boolean) => {
		movieModal.update((state) => ({
			...state,
			isLoading
		}));
	},

	close: () => {
		movieModal.set({
			isOpen: false,
			movieId: undefined,
			type: undefined,
			history: [],
			isLoading: false
		});
	}
};
