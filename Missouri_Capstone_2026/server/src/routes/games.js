import express from 'express'
import { fetchAllGamesFromRAWG, fetchGameByIdFromRAWG } from '../integrations/gameAPI.js'

const router = express.Router()

// GET all games - fetch from RAWG API and return the first game for testing
router.get('/', async (req, res) => {
  try {
    const games = await fetchAllGamesFromRAWG(20, 1)
    
    if (!games || games.length === 0) {
      return res.status(404).json({ success: false, message: 'No games found' })
    }

    // Return only the first game for testing, with RAWG's original data structure
    const firstGame = games[0]
    
    res.json({
      success: true,
      data: firstGame,
      message: 'Game retrieved successfully from RAWG'
    })
  } catch (error) {
    console.error('Games route error:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET single game by id - fetch specific game from RAWG by game ID
router.get('/:id', async (req, res) => {
  try {
    const gameId = req.params.id
    
    if (!gameId) {
      return res.status(400).json({ success: false, message: 'Game ID is required' })
    }

    const game = await fetchGameByIdFromRAWG(gameId)

    res.json({
      success: true,
      data: game,
      message: 'Game details retrieved successfully from RAWG'
    })
  } catch (error) {
    console.error('Game details route error:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router