import { writable } from 'svelte/store';

export const user = writable<{ id: number; email: string }>();
export const is18Ready = writable<boolean>(false);
export const searchQuery = writable<string>('');
export const openHoverCardId = writable<string | null>(null);
