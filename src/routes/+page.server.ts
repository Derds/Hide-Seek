import { redirect, fail } from '@sveltejs/kit';
import { games, players, suggestSeekerCount } from '$lib/server/db.js';

export const actions = {
  create: async ({ request, cookies }) => {
    const data = await request.formData();
    const name = (data.get('name') as string)?.trim();
    if (!name) return fail(400, { error: 'Name is required', tab: 'create' });

    const code = games.create(1); // seeker count adjusted in lobby
    const playerId = players.join(code, name);

    cookies.set('playerId', playerId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 });
    cookies.set('isCreator', code, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 });
    redirect(303, `/game/${code}`);
  },

  join: async ({ request, cookies }) => {
    const data = await request.formData();
    const code = (data.get('code') as string)?.trim().toUpperCase();
    const name = (data.get('name') as string)?.trim();

    if (!code) return fail(400, { error: 'Game code is required', tab: 'join' });
    if (!name) return fail(400, { error: 'Name is required', tab: 'join' });

    const game = games.get(code);
    if (!game) return fail(404, { error: `No game found with code ${code}`, tab: 'join' });
    if (game.status !== 'waiting') return fail(400, { error: 'This game has already started', tab: 'join' });

    const playerId = players.join(code, name);
    cookies.set('playerId', playerId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 });
    redirect(303, `/game/${code}`);
  }
};
