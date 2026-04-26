import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getGameById } from '../api/gameAPI'
import type { Game } from '../api/gameAPI'

interface MediaItem {
  type: 'video' | 'screenshot'
  id: number | string
  thumbnail: string
  src: string
  name?: string
}

const PANEL_WIDTH = 320
const MEDIA_HEIGHT = 460
const THUMB_WIDTH = 116
const THUMB_HEIGHT = 66

export default function GameDetails() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [thumbOffset, setThumbOffset] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!gameId) return
    setLoading(true)
    setActiveMediaIndex(0)
    setThumbOffset(0)
    getGameById(gameId)
      .then(data => { setGame(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [gameId])

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0a0f0d', flexDirection: 'column', gap: '20px',
    }}>
      <div style={{
        width: '44px', height: '44px', border: '3px solid #1e2e20',
        borderTopColor: '#4ade80', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error || !game) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0a0f0d', color: '#7a9e82', flexDirection: 'column', gap: '16px',
    }}>
      <h2 style={{ fontFamily: "'Exo 2', sans-serif", color: '#e8f5e9' }}>Game not found</h2>
      <button onClick={() => navigate('/')} style={{
        fontFamily: "'Exo 2', sans-serif", fontSize: '0.85rem', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: '#0a0f0d', backgroundColor: '#4ade80',
        padding: '10px 28px', borderRadius: '4px', border: 'none', cursor: 'pointer',
      }}>Back to Home</button>
    </div>
  )

  // ── Build media queue ─────────────────────────────────
  const mediaItems: MediaItem[] = [
    ...(game.videos ?? [])
      .filter(v => v.data?.max || v.data?.[480])
      .map(v => ({
        type: 'video' as const,
        id: v.id,
        thumbnail: v.preview || game.backgroundImage || '',
        src: v.data?.max || v.data?.[480] || '',
        name: v.name,
      })),
    ...(game.screenshots ?? []).map(s => ({
      type: 'screenshot' as const,
      id: s.id,
      thumbnail: s.image,
      src: s.image,
    })),
  ]

  const activeMedia = mediaItems[activeMediaIndex]
  const VISIBLE_THUMBS = 6
  const maxOffset = Math.max(0, mediaItems.length - VISIBLE_THUMBS)
  const showArrows = mediaItems.length > VISIBLE_THUMBS

  function goThumbLeft() {
    setThumbOffset(prev => prev === 0 ? maxOffset : prev - 1)
  }

  function goThumbRight() {
    setThumbOffset(prev => prev >= maxOffset ? 0 : prev + 1)
  }

  function selectMedia(globalIndex: number) {
    setActiveMediaIndex(globalIndex)
    // Shift thumb window to show selected
    if (globalIndex < thumbOffset) setThumbOffset(globalIndex)
    else if (globalIndex >= thumbOffset + VISIBLE_THUMBS)
      setThumbOffset(Math.min(globalIndex - VISIBLE_THUMBS + 1, maxOffset))
  }

  const metacriticColor =
    (game.metacritic ?? 0) >= 80 ? '#4ade80' :
    (game.metacritic ?? 0) >= 60 ? '#facc15' : '#f87171'

  const ratingColors: Record<string, string> = {
    exceptional: '#4ade80',
    recommended: '#86efac',
    meh: '#facc15',
    skip: '#f87171',
  }

  const visibleThumbs = mediaItems.slice(thumbOffset, thumbOffset + VISIBLE_THUMBS)

  return (
    <div style={{ backgroundColor: '#0a0f0d', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        position: 'relative', height: '220px',
        overflow: 'hidden', backgroundColor: '#111a14',
      }}>
        <img
          src={game.backgroundImageAdditional || game.backgroundImage || ''}
          alt={game.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,15,13,0.2), rgba(10,15,13,0.97))',
        }} />
        <div style={{
          position: 'absolute', bottom: '24px', left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: '1200px', padding: '0 24px',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
            <Link to="/" style={{ fontSize: '0.72rem', color: '#7a9e82', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
              onMouseLeave={e => e.currentTarget.style.color = '#7a9e82'}
            >Home</Link>
            {Array.isArray(game.categories) && game.categories[0] && (
              <>
                <span style={{ color: '#3d5c44', fontSize: '0.72rem' }}>›</span>
                <span style={{ fontSize: '0.72rem', color: '#7a9e82' }}>
                  {game.categories[0].replace(/_/g, ' ')}
                </span>
              </>
            )}
            <span style={{ color: '#3d5c44', fontSize: '0.72rem' }}>›</span>
            <span style={{ fontSize: '0.72rem', color: '#c8deca' }}>{game.name}</span>
          </div>
          <h1 style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '2.2rem', fontWeight: 800,
            color: '#e8f5e9', margin: 0, lineHeight: 1.1,
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          }}>{game.name}</h1>
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '28px 24px',
        display: 'grid',
        gridTemplateColumns: `1fr ${PANEL_WIDTH}px`,
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* ── LEFT column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Media player — fixed height always */}
          <div style={{
            width: '100%', height: `${MEDIA_HEIGHT}px`,
            backgroundColor: '#000', borderRadius: '6px', overflow: 'hidden',
            flexShrink: 0,
          }}>
            {activeMedia?.type === 'video' ? (
              <video
                ref={videoRef}
                key={activeMedia.src}
                src={activeMedia.src}
                controls
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : activeMedia?.type === 'screenshot' ? (
              <img
                src={activeMedia.src}
                alt="Screenshot"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', backgroundColor: '#111a14',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#3d5c44', fontFamily: "'Exo 2', sans-serif", fontSize: '0.85rem',
              }}>No media available</div>
            )}
          </div>

          {/* Thumbnail strip — fixed height always */}
          <div style={{
            height: `${THUMB_HEIGHT + 16}px`,
            display: 'flex', alignItems: 'center', gap: '8px',
            flexShrink: 0,
          }}>

            {/* Left arrow */}
            <button
              onClick={goThumbLeft}
              style={{
                flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: showArrows ? '#111a14' : 'transparent',
                border: showArrows ? '1px solid #2a4030' : '1px solid transparent',
                color: showArrows ? '#c8deca' : 'transparent',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: showArrows ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (showArrows) { e.currentTarget.style.backgroundColor = '#4ade80'; e.currentTarget.style.color = '#0a0f0d' }}}
              onMouseLeave={e => { if (showArrows) { e.currentTarget.style.backgroundColor = '#111a14'; e.currentTarget.style.color = '#c8deca' }}}
            >‹</button>

            {/* Visible thumbnails */}
            <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
              {visibleThumbs.map((item, vi) => {
                const globalIndex = thumbOffset + vi
                const isActive = globalIndex === activeMediaIndex
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => selectMedia(globalIndex)}
                    style={{
                      flex: 1, height: `${THUMB_HEIGHT}px`,
                      borderRadius: '4px', overflow: 'hidden',
                      border: isActive ? '2px solid #4ade80' : '2px solid #1e2e20',
                      cursor: 'pointer', padding: 0,
                      backgroundColor: '#111a14',
                      position: 'relative',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#2a4030' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#1e2e20' }}
                  >
                    <img
                      src={item.thumbnail}
                      alt=""
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        opacity: isActive ? 1 : 0.55,
                        transition: 'opacity 0.15s ease',
                      }}
                    />
                    {item.type === 'video' && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.35)',
                      }}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          backgroundColor: 'rgba(74,222,128,0.9)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ color: '#0a0f0d', fontSize: '0.6rem', paddingLeft: '2px' }}>▶</span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
              {/* Fill empty slots so strip stays same width */}
              {Array.from({ length: Math.max(0, VISIBLE_THUMBS - visibleThumbs.length) }).map((_, i) => (
                <div key={`empty-${i}`} style={{
                  flex: 1, height: `${THUMB_HEIGHT}px`,
                  borderRadius: '4px', backgroundColor: '#111a14',
                  border: '2px solid #1e2e20',
                }} />
              ))}
            </div>

            {/* Right arrow */}
            <button
              onClick={goThumbRight}
              style={{
                flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: showArrows ? '#111a14' : 'transparent',
                border: showArrows ? '1px solid #2a4030' : '1px solid transparent',
                color: showArrows ? '#c8deca' : 'transparent',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: showArrows ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (showArrows) { e.currentTarget.style.backgroundColor = '#4ade80'; e.currentTarget.style.color = '#0a0f0d' }}}
              onMouseLeave={e => { if (showArrows) { e.currentTarget.style.backgroundColor = '#111a14'; e.currentTarget.style.color = '#c8deca' }}}
            >›</button>

          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button style={{
              flex: 1, height: '44px',
              fontFamily: "'Exo 2', sans-serif", fontSize: '0.85rem',
              fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#0a0f0d', backgroundColor: '#4ade80',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#86efac'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4ade80'}
              onClick={() => navigate('/library/me', {
                state: {
                  autoAdd: true,
                  game: {
                    rawgId: game.rawgId,
                    name: game.name,
                    backgroundImage: game.backgroundImage,
                  }
                }
              })}
            >
              + Add to Library
            </button>
            <button style={{
              flex: 1, height: '44px',
              fontFamily: "'Exo 2', sans-serif", fontSize: '0.85rem',
              fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#4ade80', backgroundColor: 'transparent',
              border: '1px solid #4ade80', borderRadius: '4px', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.08)'
                e.currentTarget.style.borderColor = '#86efac'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = '#4ade80'
              }}
            >
              ✏ Write a Review
            </button>
          </div>

          {/* ── Description ── */}
          {game.description && (
            <div style={{ flexShrink: 0 }}>
              <h3 style={{
                fontFamily: "'Exo 2', sans-serif", fontSize: '0.8rem',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#4ade80', margin: '0 0 10px 0',
              }}>About This Game</h3>
              <p style={{
                fontSize: '0.85rem', lineHeight: 1.75, color: '#c8deca',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 10,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {game.description}
              </p>
            </div>
          )}

          {/* ── Ratings breakdown (RAWG + future user data) ── */}
          <div style={{ flexShrink: 0 }}>
            <h3 style={{
              fontFamily: "'Exo 2', sans-serif", fontSize: '0.8rem',
              fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#4ade80', margin: '0 0 14px 0',
            }}>Player Ratings</h3>

            {/* RAWG breakdown bars */}
            {game.ratingsBreakdown && game.ratingsBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {game.ratingsBreakdown.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                      color: ratingColors[r.title] || '#c8deca',
                      width: '110px', flexShrink: 0,
                    }}>
                      {r.title} ({r.count?.toLocaleString()})
                    </span>
                    <div style={{
                      flex: 1, height: '6px', backgroundColor: '#1e2e20',
                      borderRadius: '3px', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${r.percent}%`, height: '100%',
                        backgroundColor: ratingColors[r.title] || '#4ade80',
                        borderRadius: '3px',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#7a9e82', width: '36px', flexShrink: 0, textAlign: 'right' }}>
                      {r.percent?.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#3d5c44', margin: '0 0 16px 0' }}>No ratings data available</p>
            )}

            {/* User reviews placeholder — ready for JWT integration */}
            <div style={{
              backgroundColor: '#111a14', border: '1px solid #1e2e20',
              borderRadius: '6px', padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '80px',
            }}>
              <span style={{
                fontFamily: "'Exo 2', sans-serif", fontSize: '0.75rem',
                letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3d5c44',
              }}>
                User Reviews — Available after login
              </span>
            </div>
          </div>

        </div>

        {/* ── RIGHT panel — fixed width, sticky ── */}
        <div style={{
          width: `${PANEL_WIDTH}px`,
          display: 'flex', flexDirection: 'column', gap: '12px',
          position: 'sticky', top: '80px',
        }}>

          {/* Cover image */}
          <div style={{
            borderRadius: '6px', overflow: 'hidden',
            backgroundColor: '#111a14', flexShrink: 0,
          }}>
            <img
              src={game.backgroundImage || ''}
              alt={game.name}
              style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Info card */}
          <div style={{
            backgroundColor: '#111a14', border: '1px solid #1e2e20',
            borderRadius: '6px', overflow: 'hidden', flexShrink: 0,
          }}>

            {/* Rating + Metacritic */}
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid #1e2e20',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {game.rating != null && (
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#3d5c44', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Rating</div>
                  <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#facc15' }}>
                    ★ {game.rating.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#3d5c44', marginTop: '2px' }}>
                    {game.ratingsCount?.toLocaleString()} reviews
                  </div>
                </div>
              )}
              {game.metacritic != null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: '#3d5c44', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Metacritic</div>
                  <div style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '1.5rem', fontWeight: 800,
                    color: metacriticColor,
                    backgroundColor: `${metacriticColor}15`,
                    border: `2px solid ${metacriticColor}`,
                    padding: '4px 14px', borderRadius: '4px',
                  }}>{game.metacritic}</div>
                </div>
              )}
            </div>

            {/* ESRB */}
            {game.esrbRating && (
              <div style={{
                padding: '10px 16px', borderBottom: '1px solid #1e2e20',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.68rem', fontWeight: 800, color: '#e8f5e9',
                  backgroundColor: '#172011', border: '2px solid #2a4030',
                  padding: '3px 7px', borderRadius: '3px', letterSpacing: '0.05em', flexShrink: 0,
                }}>
                  {game.esrbRating.toUpperCase()}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#7a9e82' }}>{game.esrbRating}</span>
              </div>
            )}

            {/* Info rows */}
            {([
              { label: 'Release Date', value: game.released },
              { label: 'Developer', value: game.developer },
              { label: 'Publisher', value: game.publisher },
              { label: 'Avg Playtime', value: game.playtime ? `${game.playtime} hours` : null },
              { label: 'Achievements', value: game.achievementsCount ? `${game.achievementsCount}` : null },
            ] as { label: string; value: string | null | undefined }[]).filter(r => r.value).map(row => (
              <div key={row.label} style={{
                padding: '9px 16px', borderBottom: '1px solid #1e2e20',
              }}>
                <div style={{ fontSize: '0.62rem', color: '#3d5c44', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>
                  {row.label}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#c8deca', fontWeight: 500 }}>
                  {row.value}
                </div>
              </div>
            ))}

            {/* Platforms */}
            {game.platforms && game.platforms.length > 0 && (
              <div style={{ padding: '9px 16px', borderBottom: '1px solid #1e2e20' }}>
                <div style={{ fontSize: '0.62rem', color: '#3d5c44', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Platforms
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {game.platforms.map(p => (
                    <span key={p.slug} style={{
                      fontSize: '0.68rem', color: '#7a9e82',
                      backgroundColor: '#172011', border: '1px solid #1e2e20',
                      padding: '2px 7px', borderRadius: '3px',
                    }}>{p.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Store links */}
            {game.stores && game.stores.length > 0 && (
              <div style={{ padding: '9px 16px', borderBottom: '1px solid #1e2e20' }}>
                <div style={{ fontSize: '0.62rem', color: '#3d5c44', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Available On
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {game.stores.filter(s => s.name).map((store, idx) => (
                    store.url ? (
                      <a key={store.id ?? idx} href={store.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4ade80', textDecoration: 'none', transition: 'color 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#86efac'}
                        onMouseLeave={e => e.currentTarget.style.color = '#4ade80'}
                      >→ {store.name}</a>
                    ) : (
                      <span key={store.id ?? idx} style={{ fontSize: '0.78rem', color: '#7a9e82' }}>
                        {store.name}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {Array.isArray(game.categories) && game.categories.length > 0 && (
              <div style={{ padding: '9px 16px' }}>
                <div style={{ fontSize: '0.62rem', color: '#3d5c44', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>
                  Tags
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {game.categories.map(cat => (
                    <span key={cat} style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '0.62rem', fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.08)',
                      border: '1px solid rgba(74,222,128,0.25)',
                      padding: '3px 8px', borderRadius: '3px',
                    }}>{cat.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Similar Games / Series ── */}
      {game.series && game.series.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 28px' }}>
          <h2 style={{
            fontFamily: "'Exo 2', sans-serif", fontSize: '1rem',
            fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#e8f5e9', margin: '0 0 14px 0',
          }}>
            More Like This <span style={{ color: '#4ade80' }}>/ Series</span>
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {game.series.map(s => (
              <div key={s.rawgId} onClick={() => navigate(`/games/${s.rawgId}`)}
                style={{
                  width: '175px', borderRadius: '6px', overflow: 'hidden',
                  backgroundColor: '#111a14', border: '1px solid #1e2e20',
                  cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = '#4ade80'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#1e2e20'
                }}
              >
                <img src={s.backgroundImage || ''} alt={s.name}
                  style={{ width: '100%', height: '98px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '8px 10px' }}>
                  <p style={{
                    fontFamily: "'Exo 2', sans-serif", fontSize: '0.78rem', fontWeight: 700,
                    color: '#e8f5e9', margin: '0 0 4px 0',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{s.name}</p>
                  {s.rating && <span style={{ fontSize: '0.7rem', color: '#facc15' }}>★ {s.rating.toFixed(1)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Related Posts placeholder ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          height: '140px', backgroundColor: '#111a14',
          border: '1px solid #1e2e20', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: "'Exo 2', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3d5c44',
          }}>Related Posts / News — Coming Soon</span>
        </div>
      </div>

    </div>
  )
}