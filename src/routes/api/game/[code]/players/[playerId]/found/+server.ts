import { json, error } from '@sveltejs/kit';
import { players } from '$lib/server/db.js';

// POST /api/game/[code]/players/[playerId]/found  — mark a player as found
export async function POST({ params, request }) {
  const player = players.get(params.playerId);
  if (!player || player.game_id !== params.code) error(404, 'Player not found');
  if (player.found_at) error(400, 'Player is already found');

  const { foundBy } = await request.json();
  if (!foundBy?.trim()) error(400, 'foundBy (seeker name) is required');

  const result = players.markFound(params.playerId, foundBy.trim());
  return json({ success: true, ...result });
}
