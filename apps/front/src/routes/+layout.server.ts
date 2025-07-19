import type { RequestEvent } from '@sveltejs/kit';

export const load = async ({ locals, cookies }: RequestEvent) => {
  const session = cookies.get('session');
  return {
    user: locals.user,
    token: session
  };
};
