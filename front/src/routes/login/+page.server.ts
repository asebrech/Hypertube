import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import axios from 'axios';
import { SECRET_BACK_URL } from '$env/static/private';

export const load = async ({ locals }: { locals: App.Locals }) => {
  if (locals.user) {
    redirect(302, '/');
  }
};

const login = async ({ cookies, request }: RequestEvent) => {
  const data = await request.formData();
  const email = data.get('email');
  const password = data.get('password');

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return fail(400, { invalid: true });
  }

  const payload = JSON.stringify({
    email,
    password
  });

  const config = {
    method: 'post',
    url: `${SECRET_BACK_URL}/user/login`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: payload
  };

  try {
    const response = await axios.request(config);
    const token = response.data.token.token;
    cookies.set('session', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: 60 * 60 * 24 * 30
    });
    redirect(302, '/');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      switch (error.response.status) {
        case 400:
          return fail(400, { credentials: true });
        case 422:
          return fail(400, { invalid: true });
        default:
          throw error;
      }
    } else {
      throw error;
    }
  }
};

export const actions = { login };
