import { json, error } from '@sveltejs/kit';
import { games } from '$lib/server/db.js';

// POST /api/game/[code]/end  — manually end the game
export async function POST({ params }) {
  const game = games.get(params.code);
  if (!game) error(404, 'Game not found');
  if (game.status === 'ended') error(400, 'Game is already ended');

  games.end(params.code);
  return json({ success: true });
}
