import { Router } from 'express';
import { prisma } from '../game/prisma.js';

const router = Router();

router.get('/api/games', async (_req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: { status: 'finished' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        mode: true,
        status: true,
        winner: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { moves: true } },
      },
    });
    res.json(games);
  } catch (err) {
    console.error('Failed to fetch games:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

router.get('/api/games/:id', async (req, res) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        mode: true,
        status: true,
        winner: true,
        createdAt: true,
        updatedAt: true,
        moves: { orderBy: { timestamp: 'asc' } },
      },
    });
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.json(game);
  } catch (err) {
    console.error('Failed to fetch game:', req.params.id, err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

export default router;
