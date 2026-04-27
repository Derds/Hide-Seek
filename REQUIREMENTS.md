# Hide & Seek Tracker — Requirements

## Overview
A lightweight, mobile-friendly web app for running massive games of hide and seek. Players join via a short code, no accounts required. The seeker team can track who's still hiding and who's been found in real time.

---

## Constraints
- No user accounts — join with a code and a name
- No real-time updates required — manual refresh is fine
- One active game at a time
- Lightweight and functionality-focused

---

## User Roles

### Game Creator (Admin)
- Creates a game and receives a short join code (e.g. `HIDE-4821`)
- Sets the number of seekers (or accepts the suggested default based on player count)
- Shares the join code with all players — everyone joins as a potential hider
- Starts the game when ready — seekers are randomly selected at that point
- Can end the game manually at any time

### Hider
- Joins via the short code + enters their name
- Told their role privately when the game starts
- Can view their own status (hiding or found)
- Can mark themselves as found by entering the name of the seeker who found them

### Seeker
- Joins the same way as everyone else — randomly selected when the creator starts the game
- Told their role privately when the game starts
- Can view all players and their status (hiding or found)
- Can mark any player as found (logs time found + seeker's name)
- Multiple seekers are active per game

---

## Core Features

### Game Lifecycle
1. Creator creates game → sets number of seekers (or uses suggested default) → short code generated
2. All players join in the lobby using the code — no roles yet
3. Creator starts the game → seekers randomly selected from the player pool
4. Each player is privately shown their role (hider or seeker)
5. Game ends when:
   - All hiders have been found (auto-end), **or**
   - Creator manually ends the game
6. Results saved to a summary page after game ends

### Seeker Count Defaults
Suggested defaults shown to the creator based on how many players have joined:

| Players in game | Suggested seekers |
|---|---|
| 2–5 | 1 |
| 6–15 | 2 |
| 16–25 | 3 |
| 26–40 | 4 |
| 41+ | ~10% of players |

The creator can override this at any point before starting.

### Player Tracking
Each player record stores:
- Name
- Role (`hider` or `seeker`)
- Found status
- Time they were found
- Name of the seeker who found them

### High Score Table
Persisted across all games — two leaderboards:

| Leaderboard | Tracks |
|---|---|
| 🏃 Quickest Finders | Seekers ranked by most players found, then by average time-to-find |
| 🫣 Longest Hiders | Hiders ranked by longest time survived before being found (or full game duration if never found) |

### `scores`
| Field | Type | Notes |
|---|---|---|
| id | TEXT (PK) | UUID |
| player_name | TEXT | |
| game_id | TEXT (FK) | |
| role | TEXT | `hider` or `seeker` |
| finds | INTEGER | Seekers only — number of players found |
| avg_find_time_secs | INTEGER | Seekers only — average seconds to find each player |
| survival_secs | INTEGER | Hiders only — seconds survived (game duration if never found) |
| never_found | INTEGER | Hiders only — 1 if survived the whole game |

---

| Route | Description |
|---|---|
| `/` | Create a game or enter a join code |
| `/game/[code]` | Lobby — players register, creator starts game |
| `/game/[code]/play` | Main game view (role-aware: hider vs seeker) |
| `/game/[code]/summary` | Post-game results — found order, times, unfound players |

### Hider View (`/play`)
- Shows their own name and current status
- "I've been found" button → prompt to enter the seeker's name

### Seeker View (`/play`)
- Full player list with hiding 🟢 / found ✅ indicators
- Time found and who found each player
- "Mark found" button per hider

---

## Data Model

### `games`
| Field | Type | Notes |
|---|---|---|
| id | TEXT (PK) | Short join code e.g. `HIDE-4821` |
| seeker_count | INTEGER | Set by creator, defaulted by player count |
| status | TEXT | `waiting`, `active`, `ended` |
| created_at | DATETIME | |
| ended_at | DATETIME | Nullable |

### `players`
| Field | Type | Notes |
|---|---|---|
| id | TEXT (PK) | UUID |
| game_id | TEXT (FK) | References games.id |
| name | TEXT | Display name |
| role | TEXT | `hider` or `seeker` |
| found_at | DATETIME | Nullable |
| found_by | TEXT | Nullable — name of the seeker |

---

## Design

### Aesthetic
**Neo-brutalism** (inspired by [RetroUI](https://www.retroui.dev/themes)) meets **cinematic motion** (inspired by [Pixflow](https://pixflow.net/video-packs/)):
- Dark background (near-black) with high-contrast neon or primary colour accents
- Bold solid borders with offset drop shadows (neo-brutalist "lifted" effect)
- Chunky monospace or display typography
- Glitch / scanline CSS effects for transitions and the "timer is up" moment
- Subtle animated backgrounds — particle drift or slow video texture overlay

### Colour Palette
| Role | Colour |
|---|---|
| Background | `#0a0a0a` near-black |
| Primary accent | Neon green `#39ff14` or electric yellow `#f5e642` |
| Danger / found | Hot pink `#ff2d78` |
| Borders | White or primary accent at full opacity |
| Text | White / off-white |

### Key UI Moments
- **Lobby** — players appear in a list with a punchy "pop-in" animation as they join
- **Role reveal** — full-screen dramatic reveal with a glitch flash (seeker vs hider)
- **Player found** — card flips or strikes through with a neon highlight
- **Game over** — bold full-screen end state with cinematic text animation

### Implementation Notes
- Use **Tailwind CSS** + custom CSS for neo-brutalism (offset shadows via `box-shadow: 4px 4px 0px #fff`)
- Glitch effects via CSS `@keyframes` clip-path animation — no JS needed
- Avoid heavy video files; use CSS-only animated backgrounds (noise texture + gradient drift) for performance on mobile
- RetroUI components are React-only — replicate the aesthetic manually in Svelte

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | SvelteKit | Lightweight SSR, minimal JS |
| Database | SQLite (better-sqlite3) | Zero-config, no server needed |
| Styling | TailwindCSS | Fast mobile-first UI |
| Session | Signed cookies | No login — stores game code + player id |
| Hosting | Fly.io or Railway | Simple single-server deploy |
