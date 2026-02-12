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
      setError('No game ID provided')
      setLoading(false)
      return
    }

    let mounted = true

    fetchGameById(gameId)
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

  if (loading) return <div style={{ padding: 16 }}>Loading game...</div>
  if (error) return <div style={{ padding: 16, color: 'red' }}>Error: {error}</div>
  if (!game) return <div style={{ padding: 16 }}>Game not available</div>

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>{game.name}</h1>

      <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
        {/* Left: Image */}
        {game.background_image && (
          <img
            src={game.background_image}
            alt={game.name}
            style={{ width: 300, height: 400, objectFit: 'cover', borderRadius: 8 }}
          />
        )}

        {/* Right: Details */}
        <div>
          {/* Description */}
          {game.description_raw && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ lineHeight: 1.6, color: '#333' }}>{game.description_raw}</p>
            </div>
          )}

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            {game.rating && (
              <div>
                <strong>Rating:</strong> {game.rating} / 5.0 ⭐
              </div>
            )}

            {game.metacritic && (
              <div>
                <strong>Metacritic:</strong> {game.metacritic}
              </div>
            )}

            {game.released && (
              <div>
                <strong>Release Date:</strong> {game.released}
              </div>
            )}

            {game.playtime && (
              <div>
                <strong>Average Playtime:</strong> {game.playtime} hours
              </div>
            )}

            {/* Genres */}
            {game.genres && game.genres.length > 0 && (
              <div>
                <strong>Genres:</strong>{' '}
                {game.genres.map((g) => g.name).join(', ')}
              </div>
            )}

            {/* Platforms */}
            {game.platforms && game.platforms.length > 0 && (
              <div>
                <strong>Platforms:</strong>{' '}
                {game.platforms
                  .map((p) => p.platform.name)
                  .join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
