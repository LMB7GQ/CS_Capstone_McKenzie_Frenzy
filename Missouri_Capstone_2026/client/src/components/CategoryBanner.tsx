import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Game } from '../api/gameAPI'

interface CategoryBannerProps {
  category: string
  games: Game[]
}

export default function CategoryBanner({ category, games }: CategoryBannerProps) {
  if (!games || games.length === 0) return null

  const label = category.replace(/_/g, ' ')
  const topTwo = games.slice(0, 2)
  const bottomFour = games.slice(2, 6)

  return (
    <section style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 24px',
      position: 'relative',
      zIndex: 1,
    }}>

      {/* Title bar */}
      <div style={{
        width: '100%',
        backgroundColor: '#111a14',
        border: '1px solid #1e2e20',
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        padding: '12px 20px',
      }}>
        <h2 style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '1rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#e8f5e9',
          margin: 0,
        }}>
          {label} <span style={{ color: '#4ade80' }}>Games</span>
        </h2>
      </div>

      {/* Games grid */}
      <div style={{
        border: '1px solid #1e2e20',
        borderRadius: '0 0 6px 6px',
        backgroundColor: '#0d1610',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflow: 'visible',
      }}>

        {/* Top row — 2 large */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          overflow: 'visible',
        }}>
          {topTwo.map((game) => (
            <GameTile key={game._id} game={game} size="large" />
          ))}
          {topTwo.length < 2 && (
            <div style={{ backgroundColor: '#111a14', height: '260px', borderRadius: '4px' }} />
          )}
        </div>

        {/* Bottom row — 4 small */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '10px',
          overflow: 'visible',
        }}>
          {bottomFour.map((game) => (
            <GameTile key={game._id} game={game} size="small" />
          ))}
          {Array.from({ length: Math.max(0, 4 - bottomFour.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ backgroundColor: '#111a14', height: '150px', borderRadius: '4px' }} />
          ))}
        </div>

      </div>
    </section>
  )
}

interface GameTileProps {
  game: Game
  size: 'large' | 'small'
}

function GameTile({ game, size }: GameTileProps) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [popupSide, setPopupSide] = useState<'right' | 'left'>('right')
  const tileRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const height = size === 'large' ? '260px' : '150px'

  const screenshotImages = (game.screenshots ?? []).map(s => s.image).filter(Boolean)
  const popupImages = screenshotImages.length > 0
    ? screenshotImages
    : [game.backgroundImage].filter(Boolean) as string[]

  function handleMouseEnter() {
    if (tileRef.current) {
      const rect = tileRef.current.getBoundingClientRect()
      setPopupSide(rect.left + rect.width / 2 > window.innerWidth / 2 ? 'left' : 'right')
    }
    hoverTimerRef.current = setTimeout(() => setHovered(true), 400)
  }

  function handleMouseLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHovered(false)
    setCurrentImageIndex(0)
  }

  useEffect(() => {
    if (hovered && popupImages.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % popupImages.length)
      }, 1500)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [hovered, popupImages.length])

  const metacriticColor =
    (game.metacritic ?? 0) >= 80 ? '#4ade80' :
    (game.metacritic ?? 0) >= 60 ? '#facc15' : '#f87171'

  return (
    <div
      ref={tileRef}
      style={{
        position: 'relative',
        zIndex: hovered ? 50 : 1,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Game tile */}
      <div
        onClick={() => navigate(`/games/${game._id}`)}
        style={{
          height,
          borderRadius: '4px',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: '#111a14',
          border: hovered ? '2px solid #4ade80' : '2px solid transparent',
          transition: 'border-color 0.15s ease, transform 0.15s ease',
          transform: hovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <img
          src={game.backgroundImage ?? ''}
          alt={game.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Popup card */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: '0',
          ...(popupSide === 'right'
            ? { left: 'calc(100% + 12px)' }
            : { right: 'calc(100% + 12px)' }
          ),
          zIndex: 200,
          width: '320px',
          backgroundColor: '#1a3322',
          border: '1px solid #4ade80',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(74,222,128,0.15)',
          pointerEvents: 'none',
          animation: 'popupFadeIn 0.15s ease forwards',
        }}>

          {/* Screenshot */}
          <div style={{ height: '180px', overflow: 'hidden', position: 'relative', backgroundColor: '#111a14' }}>
            {popupImages.length > 0 ? (
              <img
                key={currentImageIndex}
                src={popupImages[currentImageIndex]}
                alt={`${game.name} screenshot`}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', display: 'block',
                  animation: 'screenshotFade 0.4s ease forwards',
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: '#111a14' }} />
            )}

            {/* Dot indicators */}
            {popupImages.length > 1 && (
              <div style={{
                position: 'absolute', bottom: '8px', left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: '5px',
              }}>
                {popupImages.slice(0, 5).map((_, i) => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: i === currentImageIndex ? '#4ade80' : 'rgba(255,255,255,0.25)',
                    transition: 'background-color 0.2s ease',
                    boxShadow: i === currentImageIndex ? '0 0 6px #4ade80' : 'none',
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: '14px 16px', backgroundColor: '#1a3322' }}>

            <h3 style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '1rem', fontWeight: 800,
              color: '#e8f5e9', margin: '0 0 6px 0', lineHeight: 1.2,
            }}>
              {game.name}
            </h3>

            {game.released && (
              <p style={{ fontSize: '0.72rem', color: '#7a9e82', margin: '0 0 10px 0' }}>
                Released: {game.released}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              {game.rating != null && (
                <span style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.88rem', fontWeight: 700, color: '#facc15',
                }}>
                  ★ {game.rating.toFixed(1)}
                </span>
              )}
              {game.metacritic != null && (
                <span style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.85rem', fontWeight: 800,
                  color: metacriticColor,
                  backgroundColor: `${metacriticColor}20`,
                  border: `1px solid ${metacriticColor}`,
                  padding: '2px 8px', borderRadius: '3px',
                }}>
                  {game.metacritic}
                </span>
              )}
            </div>

            {Array.isArray(game.categories) && game.categories.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {game.categories.slice(0, 4).map(cat => (
                  <span key={cat} style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '0.62rem', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: '#4ade80',
                    backgroundColor: 'rgba(74,222,128,0.1)',
                    border: '1px solid rgba(74,222,128,0.3)',
                    padding: '2px 8px', borderRadius: '3px',
                  }}>
                    {cat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes screenshotFade {
          from { opacity: 0.4; }
          to   { opacity: 1; }
        }
      `}</style>

    </div>
  )
}