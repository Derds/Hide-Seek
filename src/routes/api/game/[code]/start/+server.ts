import { json, error } from '@sveltejs/kit';
import { games } from '$lib/server/db.js';

// POST /api/game/[code]/start  — start game, randomly assign seekers
export async function POST({ params }) {
  const game = games.get(params.code);
  if (!game) error(404, 'Game not found');
  if (game.status !== 'waiting') error(400, 'Game has already started');

  const playerCount = games.playerCount(params.code);
  if (playerCount < 2) error(400, 'Need at least 2 players to start');

  try {
    games.start(params.code);
  } catch (e: unknown) {
    error(400, e instanceof Error ? e.message : 'Could not start game');
  }

  return json({ success: true });
}
