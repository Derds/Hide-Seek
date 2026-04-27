import { json } from '@sveltejs/kit';
import { games, suggestSeekerCount } from '$lib/server/db.js';

// POST /api/game  — create a new game
export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  const playerCount: number = body.playerCount ?? 0;
  const seekerCount: number = body.seekerCount ?? suggestSeekerCount(playerCount);

  const code = games.create(seekerCount);
  return json({ code, seekerCount }, { status: 201 });
}
