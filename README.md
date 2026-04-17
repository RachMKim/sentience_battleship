# Battleship

A real-time multiplayer Battleship game with intelligent AI opponent, built with React, Socket.IO, and Prisma.

**Live:** https://sentience-battleship.onrender.com/

## Features

- **vs AI** — Three difficulty levels: Easy (random), Medium (hunt & target), Hard (probability density analysis)
- **vs Human** — Real-time multiplayer via WebSocket rooms with shareable room codes
- **Ship Placement** — Drag-and-drop or click to place, R to rotate, randomize, free ship selection
- **SVG Ship Visuals** — Custom vector ship silhouettes with turrets, bridges, flight decks
- **Sound Effects** — ZzFX synthesized game audio (bomb impacts, water splashes, sinking sequences)
- **Animated Effects** — Fire/smoke on hits, water splash on misses, ember glow on sunk ships
- **Persistence** — Game state survives page refresh via localStorage + server-side restore
- **Anti-cheat** — Server-authoritative architecture; client never knows opponent ship positions
- **i18n** — 5 languages: English, Español, 한국어, 日本語, 中文
- **Mobile Responsive** — Adaptive grid sizing, responsive layouts, touch-friendly controls
- **Accessibility** — `prefers-reduced-motion`, `aria-label` on grid cells, AudioContext auto-resume

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Set up the database
cd server && DATABASE_URL=file:./dev.db npx prisma migrate deploy && cd ..

# Start development servers (client on :5173, server on :3001)
npm run dev
```

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion, ZzFX, Socket.IO Client
- **Backend:** Express, Socket.IO, Prisma + SQLite
- **Language:** TypeScript throughout
- **Testing:** Vitest (79 unit tests), Playwright (9 e2e tests)

## Project Structure

```
battleship/
  client/                # React frontend
    src/
      components/        # Board, Cell, Menu, ShipPlacement, FiringPhase, GameOver, ShipSVG, LanguageSelector
      hooks/             # useSocket, useGame, useSoundEffects
      lib/               # types, constants, i18n
  server/                # Express + Socket.IO backend
    src/
      game/              # GameManager, Board, AIPlayer, types
      routes/            # REST API for game history
    prisma/              # Database schema and migrations
  e2e/                   # Playwright end-to-end tests
```

## Testing

```bash
# Server unit tests (79 tests)
cd server && npm test

# E2E tests (requires dev servers running)
npx playwright test
```

## Deployment

Configured for Render (free tier). A `render.yaml` is included for one-click deployment.

1. Push repo to GitHub
2. Create a new Web Service on [render.com](https://render.com)
3. Connect your GitHub repo — Render auto-detects `render.yaml`
4. Click "Create Web Service"

The app will be live at your Render URL (free tier spins down after 15 min inactivity).

## Writeup

See [WRITEUP.md](./WRITEUP.md) for detailed technical documentation including:
- Architecture diagrams (Mermaid)
- Requirements coverage checklist
- Technical decisions & trade-offs
- Anti-cheat analysis (6 attack vectors)
- Scalability analysis
- AI strategy engine spike (3-tier difficulty)
- Testing strategy
