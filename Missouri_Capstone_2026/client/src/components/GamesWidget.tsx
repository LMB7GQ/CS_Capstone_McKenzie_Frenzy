import React, { useEffect, useState } from 'react'
import { fetchGames } from '../services/gameService'
import type { Game } from '../services/gameService'

export default function GamesWidget(): React.ReactElement {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    fetchGames()
      .then((data) => {
        if (!mounted) return
        setGames(data)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load games')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div style={{ padding: '8px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Games</h4>

      {loading ? (
        <div>Loading games...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
          {games.map((g) => (
            <div
              key={g.id}
              style={{
                minWidth: 160,
                border: '1px solid #eee',
                padding: 8,
                borderRadius: 6,
                background: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <img
                src={g.imageUrl}
                alt={g.title}
                style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 }}
              />
              <div style={{ fontWeight: 600, marginTop: 8 }}>{g.title}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{g.genre} • {g.platform}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
