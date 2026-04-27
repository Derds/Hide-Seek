import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'hide-seek.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id          TEXT PRIMARY KEY,
    seeker_count INTEGER NOT NULL DEFAULT 1,
    status      TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','active','ended')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS players (
    id          TEXT PRIMARY KEY,
    game_id     TEXT NOT NULL REFERENCES games(id),
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'hider' CHECK(role IN ('hider','seeker')),
    found_at    TEXT,
    found_by    TEXT
  );

  CREATE TABLE IF NOT EXISTS scores (
    id                  TEXT PRIMARY KEY,
    player_name         TEXT NOT NULL,
    game_id             TEXT NOT NULL REFERENCES games(id),
    role                TEXT NOT NULL CHECK(role IN ('hider','seeker')),
    finds               INTEGER,
    avg_find_time_secs  INTEGER,
    survival_secs       INTEGER,
    never_found         INTEGER DEFAULT 0
  );
`);

// ── Helpers ────────────────────────────────────────────────────────────────

export function generateGameCode(): string {
  const words = ['HIDE', 'SEEK', 'FIND', 'RUN', 'DUCK', 'LOST', 'GONE'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

export function uuid(): string {
  return randomBytes(16).toString('hex');
}

export function suggestSeekerCount(playerCount: number): number {
  if (playerCount <= 5)  return 1;
  if (playerCount <= 15) return 2;
  if (playerCount <= 25) return 3;
  if (playerCount <= 40) return 4;
  return Math.max(1, Math.round(playerCount * 0.1));
}

// ── Game queries ────────────────────────────────────────────────────────────

export const games = {
  create(seekerCount: number) {
    const id = generateGameCode();
    db.prepare(`INSERT INTO games (id, seeker_count) VALUES (?, ?)`).run(id, seekerCount);
    return id;
  },

  get(id: string) {
    return db.prepare(`SELECT * FROM games WHERE id = ?`).get(id) as Game | undefined;
  },

  playerCount(gameId: string): number {
    const row = db.prepare(`SELECT COUNT(*) as c FROM players WHERE game_id = ?`).get(gameId) as { c: number };
    return row.c;
  },

  start(gameId: string) {
    const game = games.get(gameId);
    if (!game || game.status !== 'waiting') throw new Error('Game cannot be started');

    const allPlayers = db.prepare(`SELECT id FROM players WHERE game_id = ? ORDER BY RANDOM()`).all(gameId) as { id: string }[];
    const seekerIds = allPlayers.slice(0, game.seeker_count).map(p => p.id);

    const assignRole = db.prepare(`UPDATE players SET role = ? WHERE id = ?`);
    const assignMany = db.transaction(() => {
      for (const id of seekerIds) assignRole.run('seeker', id);
    });
    assignMany();

    db.prepare(`UPDATE games SET status = 'active' WHERE id = ?`).run(gameId);
  },

  end(gameId: string) {
    db.prepare(`UPDATE games SET status = 'ended', ended_at = datetime('now') WHERE id = ?`).run(gameId);
    writeScores(gameId);
  },

  updateSeekerCount(gameId: string, count: number) {
    db.prepare(`UPDATE games SET seeker_count = ? WHERE id = ? AND status = 'waiting'`).run(count, gameId);
  }
};

// ── Player queries ──────────────────────────────────────────────────────────

export const players = {
  join(gameId: string, name: string) {
    const id = uuid();
    db.prepare(`INSERT INTO players (id, game_id, name) VALUES (?, ?, ?)`).run(id, gameId, name);
    return id;
  },

  get(id: string) {
    return db.prepare(`SELECT * FROM players WHERE id = ?`).get(id) as Player | undefined;
  },

  list(gameId: string) {
    return db.prepare(`SELECT * FROM players WHERE game_id = ? ORDER BY role DESC, found_at ASC`).all(gameId) as Player[];
  },

  markFound(playerId: string, foundBy: string) {
    db.prepare(`UPDATE players SET found_at = datetime('now'), found_by = ? WHERE id = ? AND found_at IS NULL`).run(foundBy, playerId);

    // auto-end if all hiders are found
    const player = players.get(playerId);
    if (player) {
      const remaining = db.prepare(
        `SELECT COUNT(*) as c FROM players WHERE game_id = ? AND role = 'hider' AND found_at IS NULL`
      ).get(player.game_id) as { c: number };

      if (remaining.c === 0) {
        games.end(player.game_id);
        return { autoEnded: true };
      }
    }
    return { autoEnded: false };
  }
};

// ── Score calculation ───────────────────────────────────────────────────────

function writeScores(gameId: string) {
  const game = db.prepare(`SELECT * FROM games WHERE id = ?`).get(gameId) as Game;
  const allPlayers = players.list(gameId);
  const gameEndedAt = game.ended_at ?? new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO scores (id, player_name, game_id, role, finds, avg_find_time_secs, survival_secs, never_found)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const writeAll = db.transaction(() => {
    for (const p of allPlayers) {
      if (p.role === 'seeker') {
        const found = allPlayers.filter(h => h.found_by === p.name && h.found_at);
        const finds = found.length;
        const avgTime = finds > 0
          ? Math.round(found.reduce((sum, h) => {
              const diff = (new Date(h.found_at!).getTime() - new Date(game.created_at).getTime()) / 1000;
              return sum + diff;
            }, 0) / finds)
          : null;
        insert.run(uuid(), p.name, gameId, 'seeker', finds, avgTime, null, 0);
      } else {
        const survivalSecs = p.found_at
          ? Math.round((new Date(p.found_at).getTime() - new Date(game.created_at).getTime()) / 1000)
          : Math.round((new Date(gameEndedAt).getTime() - new Date(game.created_at).getTime()) / 1000);
        insert.run(uuid(), p.name, gameId, 'hider', null, null, survivalSecs, p.found_at ? 0 : 1);
      }
    }
  });

  writeAll();
}

// ── Score queries ───────────────────────────────────────────────────────────

export const scores = {
  topFinders(limit = 10) {
    return db.prepare(`
      SELECT player_name, SUM(finds) as total_finds, AVG(avg_find_time_secs) as avg_secs
      FROM scores WHERE role = 'seeker' AND finds > 0
      GROUP BY player_name
      ORDER BY total_finds DESC, avg_secs ASC
      LIMIT ?
    `).all(limit);
  },

  longestHiders(limit = 10) {
    return db.prepare(`
      SELECT player_name, MAX(survival_secs) as best_survival_secs, SUM(never_found) as times_never_found
      FROM scores WHERE role = 'hider'
      GROUP BY player_name
      ORDER BY best_survival_secs DESC
      LIMIT ?
    `).all(limit);
  }
};

// ── Types ───────────────────────────────────────────────────────────────────

export interface Game {
  id: string;
  seeker_count: number;
  status: 'waiting' | 'active' | 'ended';
  created_at: string;
  ended_at: string | null;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  role: 'hider' | 'seeker';
  found_at: string | null;
  found_by: string | null;
}

export default db;
