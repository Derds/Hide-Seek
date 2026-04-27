import { redirect, fail, error } from '@sveltejs/kit';
import { games, players, suggestSeekerCount } from '$lib/server/db.js';

export async function load({ params, cookies }) {
  const game = games.get(params.code);
  if (!game) error(404, 'Game not found');
  if (game.status === 'active') redirect(303, `/game/${params.code}/play`);
  if (game.status === 'ended') redirect(303, `/game/${params.code}/summary`);

  const playerList = players.list(params.code);
  const suggested = suggestSeekerCount(playerList.length);
  const isCreator = cookies.get('isCreator') === params.code;

  return { game, players: playerList, suggested, isCreator };
}

export const actions = {
  start: async ({ params, cookies }) => {
    const game = games.get(params.code);
    if (!game) error(404, 'Game not found');
    if (cookies.get('isCreator') !== params.code) return fail(403, { error: 'Only the creator can start the game' });

    const count = games.playerCount(params.code);
    if (count < 2) return fail(400, { error: 'Need at least 2 players to start' });

    games.start(params.code);
    redirect(303, `/game/${params.code}/play`);
  },

  setSeekerCount: async ({ params, request, cookies }) => {
    if (cookies.get('isCreator') !== params.code) return fail(403, { error: 'Only the creator can change this' });
    const data = await request.formData();
    const count = parseInt(data.get('count') as string);
    const playerCount = games.playerCount(params.code);

    if (!count || count < 1 || count >= playerCount) return fail(400, { error: 'Invalid seeker count' });
    games.updateSeekerCount(params.code, count);
  }
};
