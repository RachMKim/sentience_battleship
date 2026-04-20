# Battleship

A real-time multiplayer Battleship game with three algorithmic difficulty tiers.

**Live:** https://sentience-battleship.onrender.com/  
**Writeup:** [WRITEUP.md](./WRITEUP.md)

## What This Is

A feature-complete Battleship implementation for the Sentience Engineering Work Trial. Two game modes (vs Computer, vs Human multiplayer), server-authoritative architecture, persistent game history, and a responsive web UI that works on desktop and mobile.

## Quick Start

```bash
npm run install:all
cd server && DATABASE_URL=file:./dev.db npx prisma migrate deploy && cd ..
npm run dev
```

Client runs on `:5173`, server on `:3001`.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- **Backend:** Express, Socket.IO, Prisma + SQLite
- **Testing:** Vitest (79 unit tests), Playwright (15 e2e tests)
- **Deployment:** Render (auto-deploys from GitHub)

## Project Structure

```
battleship/
  client/                # React frontend
    src/
      components/        # Board, ShipPlacement, FiringPhase, GameOver, Menu, etc.
      hooks/             # useSocket, useGame, useSoundEffects
      lib/               # types, constants, i18n
  server/                # Express + Socket.IO backend
    src/
      game/              # GameManager, Board, AIPlayer, types
      routes/            # REST API for game history
    prisma/              # Database schema + migrations
  e2e/                   # Playwright end-to-end tests
```

## Tests

```bash
npm test                    # 79 server unit tests
npx playwright test         # 15 e2e tests (requires dev servers running)
```
