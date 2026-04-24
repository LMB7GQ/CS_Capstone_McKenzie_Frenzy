import { useState, useEffect, useRef, type DragEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getMyLibrary, createFolder, deleteFolder, addGameToFolder, checkAuth } from '../api/Libraryapi'
import type { LibraryFolder, LibraryGame } from '../api/Libraryapi'

const STATUS_COLORS: Record<string, string> = {
  wishlist: '#facc15', playing: '#4ade80',
  completed: '#60a5fa', dropped: '#f87171',
}
const STATUS_LABELS: Record<string, string> = {
  wishlist: 'Wishlist', playing: 'Playing',
  completed: 'Completed', dropped: 'Dropped',
}
const STATUSES = ['wishlist', 'playing', 'completed', 'dropped']

// Fetch games from our DB for the add-game picker
async function searchDBGames(query: string) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const res = await fetch(`${base}/games?search=${encodeURIComponent(query)}&limit=10`)
  const json = await res.json()
  return json.data ?? []
}

// Enrich games with background images from the games API
async function enrichGamesWithImages(games: LibraryGame[]): Promise<LibraryGame[]> {
  if (games.length === 0) return games
  
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  
  // Fetch game details for all games that don't have images
  const gamesToEnrich = games.filter(game => !game.backgroundImage)
  
  if (gamesToEnrich.length === 0) return games
  
  try {
    // Fetch details for each game
    const enrichedGames = await Promise.all(
      gamesToEnrich.map(async (game) => {
        try {
          const res = await fetch(`${base}/games/${game.rawgId}`)
          const json = await res.json()
          return {
            ...game,
            backgroundImage: json.data?.backgroundImage || json.backgroundImage
          }
        } catch (err) {
          console.warn(`Failed to fetch image for game ${game.rawgId}:`, err)
          return game // Return game without image if fetch fails
        }
      })
    )
    
    // Merge enriched games back into the original array
    return games.map(game => {
      const enriched = enrichedGames.find(eg => eg.folderGameId === game.folderGameId)
      return enriched || game
    })
  } catch (err) {
    console.warn('Failed to enrich games with images:', err)
    return games
  }
}

export default function Library() {
  const navigate = useNavigate()
  const location = useLocation()

  // ── Auth ──────────────────────────────────────────────────
  const [authChecking, setAuthChecking] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null)

  // ── Data ──────────────────────────────────────────────────
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [loading, setLoading] = useState(true)

  // ── Navigation ────────────────────────────────────────────
  // null = root (showing folders), string = folderId (showing games inside)
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  // ── Modes ─────────────────────────────────────────────────
  const [deleteMode, setDeleteMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // ── Drag / reorder ─────────────────────────────────────────
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [draggingGameId, setDraggingGameId] = useState<string | null>(null)
  const [dragOverGameIndex, setDragOverGameIndex] = useState<number | null>(null)

  // ── Modals ────────────────────────────────────────────────
  type ModalType = null | 'addChoice' | 'addFolder' | 'addGame' | 'editFolder' | 'deleteConfirm'
  const [modal, setModal] = useState<ModalType>(null)
  const [modalTarget, setModalTarget] = useState<LibraryFolder | LibraryGame | null>(null)
  const [deleteType, setDeleteType] = useState<'folder' | 'game'>('folder')

  // ── Form state ────────────────────────────────────────────
  const [folderName, setFolderName] = useState('')
  const [folderError, setFolderError] = useState('')
  const [gameSearch, setGameSearch] = useState('')
  const [gameResults, setGameResults] = useState<any[]>([])
  const [selectedGame, setSelectedGame] = useState<any | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('wishlist')
  const [selectedFolderForGame, setSelectedFolderForGame] = useState('')
  const [gameError, setGameError] = useState('')
  const [saving, setSaving] = useState(false)

  const gameSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auth check ────────────────────────────────────────────
  useEffect(() => {
    checkAuth().then(result => {
      if (result.ok && result.user) {
        setCurrentUser({ username: result.user.username })
      } else {
        navigate('/login')
      }
      setAuthChecking(false)
    })
  }, [navigate])

  useEffect(() => {
    if (!authChecking && !currentUser) {
      navigate('/login')
    }
  }, [authChecking, currentUser, navigate])

  // ── Load library ──────────────────────────────────────────
  useEffect(() => {
    if (authChecking) return
    setLoading(true)
    getMyLibrary()
      .then(async (data) => {
        // Enrich all games in all folders with background images
        const enrichedFolders = await Promise.all(
          data.map(async (folder) => ({
            ...folder,
            games: await enrichGamesWithImages(folder.games)
          }))
        )
        
        setFolders(enrichedFolders)

        // Auto-open add game modal if navigated from a game page
        const state = location.state as any
        if (state?.autoAdd && state?.game) {
          setSelectedGame(state.game)
          setGameSearch(state.game.name)
          setSelectedFolderForGame(enrichedFolders[0]?.folderId ?? '')
          setModal('addGame')
          // Clear the state so refreshing doesn't reopen it
          window.history.replaceState({}, '')
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [authChecking])

  // ── Derived ───────────────────────────────────────────────
  const openFolder = folders.find(f => f.folderId === openFolderId) ?? null

  const filteredFolders = searchQuery
    ? folders.filter(f =>
        f.folderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.games.some(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : folders

  const filteredGames = openFolder
    ? (searchQuery
        ? openFolder.games.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : openFolder.games)
    : []

  // ── Handlers ──────────────────────────────────────────────
  function openAddChoice() {
    setDeleteMode(false)
    setEditMode(false)
    setModal('addChoice')
  }

  function openAddFolder() {
    setDeleteMode(false)
    setEditMode(false)
    setFolderName('')
    setFolderError('')
    setModal('addFolder')
  }

  function openAddGame() {
    setDeleteMode(false)
    setEditMode(false)
    setGameSearch('')
    setGameResults([])
    setSelectedGame(null)
    setSelectedStatus('wishlist')
    setSelectedFolderForGame(openFolderId ?? folders[0]?.folderId ?? '')
    setGameError('')
    setModal('addGame')
  }

  function openEditFolder(folder: LibraryFolder) {
    setDeleteMode(false)
    setEditMode(false)
    setFolderName(folder.folderName)
    setFolderError('')
    setModalTarget(folder)
    setModal('editFolder')
  }

  function triggerDeleteMode() {
    setDeleteMode(prev => !prev)
    if (!deleteMode) setEditMode(false)
  }

  function triggerEditMode() {
    setEditMode(prev => !prev)
    if (!editMode) setDeleteMode(false)
  }

  function closeModal() {
    setModal(null)
    setModalTarget(null)
    setSaving(false)
  }

  function moveFolder(dragId: string, dropId: string) {
    setFolders(prev => {
      const fromIndex = prev.findIndex(item => item.folderId === dragId)
      const toIndex = prev.findIndex(item => item.folderId === dropId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
  }

  function handleFolderDragStart(folderId: string) {
    setDraggingFolderId(folderId)
  }

  function handleFolderDragOver(folderId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOverFolderId(folderId)
  }

  function handleFolderDrop(folderId: string) {
    if (draggingFolderId && draggingFolderId !== folderId) {
      moveFolder(draggingFolderId, folderId)
    }
    setDraggingFolderId(null)
    setDragOverFolderId(null)
  }

  // Game drag handlers
  function handleGameDragStart(gameId: string) {
    setDraggingGameId(gameId)
  }

  function handleGameDragOver(index: number, event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOverGameIndex(index)
  }

  function handleGameDrop(targetIndex: number) {
    if (draggingGameId && openFolderId) {
      moveGameInFolder(openFolderId, draggingGameId, targetIndex)
    }
    setDraggingGameId(null)
    setDragOverGameIndex(null)
  }

  function moveGameInFolder(folderId: string, gameId: string, targetIndex: number) {
    setFolders(prev => prev.map(f => {
      if (f.folderId === folderId) {
        const gameIndex = f.games.findIndex(g => g.folderGameId === gameId)
        if (gameIndex === -1 || gameIndex === targetIndex) return f
        
        const updatedGames = [...f.games]
        const [moved] = updatedGames.splice(gameIndex, 1)
        updatedGames.splice(targetIndex, 0, moved)
        return { ...f, games: updatedGames }
      }
      return f
    }))
  }

  // Delete folder
  async function handleDeleteFolder(folder: LibraryFolder) {
    setModalTarget(folder)
    setDeleteType('folder')
    setModal('deleteConfirm')
  }

  // Create folder
  async function handleCreateFolder() {
    if (!folderName.trim()) { setFolderError('Name is required'); return }
    setSaving(true)
    try {
      const newFolder = await createFolder(folderName.trim())
      const folderWithGames: LibraryFolder = {
        folderId: (newFolder as any)._id ?? newFolder.folderId,
        folderName: (newFolder as any).NAME ?? newFolder.folderName ?? folderName.trim(),
        userId: (newFolder as any).USER_ID ?? newFolder.userId,
        createdDate: (newFolder as any).CREATED_DATE ?? newFolder.createdDate,
        games: [],
      }
      setFolders(prev => [...prev, folderWithGames])
      closeModal()
    } catch (err: any) {
      setFolderError(err.message)
    }
    setSaving(false)
  }

  async function confirmDelete() {
    if (!modalTarget) return
    setSaving(true)
    try {
      if (deleteType === 'folder') {
        const folder = modalTarget as LibraryFolder
        await deleteFolder(folder.folderId)
        setFolders(prev => prev.filter(f => f.folderId !== folder.folderId))
        if (openFolderId === folder.folderId) setOpenFolderId(null)
      }
      closeModal()
      setDeleteMode(false)
    } catch (err: any) {
      console.error(err)
    }
    setSaving(false)
  }

  // Add game to folder
  async function handleAddGame() {
    if (!selectedGame) { setGameError('Select a game'); return }
    if (!selectedFolderForGame) { setGameError('Select a folder'); return }
    setSaving(true)
    try {
      await addGameToFolder(selectedFolderForGame, {
        gameRawgId: selectedGame.rawgId,
        gameName: selectedGame.name,
        status: selectedStatus,
      })
      // Optimistically add to local state
      const newGame: LibraryGame = {
        folderGameId: Date.now().toString(),
        rawgId: selectedGame.rawgId,
        name: selectedGame.name,
        status: selectedStatus,
        rating: null,
        addedDate: new Date().toISOString(),
        backgroundImage: selectedGame.backgroundImage,
      }
      setFolders(prev => prev.map(f =>
        f.folderId === selectedFolderForGame
          ? { ...f, games: [...f.games, newGame] }
          : f
      ))
      closeModal()
    } catch (err: any) {
      setGameError(err.message)
    }
    setSaving(false)
  }

  // Game search debounce
  function handleGameSearch(val: string) {
    setGameSearch(val)
    setSelectedGame(null)
    if (gameSearchTimer.current) clearTimeout(gameSearchTimer.current)
    if (!val.trim()) { setGameResults([]); return }
    gameSearchTimer.current = setTimeout(async () => {
      const results = await searchDBGames(val)
      setGameResults(results)
    }, 350)
  }

  // ── Loading ───────────────────────────────────────────────
  if (authChecking || loading) return (
    <div style={{
      height: 'calc(100vh - 62px)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0a0f0d', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px', border: '3px solid #1e2e20',
        borderTopColor: '#4ade80', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', paddingTop: '62px',
      backgroundColor: '#0a0f0d', overflow: 'hidden',
    }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: '240px', flexShrink: 0,
        backgroundColor: '#0d1610', borderRight: '1px solid #1e2e20',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e2e20', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <span style={{ color: '#4ade80', fontSize: '1rem' }}>⬡</span>
            <div>
              <div style={{
                fontFamily: "'Exo 2', sans-serif", fontSize: '0.8rem',
                fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e8f5e9',
              }}>My Library</div>
              {currentUser && <div style={{ fontSize: '0.62rem', color: '#3d5c44' }}>{currentUser.username}</div>}
            </div>
          </div>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', height: '30px',
            backgroundColor: '#111a14', border: '1px solid #2a4030', borderRadius: '5px', overflow: 'hidden',
          }}>
            <span style={{ padding: '0 7px', color: '#3d5c44', fontSize: '0.8rem' }}>⌕</span>
            <input
              type="text" placeholder="Search..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#e8f5e9', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem',
                padding: '0 6px 0 0', height: '100%',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                background: 'none', border: 'none', color: '#3d5c44',
                cursor: 'pointer', padding: '0 7px', fontSize: '0.85rem',
              }}>×</button>
            )}
          </div>
        </div>

        {/* Folder list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {filteredFolders.map(folder => {
            const isOpen = folder.folderId === openFolderId
            return (
              <button key={folder.folderId}
                onClick={() => { setOpenFolderId(folder.folderId); setSearchQuery(''); setDeleteMode(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: isOpen ? 'rgba(74,222,128,0.07)' : 'transparent',
                  borderLeft: `3px solid ${isOpen ? '#4ade80' : 'transparent'}`,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)' }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>
                  {folder.folderName === 'Wishlist' ? '⭐' :
                   folder.folderName === 'Playing' ? '🎮' :
                   folder.folderName === 'Completed' ? '✅' : '📁'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Exo 2', sans-serif", fontSize: '0.78rem', fontWeight: 600,
                    color: isOpen ? '#4ade80' : '#c8deca',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{folder.folderName}</div>
                  <div style={{ fontSize: '0.62rem', color: '#3d5c44' }}>
                    {folder.games.length} games
                  </div>
                </div>
              </button>
            )
          })}

          {filteredFolders.length === 0 && (
            <div style={{
              padding: '20px', textAlign: 'center', fontSize: '0.72rem',
              color: '#3d5c44', fontFamily: "'Exo 2', sans-serif",
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>No folders</div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          height: '52px', flexShrink: 0,
          backgroundColor: '#0d1610', borderBottom: '1px solid #1e2e20',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: '8px',
        }}>

          {/* Back button when inside folder */}
          {openFolderId && (
            <button
              onClick={() => { setOpenFolderId(null); setDeleteMode(false); setSearchQuery('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontFamily: "'Exo 2', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#7a9e82', backgroundColor: 'transparent',
                border: '1px solid #2a4030', borderRadius: '4px',
                padding: '0 12px', height: '28px', cursor: 'pointer',
                transition: 'all 0.15s ease', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.color = '#4ade80' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a4030'; e.currentTarget.style.color = '#7a9e82' }}
            >
              ← Back
            </button>
          )}

          {/* Title */}
          <h2 style={{
            fontFamily: "'Exo 2', sans-serif", fontSize: '0.9rem',
            fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#e8f5e9', margin: 0, flex: 1,
          }}>
            {openFolder ? (
              <>{openFolder.folderName} <span style={{ color: '#3d5c44', fontWeight: 400, fontSize: '0.68rem', marginLeft: '6px' }}>{openFolder.games.length} games</span></>
            ) : 'Library'}
          </h2>

          {/* Action buttons */}
          <button onClick={openAddChoice} style={topBtn('#4ade80', '#0a0f0d')}>
            + Add
          </button>
          <button onClick={triggerEditMode} style={topBtn(editMode ? '#f87171' : 'transparent', editMode ? '#0a0f0d' : '#f5a623', !editMode, '#f5a623')}>
            {editMode ? 'Done' : 'Edit'}
          </button>
          <button
            onClick={triggerDeleteMode}
            style={topBtn(deleteMode ? '#f87171' : 'transparent', deleteMode ? '#0a0f0d' : '#f87171', !deleteMode, '#f87171')}
          >
            {deleteMode ? '✕ Done' : '🗑 Delete'}
          </button>
        </div>

        {/* Grid area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ROOT VIEW — show folder cards */}
          {!openFolderId && (
            filteredFolders.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                <EmptyState icon="📂" message="No folders yet" subtext="Click + Add to create your first folder" />
                <button
                  onClick={openAddFolder}
                  style={{
                    padding: '12px 20px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#4ade80', color: '#0a0f0d', fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >Create Folder</button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '16px',
              }}>
                {filteredFolders.map(folder => (
                  <FolderCard
                    key={folder.folderId}
                    folder={folder}
                    deleteMode={deleteMode}
                    editMode={editMode}
                    isDragOver={dragOverFolderId === folder.folderId}
                    draggable={!deleteMode}
                    onDragStart={() => handleFolderDragStart(folder.folderId)}
                    onDragOver={e => handleFolderDragOver(folder.folderId, e)}
                    onDrop={() => handleFolderDrop(folder.folderId)}
                    onClick={() => { if (!deleteMode && !editMode) { setOpenFolderId(folder.folderId); setSearchQuery('') } }}
                    onDelete={() => handleDeleteFolder(folder)}
                    onEdit={() => openEditFolder(folder)}
                  />
                ))}
              </div>
            )
          )}

          {/* FOLDER VIEW — show game cards */}
          {openFolderId && (
            filteredGames.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                <EmptyState icon="🎮" message="No games in this folder" subtext="Click + Add to add a game" />
                <button
                  onClick={openAddGame}
                  style={{
                    padding: '12px 20px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#4ade80', color: '#0a0f0d', fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >Add Game</button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                gap: '16px',
              }}>
                {filteredGames.map((game, index) => (
                  <GameCard
                    key={game.folderGameId}
                    game={game}
                    deleteMode={deleteMode}
                    draggable={!deleteMode}
                    isDragOver={dragOverGameIndex === index}
                    onDragStart={() => handleGameDragStart(game.folderGameId)}
                    onDragOver={e => handleGameDragOver(index, e)}
                    onDrop={() => handleGameDrop(index)}
                    onView={() => navigate(`/games/${game.rawgId}`)}
                    onDelete={() => {
                      setModalTarget(game)
                      setDeleteType('game')
                      setModal('deleteConfirm')
                    }}
                  />
                ))}
              </div>
            )
          )}

        </div>
      </div>

      {/* ═══════════ MODALS ═══════════ */}

      {/* Add choice modal */}
      {modal === 'addChoice' && (
        <Overlay onClose={closeModal}>
          <ModalBox title="What do you want to add?">
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button onClick={() => { closeModal(); openAddFolder() }} style={choiceBtn}>
                <span style={{ fontSize: '2rem' }}>📁</span>
                <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#c8deca' }}>
                  New Folder
                </span>
              </button>
              <button onClick={() => { closeModal(); openAddGame() }} style={choiceBtn}>
                <span style={{ fontSize: '2rem' }}>🎮</span>
                <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#c8deca' }}>
                  Add Game
                </span>
              </button>
            </div>
            <ModalFooter onClose={closeModal} hideConfirm />
          </ModalBox>
        </Overlay>
      )}

      {/* Add folder modal */}
      {modal === 'addFolder' && (
        <Overlay onClose={closeModal}>
          <ModalBox title="New Folder">
            <Field label="Folder Name">
              <input
                type="text" value={folderName} autoFocus
                onChange={e => setFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                placeholder="e.g. Favourites"
                style={inputSt}
              />
              {folderError && <ErrMsg msg={folderError} />}
            </Field>
            <ModalFooter
              onClose={closeModal}
              onConfirm={handleCreateFolder}
              confirmLabel={saving ? 'Creating...' : 'Create Folder'}
              disabled={saving}
            />
          </ModalBox>
        </Overlay>
      )}

      {/* Add game modal */}
      {modal === 'addGame' && (
        <Overlay onClose={closeModal}>
          <ModalBox title="Add Game to Folder">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Game search */}
              <Field label="Search Game">
                <input
                  type="text" value={gameSearch} autoFocus
                  onChange={e => handleGameSearch(e.target.value)}
                  placeholder="Type a game name..."
                  style={inputSt}
                />
                {gameResults.length > 0 && !selectedGame && (
                  <div style={{
                    marginTop: '4px', backgroundColor: '#111a14',
                    border: '1px solid #2a4030', borderRadius: '6px',
                    overflow: 'hidden', maxHeight: '180px', overflowY: 'auto',
                  }}>
                    {gameResults.map((g: any) => (
                      <button key={g._id} onClick={() => { setSelectedGame(g); setGameSearch(g.name); setGameResults([]) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 12px', border: 'none', backgroundColor: 'transparent',
                          cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {g.backgroundImage && (
                          <img src={g.backgroundImage} alt="" style={{ width: '48px', height: '28px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '0.82rem', color: '#c8deca', fontFamily: "'DM Sans', sans-serif" }}>{g.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedGame && (
                  <div style={{
                    marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
                    borderRadius: '5px', padding: '6px 10px',
                  }}>
                    <span style={{ fontSize: '0.82rem', color: '#4ade80', fontFamily: "'DM Sans', sans-serif", flex: 1 }}>✓ {selectedGame.name}</span>
                    <button onClick={() => { setSelectedGame(null); setGameSearch('') }} style={{ background: 'none', border: 'none', color: '#3d5c44', cursor: 'pointer', fontSize: '0.9rem' }}>×</button>
                  </div>
                )}
              </Field>

              {/* Folder select */}
              <Field label="Add to Folder">
                <select
                  value={selectedFolderForGame}
                  onChange={e => setSelectedFolderForGame(e.target.value)}
                  style={{ ...inputSt, cursor: 'pointer' }}
                >
                  {folders.map(f => (
                    <option key={f.folderId} value={f.folderId}>{f.folderName}</option>
                  ))}
                </select>
              </Field>

              {/* Status select */}
              <Field label="Status">
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ ...inputSt, cursor: 'pointer' }}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </Field>

              {gameError && <ErrMsg msg={gameError} />}
            </div>
            <ModalFooter
              onClose={closeModal}
              onConfirm={handleAddGame}
              confirmLabel={saving ? 'Adding...' : 'Add Game'}
              disabled={saving}
            />
          </ModalBox>
        </Overlay>
      )}

      {/* Edit folder modal */}
      {modal === 'editFolder' && modalTarget && 'folderId' in modalTarget && (
        <Overlay onClose={closeModal}>
          <ModalBox title={`Edit "${(modalTarget as LibraryFolder).folderName}"`}>
            <Field label="Folder Name">
              <input
                type="text" value={folderName} autoFocus
                onChange={e => setFolderName(e.target.value)}
                placeholder="Folder name"
                style={inputSt}
              />
              {folderError && <ErrMsg msg={folderError} />}
            </Field>
            <ModalFooter
              onClose={closeModal}
              onConfirm={async () => {
                if (!folderName.trim()) { setFolderError('Name is required'); return }
                const folderId = (modalTarget as LibraryFolder).folderId
                setFolders(prev => prev.map(f => f.folderId === folderId ? { ...f, folderName: folderName.trim() } : f))
                closeModal()
                setEditMode(false)
              }}
              confirmLabel="Save Changes"
            />
          </ModalBox>
        </Overlay>
      )}

      {/* Delete confirm modal */}
      {modal === 'deleteConfirm' && modalTarget && (
        <Overlay onClose={closeModal}>
          <ModalBox title={deleteType === 'folder' ? 'Delete Folder' : 'Remove Game'}>
            <p style={{ fontSize: '0.85rem', color: '#c8deca', lineHeight: 1.6, margin: 0 }}>
              {deleteType === 'folder' ? (
                <>Are you sure you want to delete <strong style={{ color: '#e8f5e9' }}>{(modalTarget as LibraryFolder).folderName}</strong>? All games inside will be removed.</>
              ) : (
                <>Remove <strong style={{ color: '#e8f5e9' }}>{(modalTarget as LibraryGame).name}</strong> from this folder?</>
              )}
            </p>
            <ModalFooter
              onClose={closeModal}
              onConfirm={confirmDelete}
              confirmLabel={saving ? 'Deleting...' : 'Delete'}
              confirmDanger
              disabled={saving}
            />
          </ModalBox>
        </Overlay>
      )}

    </div>
  )
}

// ── Folder Card ───────────────────────────────────────────
function FolderCard({ folder, deleteMode, editMode, isDragOver, draggable, onDragStart, onDragOver, onDrop, onClick, onDelete, onEdit }: {
  folder: LibraryFolder; deleteMode: boolean; editMode: boolean; isDragOver: boolean; draggable: boolean
  onDragStart: () => void; onDragOver: (event: DragEvent<HTMLDivElement>) => void; onDrop: () => void
  onClick: () => void; onDelete: () => void; onEdit: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const preview = folder.games.slice(0, 4)

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: '8px', overflow: 'hidden',
        backgroundColor: isDragOver ? '#163421' : '#111a14',
        border: hovered && !deleteMode ? '1px solid #4ade80' : '1px solid #1e2e20',
        cursor: deleteMode ? 'default' : editMode ? 'grab' : 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered && !deleteMode ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && !deleteMode ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Preview grid of game images */}
      <div style={{ height: '110px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', backgroundColor: '#0d1610' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ backgroundColor: '#172011', overflow: 'hidden' }}>
            {preview[i]?.backgroundImage ? (
              <img src={preview[i].backgroundImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <span style={{ fontSize: '1.2rem' }}>🎮</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Folder info */}
      <div style={{ padding: '10px 12px' }}>
        <p style={{
          fontFamily: "'Exo 2', sans-serif", fontSize: '0.8rem', fontWeight: 700,
          color: '#e8f5e9', margin: '0 0 3px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{folder.folderName}</p>
        <p style={{ fontSize: '0.68rem', color: '#3d5c44', margin: 0 }}>
          {folder.games.length} {folder.games.length === 1 ? 'game' : 'games'}
        </p>
        {editMode && !deleteMode && (
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            style={{
              marginTop: '10px', padding: '6px 10px',
              fontFamily: "'Exo 2', sans-serif", fontSize: '0.65rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#0a0f0d', backgroundColor: '#f59e0b',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
            }}
          >Edit Folder</button>
        )}
      </div>

      {/* Delete X button */}
      {deleteMode && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: '#f87171', border: 'none',
            color: '#fff', fontSize: '0.9rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >×</button>
      )}
    </div>
  )
}

// ── Game Card ─────────────────────────────────────────────
function GameCard({ game, deleteMode, draggable, isDragOver, onDragStart, onDragOver, onDrop, onView, onDelete }: {
  game: LibraryGame; deleteMode: boolean
  draggable?: boolean; isDragOver?: boolean
  onDragStart?: () => void; onDragOver?: (event: DragEvent<HTMLDivElement>) => void; onDrop?: () => void
  onView: () => void; onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const statusColor = STATUS_COLORS[game.status] ?? '#7a9e82'
  const statusLabel = STATUS_LABELS[game.status] ?? game.status

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: '6px', overflow: 'hidden',
        backgroundColor: isDragOver ? '#163421' : '#111a14',
        border: hovered && !deleteMode ? '1px solid #4ade80' : '1px solid #1e2e20',
        cursor: deleteMode ? 'default' : draggable ? 'grab' : 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered && !deleteMode ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && !deleteMode ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div style={{ height: '105px', backgroundColor: '#0d1610', position: 'relative', overflow: 'hidden' }}>
        {game.backgroundImage ? (
          <img src={game.backgroundImage} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2.5rem', opacity: 0.2 }}>🎮</span>
          </div>
        )}

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: '6px', left: '6px',
          backgroundColor: `${statusColor}20`, border: `1px solid ${statusColor}`,
          borderRadius: '3px', padding: '2px 6px',
          fontFamily: "'Exo 2', sans-serif", fontSize: '0.52rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor,
        }}>{statusLabel}</div>

        {/* Hover overlay */}
        {hovered && !deleteMode && (
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(10,15,13,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <button onClick={onView} style={{
              width: '80%', padding: '7px 0',
              fontFamily: "'Exo 2', sans-serif", fontSize: '0.7rem',
              fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#0a0f0d', backgroundColor: '#4ade80',
              border: 'none', borderRadius: '3px', cursor: 'pointer',
            }}>View Game</button>
          </div>
        )}
      </div>

      <div style={{ padding: '8px 10px 10px' }}>
        <p style={{
          fontFamily: "'Exo 2', sans-serif", fontSize: '0.75rem', fontWeight: 700,
          color: '#c8deca', margin: '0 0 3px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{game.name}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {game.rating ? (
            <span style={{ fontSize: '0.65rem', color: '#facc15' }}>★ {game.rating}</span>
          ) : (
            <span style={{ fontSize: '0.65rem', color: '#3d5c44' }}>Unrated</span>
          )}
          <span style={{ fontSize: '0.6rem', color: '#3d5c44' }}>
            {new Date(game.addedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Delete X */}
      {deleteMode && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: '#f87171', border: 'none',
            color: '#fff', fontSize: '0.9rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >×</button>
      )}
    </div>
  )
}

// ── Shared UI components ──────────────────────────────────
function EmptyState({ icon, message, subtext }: { icon: string; message: string; subtext?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
      <span style={{ fontSize: '3rem' }}>{icon}</span>
      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3d5c44', margin: 0, textAlign: 'center' }}>{message}</p>
      {subtext && <p style={{ fontSize: '0.75rem', color: '#2a4030', margin: 0, textAlign: 'center', maxWidth: '260px', lineHeight: 1.5 }}>{subtext}</p>}
    </div>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function ModalBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#0d1610', border: '1px solid #2a4030', borderRadius: '10px', padding: '28px', width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px', background: 'linear-gradient(90deg, transparent, #4ade80, transparent)' }} />
      <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e8f5e9', margin: '0 0 20px 0' }}>{title}</h3>
      {children}
    </div>
  )
}

function ModalFooter({ onClose, onConfirm, confirmLabel = 'Save', confirmDanger, disabled, hideConfirm }: {
  onClose: () => void; onConfirm?: () => void; confirmLabel?: string
  confirmDanger?: boolean; disabled?: boolean; hideConfirm?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
      <button onClick={onClose} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7a9e82', backgroundColor: 'transparent', border: '1px solid #2a4030', borderRadius: '4px', padding: '8px 18px', cursor: 'pointer' }}>
        {hideConfirm ? 'Close' : 'Cancel'}
      </button>
      {!hideConfirm && onConfirm && (
        <button onClick={onConfirm} disabled={disabled} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0f0d', backgroundColor: confirmDanger ? '#f87171' : '#4ade80', border: 'none', borderRadius: '4px', padding: '8px 18px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
          {confirmLabel}
        </button>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a9e82' }}>{label}</label>
      {children}
    </div>
  )
}

function ErrMsg({ msg }: { msg: string }) {
  return <p style={{ fontSize: '0.75rem', color: '#f87171', margin: '4px 0 0' }}>{msg}</p>
}

// ── Style helpers ─────────────────────────────────────────
function topBtn(bg: string, color: string, outlined?: boolean, borderColor?: string) {
  return {
    fontFamily: "'Exo 2', sans-serif", fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color, backgroundColor: bg,
    border: outlined ? `1px solid ${borderColor || '#2a4030'}` : 'none',
    borderRadius: '4px', padding: '0 14px', height: '28px',
    cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' as const,
  }
}

const choiceBtn: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: '10px', padding: '20px 16px',
  backgroundColor: '#111a14', border: '1px solid #2a4030',
  borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease',
}

const inputSt: React.CSSProperties = {
  width: '100%', backgroundColor: '#111a14', border: '1px solid #2a4030',
  borderRadius: '6px', color: '#e8f5e9', fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.875rem', padding: '10px 12px', outline: 'none',
  boxSizing: 'border-box',
}