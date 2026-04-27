import { redirect, fail, error } from '@sveltejs/kit';
import { games, players } from '$lib/server/db.js';

export async function load({ params, cookies }) {
  const game = games.get(params.code);
  if (!game) error(404, 'Game not found');
  if (game.status === 'waiting') redirect(303, `/game/${params.code}`);
  if (game.status === 'ended') redirect(303, `/game/${params.code}/summary`);

  const playerList = players.list(params.code);
  const playerId = cookies.get('playerId') ?? null;
  const me = playerList.find(p => p.id === playerId) ?? null;
  const isCreator = cookies.get('isCreator') === params.code;

  return { game, players: playerList, me, isCreator };
}

export const actions = {
  markFound: async ({ params, request }) => {
    const data = await request.formData();
    const playerId = data.get('playerId') as string;
    const foundBy = (data.get('foundBy') as string)?.trim();

    if (!foundBy) return fail(400, { error: 'Enter the seeker\'s name' });

    const player = players.get(playerId);
    if (!player || player.game_id !== params.code) return fail(404, { error: 'Player not found' });
    if (player.found_at) return fail(400, { error: 'Already marked as found' });

    players.markFound(playerId, foundBy);
  },

  endGame: async ({ params, cookies }) => {
    if (cookies.get('isCreator') !== params.code) return fail(403, { error: 'Only the creator can end the game' });
    games.end(params.code);
    redirect(303, `/game/${params.code}/summary`);
  }
};
