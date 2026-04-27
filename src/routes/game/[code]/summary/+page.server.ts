import { error } from '@sveltejs/kit';
import { games, players, scores } from '$lib/server/db.js';

export async function load({ params }) {
  const game = games.get(params.code);
  if (!game) error(404, 'Game not found');

  const playerList = players.list(params.code);
  const hiders  = playerList.filter(p => p.role === 'hider');
  const seekers = playerList.filter(p => p.role === 'seeker');

  const gameDurationSecs = game.ended_at
    ? Math.round((new Date(game.ended_at).getTime() - new Date(game.created_at).getTime()) / 1000)
    : null;

  // Found order for hiders
  const foundOrder = [...hiders]
    .filter(p => p.found_at)
    .sort((a, b) => new Date(a.found_at!).getTime() - new Date(b.found_at!).getTime());

  const neverFound = hiders.filter(p => !p.found_at);

  return {
    game,
    seekers,
    foundOrder,
    neverFound,
    gameDurationSecs,
    topFinders: scores.topFinders(),
    longestHiders: scores.longestHiders()
  };
}
