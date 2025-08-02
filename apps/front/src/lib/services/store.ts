import { writable } from 'svelte/store';
import type { MovieType } from '@hypertube/shared';

export const user = writable<{ id: number; email: string }>();
export const is18Ready = writable<boolean>(false);
export const searchQuery = writable<string>('');
export const openHoverCardId = writable<string | null>(null);

// Modal store for movie details
export const movieModal = writable<{
	isOpen: boolean;
	movieId?: number;
	type?: MovieType;
}>({
	isOpen: false,
	movieId: undefined,
	type: undefined
});
