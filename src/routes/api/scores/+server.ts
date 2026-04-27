import { json } from '@sveltejs/kit';
import { scores } from '$lib/server/db.js';

// GET /api/scores  — global leaderboards
export async function GET() {
  return json({
    topFinders: scores.topFinders(),
    longestHiders: scores.longestHiders()
  });
}
