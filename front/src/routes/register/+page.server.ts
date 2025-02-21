import { fail, redirect, type RequestEvent } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  if (locals.user) {
    redirect(302, '/');
  }
};

const register = async ({ request }: RequestEvent) => {
  const data = await request.formData();
  const username = data.get('username');
  const password = data.get('password');

  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return fail(400, { invalid: true });
  }

  const response = await fetch('http://back:3333/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: username, password, fullName: 'John Doe', name: 'john' })
  });

  if (!response.ok) {
    return fail(400, { user: true });
  }

  const user = await response.json();

  console.log(user);

  redirect(303, '/login');
};

export const actions = { register };
