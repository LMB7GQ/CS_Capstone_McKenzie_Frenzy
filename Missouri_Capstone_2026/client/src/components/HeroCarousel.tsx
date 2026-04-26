import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Game } from '../api/gameAPI'

interface HeroCarouselProps {
  games: Game[]
}

export default function HeroCarousel({ games }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const navigate = useNavigate()

  const featured = games.slice(0, 6)

  // ── Navigation ──────────────────────────────────────────
  const goTo = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrent(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning])

  const goNext = useCallback(() => {
    goTo((current + 1) % featured.length)
  }, [current, featured.length, goTo])

  // ── Autoplay ────────────────────────────────────────────
  function startAutoPlay() {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    autoPlayRef.current = setInterval(goNext, 7000)
  }

  useEffect(() => {
    if (featured.length === 0) return
    startAutoPlay()
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [goNext, featured.length])

  function handleManualNav(index: number) {
    goTo(index)
    startAutoPlay()
  }

  // ── Loading ─────────────────────────────────────────────
  if (!featured.length) {
    return (
      <div style={{
        width: '100%', height: '560px',
        backgroundColor: '#111a14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid #1e2e20',
          borderTopColor: '#4ade80',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  const game = featured[current]

  const metacriticColor =
    (game.metacritic ?? 0) >= 80 ? '#4ade80' :
    (game.metacritic ?? 0) >= 60 ? '#facc15' : '#f87171'

  const metacriticBg =
    (game.metacritic ?? 0) >= 80 ? 'rgba(74,222,128,0.1)' :
    (game.metacritic ?? 0) >= 60 ? 'rgba(250,204,21,0.1)' : 'rgba(248,113,113,0.1)'

  return (
    <section style={{
      width: '100%',
      backgroundColor: '#0a0f0d',
      paddingBottom: '0',
      position: 'relative',
    }}>

      {/* ── Main carousel area ── */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 24px 0',
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: '16px',
        minHeight: '560px',
        height: 'auto',
      }}>

        {/* ── LEFT: Large background image ── */}
        <div style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#111a14',
          cursor: 'pointer',
        }}
          onClick={() => navigate(`/games/${game._id}`)}
        >
          <img
            src={game.backgroundImage ?? ''}
            alt={game.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isTransitioning ? 0.3 : 1,
              transition: 'opacity 0.5s ease',
              display: 'block',
            }}
          />
          {/* Subtle gradient at bottom of image */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '80px',
            background: 'linear-gradient(transparent, rgba(10,15,13,0.6))',
            pointerEvents: 'none',
          }} />
        </div>

        {/* ── RIGHT: Screenshots + Info ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}>

          {/* 2x2 Screenshot grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '8px',
            flex: '0 0 220px',
          }}>
            {(game.screenshots ?? []).slice(0, 4).map((ss, i) => (
              <div key={ss.id ?? i} style={{
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#111a14',
              }}>
                <img
                  src={ss.image}
                  alt={`${game.name} screenshot ${i + 1}`}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                  }}
                />
              </div>
            ))}
            {/* Fill empty slots if fewer than 4 screenshots */}
            {Array.from({ length: Math.max(0, 4 - (game.screenshots?.length ?? 0)) }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                borderRadius: '4px',
                backgroundColor: '#111a14',
                border: '1px solid #1e2e20',
              }} />
            ))}
          </div>

          {/* Game info below screenshots */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>

            {/* Category tags */}
            {game.categories && game.categories.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {game.categories.slice(0, 3).map((cat) => (
                  <span key={cat} style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#4ade80',
                    backgroundColor: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.25)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                  }}>
                    {cat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h2
              onClick={() => navigate(`/games/${game._id}`)}
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 800,
                lineHeight: 1.1,
                color: '#e8f5e9',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                margin: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
              onMouseLeave={e => e.currentTarget.style.color = '#e8f5e9'}
            >
              {game.name}
            </h2>

            {/* Rating + Metacritic row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {game.rating != null && (
                <span style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#facc15',
                }}>
                  ★ {game.rating.toFixed(1)}
                </span>
              )}
              {game.metacritic != null && (
                <span style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: metacriticColor,
                  backgroundColor: metacriticBg,
                  border: `1px solid ${metacriticColor}`,
                  padding: '2px 8px',
                  borderRadius: '3px',
                }}>
                  {game.metacritic}
                </span>
              )}
              {game.released && (
                <span style={{
                  fontSize: '0.8rem',
                  color: '#7a9e82',
                }}>
                  {game.released.slice(0, 4)}
                </span>
              )}
            </div>

            {/* Developer / Publisher / Playtime */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {game.developer && (
                <div style={{ fontSize: '0.78rem', color: '#7a9e82' }}>
                  <span style={{ color: '#3d5c44', marginRight: '6px' }}>Developer</span>
                  {game.developer}
                </div>
              )}
              {game.publisher && (
                <div style={{ fontSize: '0.78rem', color: '#7a9e82' }}>
                  <span style={{ color: '#3d5c44', marginRight: '6px' }}>Publisher</span>
                  {game.publisher}
                </div>
              )}
              {game.playtime != null && game.playtime > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#7a9e82' }}>
                  <span style={{ color: '#3d5c44', marginRight: '6px' }}>Avg Playtime</span>
                  {game.playtime}h
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={() => navigate(`/games/${game._id}`)}
                style={{
                  flex: 1,
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#0a0f0d',
                  backgroundColor: '#4ade80',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '9px 0',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#86efac'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4ade80'}
              >
                View Game
              </button>
              <button
                style={{
                  flex: 1,
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#c8deca',
                  backgroundColor: 'transparent',
                  border: '1px solid #2a4030',
                  borderRadius: '4px',
                  padding: '9px 0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'
                  e.currentTarget.style.color = '#4ade80'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#2a4030'
                  e.currentTarget.style.color = '#c8deca'
                }}
              >
                + Library
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Thumbnail strip + arrows ── */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '12px 24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        position: 'relative',
      }}>

        {/* Left arrow */}
        <button
          onClick={() => handleManualNav((current - 1 + featured.length) % featured.length)}
          aria-label="Previous game"
          style={{
            width: '32px', height: '32px', flexShrink: 0,
            borderRadius: '50%',
            backgroundColor: 'rgba(10,15,13,0.8)',
            border: '1px solid #2a4030',
            color: '#c8deca',
            fontSize: '1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#4ade80'
            e.currentTarget.style.color = '#0a0f0d'
            e.currentTarget.style.borderColor = '#4ade80'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'rgba(10,15,13,0.8)'
            e.currentTarget.style.color = '#c8deca'
            e.currentTarget.style.borderColor = '#2a4030'
          }}
        >
          ‹
        </button>

        {/* Thumbnails */}
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          {featured.map((g, i) => (
            <button
              key={g._id}
              onClick={() => handleManualNav(i)}
              aria-label={`Go to ${g.name}`}
              style={{
                flex: 1,
                height: '60px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: i === current ? '2px solid #4ade80' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                backgroundColor: '#111a14',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
                transform: i === current ? 'translateY(-2px)' : 'none',
                position: 'relative',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (i !== current) e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'
              }}
              onMouseLeave={e => {
                if (i !== current) e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              <img
                src={g.backgroundImage ?? ''}
                alt={g.name}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', display: 'block',
                  opacity: i === current ? 1 : 0.6,
                  transition: 'opacity 0.15s ease',
                }}
              />
              {/* Progress bar on active thumb */}
              {i === current && (
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0,
                  height: '2px',
                  backgroundColor: '#4ade80',
                  animation: 'heroProgress 7s linear forwards',
                  boxShadow: '0 0 6px #4ade80',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => handleManualNav((current + 1) % featured.length)}
          aria-label="Next game"
          style={{
            width: '32px', height: '32px', flexShrink: 0,
            borderRadius: '50%',
            backgroundColor: 'rgba(10,15,13,0.8)',
            border: '1px solid #2a4030',
            color: '#c8deca',
            fontSize: '1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#4ade80'
            e.currentTarget.style.color = '#0a0f0d'
            e.currentTarget.style.borderColor = '#4ade80'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'rgba(10,15,13,0.8)'
            e.currentTarget.style.color = '#c8deca'
            e.currentTarget.style.borderColor = '#2a4030'
          }}
        >
          ›
        </button>

        {/* Slide counter */}
        <span style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: '#3d5c44',
          flexShrink: 0,
        }}>
          {current + 1} / {featured.length}
        </span>

      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </section>
  )
}