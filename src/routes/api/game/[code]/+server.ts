import { json, error } from '@sveltejs/kit';
import { games, players, suggestSeekerCount } from '$lib/server/db.js';

// GET /api/game/[code]  — get game state + player list
export async function GET({ params }) {
  const game = games.get(params.code);
  if (!game) error(404, 'Game not found');

  const playerList = players.list(params.code);
  const suggested = suggestSeekerCount(playerList.length);

  return json({ game, players: playerList, suggestedSeekerCount: suggested });
}
