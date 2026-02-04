import express from 'express'
import cors from 'cors'
import gamesRouter from './routes/games.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running 🚀' })
})

// Register game routes at /api/games
app.use('/api/games', gamesRouter)

export default app
