import { redirect, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';

export const load = async () => {
  redirect(302, '/');
};

const logout = async ({ cookies }: RequestEvent) => {
  const session = cookies.get('session');

  if (!session) {
    redirect(303, '/');
  }

  const config = {
    method: 'post',
    url: `${process.env.BACK_URL}/user/logout`,
    headers: {
      Authorization: `Bearer ${session}`
    }
  };

  await axios.request(config);

  cookies.set('session', '', {
    path: '/',
    expires: new Date(0)
  });

  redirect(303, '/');
};

export const actions = { default: logout };
