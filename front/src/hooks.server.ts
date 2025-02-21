import type { Handle } from '@sveltejs/kit';
import axios from 'axios';

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session');

  if (!session) {
    return await resolve(event);
  }

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'http://back:3333/me',
    headers: {
      Authorization: `Bearer ${session}`
    }
  };

  try {
    const response = await axios.request(config);

    const data = response.data;

    event.locals.user = {
      email: data.email,
      id: data.id
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
      return new Response('Unauthorized', { status: 401 });
    } else {
      throw error;
    }
  }

  return await resolve(event);
};
