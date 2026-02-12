import React, { useEffect, useState } from 'react'
import { fetchGameById } from '../services/gameService'
import type { Game } from '../services/gameService'

interface GamesWidgetProps {
  gameId: number
}

export default function GamesWidget({ gameId }: GamesWidgetProps): React.ReactElement {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    fetchGameById(gameId)
      .then((data) => {
        if (!mounted) return
        setGame(data)
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

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
      <h4 style={{ margin: '0 0 12px 0' }}>Featured Game</h4>

      {loading ? (
        <div>Loading game...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : game ? (
        <div
          style={{
            border: '1px solid #eee',
            padding: 12,
            borderRadius: 6,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            maxWidth: 400
          }}
        >
          {game.background_image && (
            <img
              src={game.background_image}
              alt={game.name}
              style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4, marginBottom: 12 }}
            />
          )}
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{game.name}</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
            {game.genres && game.genres.length > 0 && (
              <span>{game.genres.map((g) => g.name).join(', ')} • </span>
            )}
            {game.rating && <span>⭐ {game.rating}</span>}
          </div>
          {game.released && <div style={{ fontSize: 12, color: '#999' }}>Released: {game.released}</div>}
        </div>
      ) : (
        <div>No game available</div>
      )}
    </div>
  )
}
