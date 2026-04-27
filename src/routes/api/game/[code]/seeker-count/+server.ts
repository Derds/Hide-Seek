import { json, error } from '@sveltejs/kit';
import { games, suggestSeekerCount } from '$lib/server/db.js';

// PATCH /api/game/[code]/seeker-count  — update seeker count before game starts
export async function PATCH({ params, request }) {
  const game = games.get(params.code);
  if (!game) error(404, 'Game not found');
  if (game.status !== 'waiting') error(400, 'Cannot change seeker count after game starts');

  const { count } = await request.json();
  const playerCount = games.playerCount(params.code);

  if (!Number.isInteger(count) || count < 1) error(400, 'count must be a positive integer');
  if (count >= playerCount) error(400, 'Must have at least one hider');

  games.updateSeekerCount(params.code, count);
  return json({ count, suggested: suggestSeekerCount(playerCount) });
}
