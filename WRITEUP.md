# Battleship - Build Writeup

## Approach

I built a complete, rules-correct Battleship game with real-time multiplayer and an intelligent AI opponent. The approach was to build a **server-authoritative architecture** where all game logic runs server-side, preventing cheating and ensuring consistency.

### Architecture Decisions

**Monorepo structure** — Client and server live in the same repo with a root `package.json` that orchestrates both. This simplifies deployment and keeps shared concepts (ship types, board rules) conceptually close.

**Server-authoritative design** — The server owns all game state. The client never knows where opponent ships are located. Every shot is validated server-side (bounds checking, duplicate detection, turn verification) before being applied. The client receives only a projection of the game state: your own board (full visibility) and the opponent's board (only hit/miss information). This makes cheating via client inspection impossible.

**Socket.IO for real-time communication** — WebSocket-based communication enables instant updates for multiplayer games. Both players see the results of every shot immediately without polling or manual refresh.

**Prisma + SQLite for persistence** — Game state is persisted to SQLite on every move. This serves dual purposes:
1. **Crash recovery** — If the page is refreshed or the connection drops, the game can be restored from the database by remapping the new socket ID to the stored player.
2. **Game history** — Completed games with their full move sequences are queryable via a REST API and viewable in the UI.

I chose SQLite over PostgreSQL because it requires zero additional infrastructure — the database is a single file that deploys with the server. For this scale (individual games, not thousands of concurrent users), it's the right trade-off. Prisma provides type-safe queries and auto-generated migrations, making the data layer self-documenting.

## Spike: AI Intelligence + Visual Polish

### Smart AI (Probability Density Targeting)

The AI opponent has three difficulty levels, each using a progressively more sophisticated algorithm:

**Easy** — Pure random targeting. Picks any un-shot cell uniformly at random.

**Medium** — Hunt/Target mode. Fires randomly (using a checkerboard pattern for efficiency) until it gets a hit, then systematically probes adjacent cells. When a ship is sunk, it clears the target queue and resumes hunting. This mirrors how most human players actually think.

**Hard** — Probability density analysis. For every remaining ship, the AI calculates every possible position it could occupy given the current board state (known misses, known hits). Each un-shot cell gets a score based on how many possible ship placements pass through it. The AI fires at the cell with the highest probability score. When in target mode (after a hit), this analysis is combined with adjacency targeting to find the most statistically likely continuation of the hit ship.

This is the same core algorithm used by competitive Battleship solvers. The runtime is O(S × N² × 2) per shot where S is the number of remaining ships and N is the board dimension — trivial for a 10×10 board but scales linearly with board size.

### Visual Design

The UI uses a dark ocean/naval aesthetic with:
- **Orbitron font** for headings (military/sci-fi feel)
- **Neon accent colors** — blue for primary, green for success, red for hits/danger
- **Framer Motion animations** — ship placement slide-ins, hit/miss markers with scale/rotation animations, pulsing turn indicators, staggered menu animations
- **Procedural sound effects** — generated via Web Audio API oscillators (no external audio files). Different sounds for hit, miss, ship sunk, ship placement, and victory.
- **Responsive layout** — works on desktop and tablet viewports

## Anti-Cheat Considerations

**Server-side validation** — All game logic (placement validation, shot processing, turn management, win detection) runs exclusively on the server. The client is a pure rendering layer.

**Information hiding** — The `getVisibleBoard()` function creates a projection of the opponent's board that only reveals cells that have been hit. Ship locations are never sent to the client until they're discovered through gameplay.

**Turn enforcement** — The server rejects shots from the wrong player. Even if a client is modified to send out-of-turn shots, they'll be rejected.

**Duplicate shot prevention** — Already-hit cells are rejected server-side.

**Input validation** — Coordinates are bounds-checked. Invalid placements (overlapping ships, out-of-bounds) are rejected.

## Scalability Considerations

**Board size scaling** — The game logic uses `BOARD_SIZE` as a constant throughout. Scaling to a 100×100 or 1000×1000 board would require:
- Changing the constant (trivial)
- Adjusting the AI probability density calculation, which is O(S × N²) — for a 1000×1000 board with 5 ships, that's ~5 million operations per shot. A potential optimization would be incremental density updates rather than full recalculation.
- The grid rendering could use virtualization (only render visible cells) for very large boards.

**Concurrent games** — Games are stored in a Map keyed by game ID. Memory scales linearly with active games. For production scale, game state could be moved to Redis with pub/sub for multi-server deployment.

**Database** — SQLite handles this scale easily. For higher throughput, swapping to PostgreSQL (just change the Prisma datasource) would support concurrent writes from multiple server instances.

## How I Used AI

I used Cursor (Claude) extensively throughout this project:

- **Architecture planning** — Discussed tech stack choices, data model design, and anti-cheat strategy
- **Scaffolding** — Generated the initial project structure, Prisma schema, and boilerplate configs
- **Game logic** — AI-assisted implementation of the board logic, AI algorithms, and Socket.IO event handlers, with manual review and iteration
- **UI components** — Generated component structure and Tailwind styling, then iterated on visual details
- **Debugging** — Used browser automation to test the game flow and identify issues

The AI accelerated development significantly for boilerplate and well-understood patterns (Express setup, Prisma config, Socket.IO events). The areas where I directed the most manual attention were the AI algorithm design, the anti-cheat architecture, and the visual polish — these required judgment calls that the AI provided options for but I made the final decisions on.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Real-time | Socket.IO |
| Backend | Express, Node.js |
| Database | Prisma ORM + SQLite |
| Deployment | Railway |
