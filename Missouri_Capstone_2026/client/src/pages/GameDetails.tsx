import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchGameById } from '../services/gameService'
import type { Game } from '../services/gameService'

export default function GameDetails(): React.ReactElement {
  const { gameId } = useParams<{ gameId: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gameId) {
      setError('No game id provided')
      setLoading(false)
      return
    }

    let mounted = true

    fetchGameById(Number(gameId))
      .then((g) => {
        if (!mounted) return
        if (!g) setError('Game not found')
        else setGame(g)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load game')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [gameId])

  if (loading) return <div>Loading game...</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>
  if (!game) return <div>Game not available</div>

  return (
    <div style={{ padding: 16 }}>
      <h1>{game.title}</h1>
      <div style={{ display: 'flex', gap: 16 }}>
        <img src={game.imageUrl} alt={game.title} style={{ width: 300, height: 400, objectFit: 'cover' }} />
        <div>
          <p>{game.description}</p>
          <p>
            <strong>Genre:</strong> {game.genre}
          </p>
          <p>
            <strong>Platform:</strong> {game.platform}
          </p>
          <p>
            <strong>Rating:</strong> {game.rating}
          </p>
          <p>
            <strong>Release Date:</strong> {game.releaseDate}
          </p>
        </div>
      </div>
    </div>
  )
}
