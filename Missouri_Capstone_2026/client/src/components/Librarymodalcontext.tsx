import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAuth, getMyLibrary, addGameToFolder } from '../api/Libraryapi'
import type { LibraryFolder } from '../api/Libraryapi'

// ── Types ─────────────────────────────────────────────────
interface GameToAdd {
  rawgId: number
  name: string
  backgroundImage?: string
}

interface LibraryModalContextType {
  openAddToLibrary: (game: GameToAdd) => void
}

// ── Context ───────────────────────────────────────────────
const LibraryModalContext = createContext<LibraryModalContextType | null>(null)

export function useLibraryModal() {
  const ctx = useContext(LibraryModalContext)
  if (!ctx) throw new Error('useLibraryModal must be used inside LibraryModalProvider')
  return ctx
}

const STATUSES = ['wishlist', 'playing', 'completed', 'dropped']
const STATUS_LABELS: Record<string, string> = {
  wishlist: 'Wishlist', playing: 'Playing',
  completed: 'Completed', dropped: 'Dropped',
}

// ── Provider ──────────────────────────────────────────────
export function LibraryModalProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [game, setGame] = useState<GameToAdd | null>(null)
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('wishlist')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const openAddToLibrary = useCallback(async (gameToAdd: GameToAdd) => {
    setError('')
    setSuccess(false)
    setSelectedStatus('wishlist')
    setLoading(true)

    // Check auth first
    const auth = await checkAuth()
    if (!auth.ok || !auth.user) {
      navigate('/login')
      return
    }

    // Load user folders
    try {
      const userFolders = await getMyLibrary()
      setFolders(userFolders)
      setSelectedFolderId(userFolders[0]?.folderId ?? '')
    } catch {
      setFolders([])
    }

    setGame(gameToAdd)
    setLoading(false)
    setIsOpen(true)
  }, [navigate])

  function close() {
    setIsOpen(false)
    setGame(null)
    setError('')
    setSuccess(false)
    setSaving(false)
  }

  async function handleSave() {
    if (!game || !selectedFolderId) {
      setError('Please select a folder')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addGameToFolder(selectedFolderId, {
        gameRawgId: game.rawgId,
        gameName: game.name,
        status: selectedStatus,
      })
      setSuccess(true)
      setTimeout(() => close(), 1200)
    } catch (err: any) {
      setError(err.message || 'Failed to add game')
    }
    setSaving(false)
  }

  return (
    <LibraryModalContext.Provider value={{ openAddToLibrary }}>
      {children}

      {/* ── Global Add to Library Modal ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div style={{
            backgroundColor: '#0d1610',
            border: '1px solid #2a4030',
            borderRadius: '10px',
            padding: '28px',
            width: '100%', maxWidth: '380px',
            position: 'relative',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
            animation: 'fadeSlideUp 0.2s ease forwards',
          }}>

            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
              background: 'linear-gradient(90deg, transparent, #4ade80, transparent)',
            }} />

            {/* Close button */}
            <button
              onClick={close}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'none', border: 'none', color: '#3d5c44',
                fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1,
                padding: '4px 8px', transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#e8f5e9'}
              onMouseLeave={e => e.currentTarget.style.color = '#3d5c44'}
            >×</button>

            {/* Title */}
            <h3 style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '0.9rem', fontWeight: 800,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#e8f5e9', margin: '0 0 16px 0',
            }}>
              Add to Library
            </h3>

            {/* Game preview */}
            {game && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                backgroundColor: '#111a14', border: '1px solid #1e2e20',
                borderRadius: '6px', padding: '10px', marginBottom: '18px',
              }}>
                {game.backgroundImage && (
                  <img
                    src={game.backgroundImage} alt={game.name}
                    style={{ width: '56px', height: '32px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }}
                  />
                )}
                <span style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.82rem', fontWeight: 700,
                  color: '#e8f5e9',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {game.name}
                </span>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div style={{
                  width: '28px', height: '28px', border: '2px solid #1e2e20',
                  borderTopColor: '#4ade80', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
              </div>
            ) : success ? (
              <div style={{
                textAlign: 'center', padding: '20px 0',
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '0.85rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#4ade80',
              }}>
                ✓ Added to Library!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Folder select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelSt}>Select Folder</label>
                  {folders.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#f87171', margin: 0 }}>
                      No folders found.{' '}
                      <button onClick={() => { close(); navigate('/library/me') }} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
                        Go to Library →
                      </button>
                    </p>
                  ) : (
                    <select
                      value={selectedFolderId}
                      onChange={e => setSelectedFolderId(e.target.value)}
                      style={selectSt}
                    >
                      {folders.map(f => (
                        <option key={f.folderId} value={f.folderId}>{f.folderName}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Status select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelSt}>Status</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        style={{
                          flex: 1, minWidth: '80px',
                          padding: '7px 4px',
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '0.68rem', fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          color: selectedStatus === s ? '#0a0f0d' : '#7a9e82',
                          backgroundColor: selectedStatus === s ? '#4ade80' : '#111a14',
                          border: selectedStatus === s ? '1px solid #4ade80' : '1px solid #2a4030',
                          borderRadius: '4px', cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p style={{ fontSize: '0.78rem', color: '#f87171', margin: 0 }}>{error}</p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button onClick={close} style={{
                    flex: 1, height: '40px',
                    fontFamily: "'Exo 2', sans-serif", fontSize: '0.75rem', fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: '#7a9e82', backgroundColor: 'transparent',
                    border: '1px solid #2a4030', borderRadius: '4px', cursor: 'pointer',
                  }}>Cancel</button>
                  <button
                    onClick={handleSave}
                    disabled={saving || folders.length === 0}
                    style={{
                      flex: 2, height: '40px',
                      fontFamily: "'Exo 2', sans-serif", fontSize: '0.75rem', fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: '#0a0f0d', backgroundColor: '#4ade80',
                      border: 'none', borderRadius: '4px',
                      cursor: saving || folders.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: saving || folders.length === 0 ? 0.6 : 1,
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#86efac' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#4ade80' }}
                  >
                    {saving ? 'Saving...' : '+ Add to Library'}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </LibraryModalContext.Provider>
  )
}

// ── Style helpers ─────────────────────────────────────────
const labelSt: React.CSSProperties = {
  fontFamily: "'Exo 2', sans-serif", fontSize: '0.65rem', fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a9e82',
}

const selectSt: React.CSSProperties = {
  width: '100%', backgroundColor: '#111a14', border: '1px solid #2a4030',
  borderRadius: '6px', color: '#e8f5e9', fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.875rem', padding: '10px 12px', outline: 'none',
  boxSizing: 'border-box', cursor: 'pointer',
}