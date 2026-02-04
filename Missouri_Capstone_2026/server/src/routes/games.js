import express from 'express'
import { dummyGames } from '../dummyData.js'

const router = express.Router()

// GET all games - returns dummy data for now
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: dummyGames,
    message: 'Games retrieved successfully'
  })
})

// GET single game by id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid game id' })
  }

  const game = dummyGames.find((g) => g.id === id)
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game not found' })
  }

  return res.json({ success: true, data: game, message: 'Game retrieved successfully' })
})

export default router