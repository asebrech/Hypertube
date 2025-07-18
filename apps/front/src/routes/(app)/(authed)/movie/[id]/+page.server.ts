import { PUBLIC_BACK_URL } from '$env/static/public';
import type { LoadEvent } from '@sveltejs/kit';

export const load = async ({ params, fetch }: LoadEvent) => {
    const movieId = params.id;
    console.log('Loading movie with ID:', movieId);
    // const response = await fetch(`${PUBLIC_BACK_URL}/torrent?tmdbId=${movieId}`);
    // if (!response.ok) {
    //     throw new Error('Failed to fetch torrent data');
    // }
    return { movieId };
};
