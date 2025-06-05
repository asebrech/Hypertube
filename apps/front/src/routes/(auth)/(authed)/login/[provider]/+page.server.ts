import { SECRET_BACK_REDIRECT_URL } from '$env/static/private';
import { redirect, type RequestEvent } from '@sveltejs/kit';

export const actions = {
	default: async ({ params }: RequestEvent) => {
		const url = `${SECRET_BACK_REDIRECT_URL}/${params.provider}/redirect`;
		redirect(302, url);
	}
};
