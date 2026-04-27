import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use a fresh in-memory DB for every suite
beforeEach(() => {
	vi.resetModules();
	process.env.DB_PATH = ':memory:';
});

describe('suggestSeekerCount', () => {
	it('suggests 1 seeker for small groups (2–5)', async () => {
		const { suggestSeekerCount } = await import('./db.js');
		expect(suggestSeekerCount(2)).toBe(1);
		expect(suggestSeekerCount(5)).toBe(1);
	});

	it('suggests 2 seekers for 6–15 players', async () => {
		const { suggestSeekerCount } = await import('./db.js');
		expect(suggestSeekerCount(6)).toBe(2);
		expect(suggestSeekerCount(15)).toBe(2);
	});

	it('suggests 3 seekers for 16–25 players', async () => {
		const { suggestSeekerCount } = await import('./db.js');
		expect(suggestSeekerCount(16)).toBe(3);
		expect(suggestSeekerCount(25)).toBe(3);
	});

	it('suggests 4 seekers for 26–40 players', async () => {
		const { suggestSeekerCount } = await import('./db.js');
		expect(suggestSeekerCount(26)).toBe(4);
		expect(suggestSeekerCount(40)).toBe(4);
	});

	it('suggests ~10% for 41+ players', async () => {
		const { suggestSeekerCount } = await import('./db.js');
		expect(suggestSeekerCount(50)).toBe(5);
		expect(suggestSeekerCount(100)).toBe(10);
	});
});

describe('games', () => {
	it('creates a game and returns a code', async () => {
		const { games } = await import('./db.js');
		const code = games.create(1);
		expect(code).toMatch(/^[A-Z]+-\d{4}$/);
	});

	it('retrieves a created game', async () => {
		const { games } = await import('./db.js');
		const code = games.create(2);
		const game = games.get(code);
		expect(game).toBeDefined();
		expect(game!.status).toBe('waiting');
		expect(game!.seeker_count).toBe(2);
	});

	it('returns undefined for unknown game', async () => {
		const { games } = await import('./db.js');
		expect(games.get('NOPE-0000')).toBeUndefined();
	});

	it('tracks player count', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(1);
		expect(games.playerCount(code)).toBe(0);
		players.join(code, 'Alice');
		expect(games.playerCount(code)).toBe(1);
	});

	it('starts a game and randomly assigns seekers', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(2);
		for (const name of ['Alice', 'Bob', 'Charlie', 'Dana']) players.join(code, name);

		games.start(code);
		const game = games.get(code);
		expect(game!.status).toBe('active');

		const all = players.list(code);
		const seekers = all.filter(p => p.role === 'seeker');
		const hiders = all.filter(p => p.role === 'hider');
		expect(seekers).toHaveLength(2);
		expect(hiders).toHaveLength(2);
	});

	it('throws if game has already started', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(1);
		players.join(code, 'Alice');
		players.join(code, 'Bob');
		games.start(code);
		expect(() => games.start(code)).toThrow();
	});

	it('ends a game and sets ended_at', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(1);
		players.join(code, 'Alice');
		players.join(code, 'Bob');
		games.start(code);
		games.end(code);
		const game = games.get(code);
		expect(game!.status).toBe('ended');
		expect(game!.ended_at).not.toBeNull();
	});

	it('updates seeker count while waiting', async () => {
		const { games } = await import('./db.js');
		const code = games.create(1);
		games.updateSeekerCount(code, 3);
		expect(games.get(code)!.seeker_count).toBe(3);
	});
});

describe('players', () => {
	it('joins a game and returns a player id', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(1);
		const id = players.join(code, 'Alice');
		expect(id).toBeTruthy();
		const p = players.get(id);
		expect(p!.name).toBe('Alice');
		expect(p!.role).toBe('hider');
		expect(p!.found_at).toBeNull();
	});

	it('lists players in a game', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(1);
		players.join(code, 'Alice');
		players.join(code, 'Bob');
		expect(players.list(code)).toHaveLength(2);
	});

	it('marks a player as found', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(1);
		const seekerId = players.join(code, 'Alice');
		const hiderId = players.join(code, 'Bob');
		games.start(code);

		players.markFound(hiderId, 'Alice');
		const p = players.get(hiderId);
		expect(p!.found_at).not.toBeNull();
		expect(p!.found_by).toBe('Alice');
	});

	it('auto-ends game when last hider is found', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(1);
		players.join(code, 'Alice'); // will be seeker
		const hider = players.join(code, 'Bob');
		games.start(code);

		// ensure Bob is the hider (Alice became seeker as first random pick with count=1)
		const all = players.list(code);
		const hiderPlayer = all.find(p => p.role === 'hider')!;

		const result = players.markFound(hiderPlayer.id, 'Alice');
		expect(result.autoEnded).toBe(true);
		expect(games.get(code)!.status).toBe('ended');
	});

	it('does not double-mark a found player', async () => {
		const { games, players } = await import('./db.js');
		const code = games.create(1);
		players.join(code, 'Alice');
		const hider = players.join(code, 'Bob');
		games.start(code);

		const all = players.list(code);
		const hiderPlayer = all.find(p => p.role === 'hider')!;
		players.markFound(hiderPlayer.id, 'Alice');
		players.markFound(hiderPlayer.id, 'Charlie'); // should be ignored
		expect(players.get(hiderPlayer.id)!.found_by).toBe('Alice');
	});
});

describe('scores', () => {
	it('writes and retrieves seeker scores after game ends', async () => {
		const { games, players, scores } = await import('./db.js');
		const code = games.create(1);
		players.join(code, 'Seeker1');
		const h1 = players.join(code, 'Hider1');
		const h2 = players.join(code, 'Hider2');
		games.start(code);

		const all = players.list(code);
		const seeker = all.find(p => p.role === 'seeker')!;
		const hiders = all.filter(p => p.role === 'hider');

		players.markFound(hiders[0].id, seeker.name);
		players.markFound(hiders[1].id, seeker.name);

		const top = scores.topFinders();
		expect(top.length).toBeGreaterThan(0);
		expect((top[0] as { total_finds: number }).total_finds).toBe(2);
	});

	it('writes hider survival scores including never-found players', async () => {
		const { games, players, scores } = await import('./db.js');
		const code = games.create(1);
		players.join(code, 'Seeker1');
		players.join(code, 'Hider1');
		players.join(code, 'Hider2');
		games.start(code);

		const all = players.list(code);
		const hiders = all.filter(p => p.role === 'hider');
		const seeker = all.find(p => p.role === 'seeker')!;

		// Only find one hider, then manually end
		players.markFound(hiders[0].id, seeker.name);
		games.end(code);

		const longest = scores.longestHiders();
		expect(longest.length).toBeGreaterThan(0);
		const neverFound = (longest as { times_never_found: number }[]).find(s => s.times_never_found === 1);
		expect(neverFound).toBeDefined();
	});
});
