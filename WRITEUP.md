# Battleship - Build Writeup

## Table of Contents
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Requirements Checklist](#requirements-checklist)
- [Technical Decisions & Trade-offs](#technical-decisions--trade-offs)
- [Anti-Cheat: Attack Vectors & Defenses](#anti-cheat-attack-vectors--defenses)
- [Scalability Analysis](#scalability-analysis)
- [Testing Strategy](#testing-strategy)
- [Spike: AI Strategy Engine](#spike-ai-strategy-engine)
- [How I Used AI Tools](#how-i-used-ai-tools)

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19, TypeScript, Vite | Type safety, fast HMR, modern React features |
| Styling | Tailwind CSS v4, Framer Motion | Utility-first CSS for rapid iteration; physics-based animations |
| Real-time | Socket.IO | WebSocket abstraction with fallback to polling, rooms, ack callbacks |
| Backend | Express, Node.js, TypeScript | Lightweight HTTP + WebSocket server, shared types with client |
| Database | Prisma ORM + SQLite | Type-safe queries, auto-migrations, zero-infrastructure persistence |
| Testing | Vitest (unit), Playwright (e2e) | Fast unit tests for server logic; browser-based e2e for client flows |
| Deployment | Render | Free tier, auto-deploy from GitHub, supports Node web services |

---

## Architecture Overview

```
┌─────────────────────────────────┐
│          React Client           │
│  Menu → Placement → Firing →    │
│  GameOver / History             │
│  Socket.IO client               │
└────────────┬────────────────────┘
             │ WebSocket + HTTP
┌────────────▼────────────────────┐
│         Express Server          │
│  Socket.IO event handlers       │
│  Input validation layer         │
│  ┌───────────────────────────┐  │
│  │     GameManager           │  │
│  │  - Game state (in-memory) │  │
│  │  - Shot processing        │  │
│  │  - Turn management        │  │
│  │  - Fleet validation       │  │
│  │  - AI strategy engine     │  │
│  │  - Stale game cleanup     │  │
│  └───────────┬───────────────┘  │
│              │                  │
│  ┌───────────▼───────────────┐  │
│  │   Prisma + SQLite         │  │
│  │  - Game state snapshots   │  │
│  │  - Move-by-move history   │  │
│  │  - Crash recovery         │  │
│  └───────────────────────────┘  │
│                                 │
│  REST: GET /api/games           │
│  REST: GET /api/games/:id       │
└─────────────────────────────────┘
```

**Server-authoritative model**: The server owns all game state. The client is a pure rendering layer that receives projections of the game state — your own board (full visibility) and the opponent's board (only discovered hit/miss cells). Ship positions are never sent to the client until revealed through gameplay. All validation (placement, shots, turns) happens server-side.

---

## Requirements Checklist

### Core Gameplay

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Complete, rules-correct Battleship | **Done** | 10×10 grid, 5 ships (Carrier-5, Battleship-4, Cruiser-3, Submarine-3, Destroyer-2), turn-based firing, hit/miss/sunk, win detection. All logic in `GameManager.ts` and `Board.ts`. |
| Ship placement with rotate + validate | **Done** | Client: click-to-place with hover preview (green=valid, red=invalid), R key or button to rotate, undo last ship, randomize all. Server: validates exact fleet composition, no overlaps, within bounds. |
| Firing phase with both boards visible | **Done** | "ENEMY WATERS" (opponent grid, click to fire) + "YOUR FLEET" (your board with colored ship cells and incoming hits). Blue targeting reticle on hover. All 10 rows fully interactive. |
| Hit/miss/sunk feedback after every shot | **Done** | Animated toast notification (HIT! / MISS / [Ship] SUNK!), procedural sound effects via Web Audio API, visual markers on the grid (red ✕ for hit, blue dot for miss). |
| Win detection + rematch/menu | **Done** | VICTORY/DEFEAT screen with animated glow, REMATCH button (restarts with same difficulty for AI), MAIN MENU button. |

### Game Modes

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| vs. AI (single-player) | **Done** | 3 difficulty levels: Easy (random), Medium (hunt/target with checkerboard pattern), Hard (probability density analysis). AI ships placed randomly with retry logic ensuring complete fleet. |
| AI "at least moderately intelligent" | **Done** | Medium mode uses hunt/target with adjacent cell probing after hits. Hard mode uses probability density — the same algorithm used by competitive Battleship solvers. |
| vs. Human (multiplayer, real-time) | **Done** | CREATE ROOM generates a shareable code. JOIN ROOM with code. Socket.IO broadcasts game-update to both players on every action. No refresh needed. |

### Hosting

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Deployed to public URL | **Done** | https://sentience-battleship.onrender.com/ — Render free tier, auto-deploys from GitHub on push. |
| GitHub repository | **Done** | Full monorepo with client/, server/, shared types, tests, CI-ready scripts. |

### Persistence

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Game state survives page refresh | **Done** | `localStorage` stores gameId + playerId. On reconnect, client emits `rejoin-game`. Server restores from Prisma if not in memory, remaps old socket ID to new. AI state reconstructed from board state on server restart. |
| Completed game history stored + queryable | **Done** | Every move persisted with player, coordinates, result, timestamp. `GET /api/games` lists finished games. `GET /api/games/:id` returns full move sequence. UI has "BATTLE LOG" with click-through to move-by-move replay. |

### Considerations

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| How can a player cheat? | **Done** | See [Anti-Cheat section](#anti-cheat-attack-vectors--defenses) below — 6 attack vectors identified with corresponding defenses. |
| Runtime complexity at scale | **Done** | See [Scalability section](#scalability-analysis) below — analysis of board size, concurrent games, and database scaling. |

### Testing

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Unit tests | **Done** | 79 tests across Board, AIPlayer, GameManager covering placement, shooting, turn management, AI behavior, win conditions, edge cases, input validation. |
| E2E tests | **Done** | 9 Playwright tests covering menu rendering, AI game flow, ship placement, firing on all rows (including row 10), no 3D transforms in DOM, game history, board labels. |

---

## Technical Decisions & Trade-offs

### Why SQLite over PostgreSQL?

**Decision**: SQLite via Prisma.

**Rationale**: For a single-server deployment with low concurrent write volume, SQLite provides the persistence guarantees needed (game history, crash recovery) with zero infrastructure overhead. The database is a single file that ships with the server.

**Trade-off**: SQLite on Render's ephemeral filesystem means data is lost on redeploy. For a production system, I would:
1. Use Render's persistent disk and point `DATABASE_URL` at it, or
2. Swap to PostgreSQL (one-line change in `schema.prisma`) with a managed database.

Prisma makes this swap trivial because the ORM abstracts the driver.

### Why Socket.IO over raw WebSockets?

**Decision**: Socket.IO for real-time communication.

**Rationale**: Socket.IO provides room management (each game is a room), acknowledgment callbacks (client gets confirmation of each action), automatic reconnection, and polling fallback. These features would require significant custom code with raw WebSockets.

**Trade-off**: Larger client bundle (~50KB gzipped) vs raw WS. Acceptable for this use case.

### Why in-memory game state + DB backup (not DB-primary)?

**Decision**: Active games live in a `Map<string, GameState>` in server memory. Prisma persists snapshots asynchronously.

**Rationale**: Battleship has rapid state transitions (multiple shots per second in AI games). Writing to SQLite on every shot is fine for persistence, but reading from DB on every state query would add unnecessary latency. In-memory state gives O(1) access for active games.

**Trade-off**: Server restart loses in-memory state. Mitigated by DB-backed `restoreGame()` which reconstructs both game state and AI targeting state from the persisted board. Not suitable for multi-server horizontal scaling without moving state to Redis.

### Why flat CSS over 3D transforms?

**Decision**: Ship visuals rendered as inline colored cells with per-ship hues and rounded endpoints. No CSS 3D perspective transforms.

**Rationale**: Initial implementation used `rotateX()` perspective tilts and absolute-positioned ship overlays with `preserve-3d`. This caused persistent click-target failures: the `water-shimmer::after` pseudo-element and ship overlays intercepted pointer events on lower rows, and `justify-center` on the layout pushed the bottom of the board below the viewport fold. After multiple fix attempts, the 3D approach was abandoned in favor of a flat layout that is 100% clickable on all rows, all browsers, all viewport sizes.

**Trade-off**: Slightly less visually dramatic. The ship cells still use distinct per-ship colors (purple carrier, blue battleship, teal cruiser, green submarine, yellow destroyer), rounded endpoints, sunk states, and subtle shadows — preserving a premium feel without the interactivity cost.

### Why procedural audio over sound files?

**Decision**: Web Audio API oscillators generate all sound effects at runtime.

**Rationale**: Zero external audio assets to load, cache, or host. Sounds are generated in <1ms. Different timbres for different events (sine wave for miss, sawtooth for hit, victory melody). No CORS or loading-state issues.

---

## Anti-Cheat: Attack Vectors & Defenses

### 1. Inspecting opponent's board

**Attack**: Modified client reads ship positions from WebSocket messages or API responses.

**Defense**: `getVisibleBoard()` creates a projection where unhit cells show `hasShip: false` and `shipName: null`. Opponent ship health is sent only as sunk/not-sunk booleans (`opponentShipsSunk`), not exact HP. The history API excludes the raw `state` field via `select`.

### 2. Sending an invalid fleet

**Attack**: Modified client sends ships with wrong lengths (e.g., five Carriers), extra ships, or mismatched name/length pairs.

**Defense**: `isValidFleet()` validates: exactly 5 placements, each with a canonical ship name, correct length matching the name, valid orientation string (`'horizontal'` | `'vertical'`), integer coordinates within bounds, no duplicate names. Server also rebuilds the board from scratch and validates no overlaps via `placeShip()`.

### 3. Firing out of turn

**Attack**: Modified client sends fire events during the opponent's turn.

**Defense**: `fireShot()` checks `game.currentTurn !== playerId` and rejects with `null`.

### 4. Firing out of bounds or invalid coordinates

**Attack**: Modified client sends `x: 999` or `x: "abc"` or `x: -1`.

**Defense**: `fireShot()` validates `Number.isInteger(x)`, `Number.isInteger(y)`, and `0 <= x,y < BOARD_SIZE` before any grid access. The socket handler also validates `typeof data.x === 'number'`.

### 5. Crashing the server

**Attack**: Client sends malformed payloads, missing callbacks, or floods events.

**Defense**: Every socket handler wraps logic in `try/catch`, validates `typeof callback === 'function'` before calling it, and validates `data` shape before processing. Errors are logged and the client receives a generic error response.

### 6. Session hijacking via rejoin

**Attack**: Attacker knows a gameId and oldPlayerId, sends `rejoin-game` to steal another player's seat.

**Defense acknowledged**: The current implementation remaps player IDs on rejoin without session tokens. For a production system, a cryptographic session token stored in `localStorage` and validated server-side would prevent this. For this demo scope, the risk is accepted given the 8-character game IDs and ephemeral socket IDs.

---

## Scalability Analysis

### Board size: What if the board was huge?

| Component | Current (10×10) | 100×100 | 1000×1000 |
|-----------|----------------|---------|-----------|
| Shot validation | O(1) | O(1) | O(1) |
| AI Easy (random) | O(N²) scan | O(N²) = 10K | O(N²) = 1M |
| AI Hard (probability) | O(S × N² × 2) | ~200K ops | ~10M ops |
| Board render | 100 DOM nodes | 10K nodes | 1M nodes (needs virtualization) |
| Persistence | ~2KB JSON | ~200KB | ~20MB |

**Mitigations for large boards**:
- AI: Incremental density updates instead of full recalculation. Spatial partitioning for hit adjacency.
- Rendering: Virtual grid (only render visible viewport cells). Canvas or WebGL for very large boards.
- `BOARD_SIZE` is a single constant — changing it scales all logic automatically.

### Concurrent games

Games are stored in a `Map` with automatic TTL-based cleanup (2-hour expiry, checked every 10 minutes). Memory scales linearly: ~50KB per active game.

For horizontal scaling: move game state to Redis with pub/sub for cross-server broadcasts. Prisma already handles the persistence layer, so the DB can be swapped to PostgreSQL for concurrent writes.

---

## Testing Strategy

### Unit Tests (79 tests, Vitest)

Server game logic tested comprehensively:

- **Board.ts** — Grid creation, ship placement validation (bounds, overlaps, edges), random fleet placement (completeness, no overlap, within bounds), shot processing (hit, miss, sunk, allSunk, duplicate, out-of-bounds), board visibility (owner vs opponent projections).
- **AIPlayer.ts** — State initialization, shot generation for all 3 difficulties, bounds checking, no duplicate shots, nearly-full board handling, hunt/target mode transitions, adjacent cell targeting, sunk ship cleanup, checkerboard pattern verification.
- **GameManager.ts** — Game creation (AI/multiplayer), joining (valid/rejected cases), fleet validation (incomplete, duplicate names, wrong lengths, out-of-bounds, non-integer coords, invalid orientation, double placement), shot firing (turn enforcement, bounds, duplicates), AI response, client state projection (hides ships, exposes sunk status), disconnect handling, full game simulation to completion.

### E2E Tests (9 tests, Playwright)

Client flows tested against the running app:

- Main menu renders with all options (VS COMPUTER, CREATE/JOIN ROOM, GAME HISTORY)
- VS COMPUTER shows difficulty selection (EASY, MEDIUM, HARD)
- AI game reaches placement phase with correct UI
- Randomize places all ships and shows CONFIRM button
- Full AI game flow: placement → firing → shots register on all rows including row 10
- No 3D perspective transforms exist in the DOM (regression test)
- Game history page loads without crash
- Board has 10 row labels (1-10) and column labels (A-J)

### Running Tests

```bash
# Unit tests
cd server && npm test

# E2E tests (requires dev servers running)
npx playwright test
```

---

## Spike: AI Strategy Engine

I chose the AI as my spike because competitive Battleship has well-studied optimal play, and implementing the algorithm hierarchy (random → hunt/target → probability density) demonstrates both algorithmic thinking and practical game design.

**Three difficulty tiers**:

| Level | Algorithm | Behavior |
|-------|-----------|----------|
| Easy | Uniform random | Picks any unshot cell. Feels fair for casual play. |
| Medium | Hunt/Target | Checkerboard hunt pattern (skips cells that can't contain the smallest remaining ship). On hit, probes all 4 adjacent cells. On sunk, clears target queue, re-evaluates remaining hits. |
| Hard | Probability density | For each remaining ship, enumerates every valid placement on the current board. Each unshot cell gets a score = number of possible placements passing through it. Fires at the highest-probability cell. In target mode, combines density analysis with hit adjacency for optimal follow-up. |

The Hard AI uses the same core algorithm as competitive Battleship solvers (Donald Knuth's approach). Runtime is O(S × N² × 2) per shot — trivial for 10×10 but the asymptotic analysis matters if the board scales.

---

## How I Used AI Tools

I used **Cursor with Claude** as my primary development tool throughout this project.

**Where AI excelled**:
- **Scaffolding** — Project structure, Prisma schema, Express + Socket.IO boilerplate, Tailwind config. AI generated 80%+ of this correctly on first pass.
- **Systematic auditing** — I had AI read every file in the codebase and report bugs, security gaps, edge cases, and UX issues. This identified issues I would have missed in manual review (e.g., the ship overlay intercepting grid clicks, silent fire errors in the client, `opponentShipHealth` leaking exact HP).
- **Test generation** — AI generated comprehensive unit and e2e test suites, covering edge cases I specified and discovering additional boundary conditions.
- **Component iteration** — Generated React components with Tailwind styling, then iterated on visual details through conversation.

**Where I directed the work**:
- **Architecture** — The server-authoritative design, the state projection model, and the anti-cheat strategy were deliberate choices I made and directed the AI to implement.
- **AI algorithm design** — I chose the probability density approach based on competitive Battleship literature and guided the implementation through the three-tier difficulty system.
- **UX decisions** — The targeting reticle hover effect, ship color scheme, and the sound design choices were my creative direction.
- **Quality bar** — I drove the hardening pass that validated every socket event, added fleet composition checks, stripped leaked data from the API, and added memory cleanup. The AI executed, but I defined what "production-ready" meant.
- **Bug diagnosis** — I identified the row 6+ click failures and directed the removal of 3D transforms as the root cause, after the AI attempted multiple partial fixes.

The collaboration was most productive when I treated AI as a fast executor that I directed with clear intent, rather than delegating entire decisions to it.
