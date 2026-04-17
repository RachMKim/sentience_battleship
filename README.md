# Battleship

A real-time multiplayer Battleship game with intelligent AI opponent, built with React, Socket.IO, and Prisma.

## Features

- **vs AI** — Three difficulty levels: Easy (random), Medium (hunt & target), Hard (probability density analysis)
- **vs Human** — Real-time multiplayer via WebSocket rooms
- **Ship Placement** — Click to place, R to rotate, randomize button, undo support
- **Persistence** — Game state survives page refresh; completed games stored with full move history
- **Anti-cheat** — Server-authoritative architecture; client never knows opponent ship positions
- **Sound Effects** — Procedural audio via Web Audio API
- **Animations** — Smooth transitions and feedback via Framer Motion

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Set up the database
npm run db:migrate --prefix server

# Start development servers
npm run dev
```

The client runs on `http://localhost:5173` and the server on port `3001`.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Socket.IO Client
- **Backend:** Express, Socket.IO, Prisma + SQLite
- **Language:** TypeScript throughout

## Project Structure

```
battleship/
  client/           # React frontend
    src/
      components/   # Board, Cell, Menu, ShipPlacement, FiringPhase, GameOver
      hooks/        # useSocket, useGame, useSoundEffects
      lib/          # types, constants
  server/           # Express + Socket.IO backend
    src/
      game/         # GameManager, Board, AIPlayer, types
      routes/       # REST API for game history
    prisma/         # Database schema and migrations
```

## Deployment

Configured for Railway deployment. Build command: `npm run build`. Start command: `npm run start`.
