import { json, error } from '@sveltejs/kit';
import { games, players, suggestSeekerCount } from '$lib/server/db.js';

// POST /api/game/[code]/players  — join a game
export async function POST({ params, request }) {
  const game = games.get(params.code);
  if (!game) error(404, 'Game not found');
  if (game.status !== 'waiting') error(400, 'Game has already started');

  const { name } = await request.json();
  if (!name?.trim()) error(400, 'Name is required');

  const playerId = players.join(params.code, name.trim());
  const playerCount = games.playerCount(params.code);
  const suggested = suggestSeekerCount(playerCount);

  return json({ playerId, suggestedSeekerCount: suggested }, { status: 201 });
}
