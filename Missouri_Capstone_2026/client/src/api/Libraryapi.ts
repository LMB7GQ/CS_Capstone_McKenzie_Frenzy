const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Types matching your backend response ──────────────────
export interface LibraryGame {
  folderGameId: string
  rawgId: number
  name: string
  status: string
  rating: number | null
  addedDate: string
  // We'll enrich this on the frontend from our games API
  backgroundImage?: string
}

export interface LibraryFolder {
  folderId: string
  userId: number
  folderName: string
  createdDate: string
  games: LibraryGame[]
}

// ── API calls ─────────────────────────────────────────────

// GET /api/libraries/me — returns all folders + games for logged in user
export async function getMyLibrary(): Promise<LibraryFolder[]> {
  const res = await fetch(`${BASE_URL}/libraries/me`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch library')
  const json = await res.json()
  return json.library // ← was json.data ?? json
}
// POST /api/libraries/me/folders — create a new folder
export async function createFolder(name: string): Promise<LibraryFolder> {
  const res = await fetch(`${BASE_URL}/libraries/me/folders`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to create folder')
  const json = await res.json()
  return json.folder // ← was json.data ?? json
}

// POST /api/libraries/me/folders/:folderId/games — add game to folder
export async function addGameToFolder(
  folderId: string,
  game: { gameRawgId: number; gameName: string; status: string; rating?: number }
): Promise<LibraryGame> {
  const res = await fetch(`${BASE_URL}/libraries/me/folders/${folderId}/games`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.error || 'Failed to add game to folder')
  }
  const json = await res.json()
  return json.data ?? json
}

// POST /api/libraries/me/games — add game to root library
export async function addGameToRoot(
  game: { gameRawgId: number; gameName: string; status: string; rating?: number }
): Promise<LibraryGame> {
  const res = await fetch(`${BASE_URL}/libraries/me/games`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.error || 'Failed to add game to library')
  }
  const json = await res.json()
  return json.data ?? json
}

// DELETE /api/libraries/me/folders/:folderId — delete folder + all its games
export async function deleteFolder(folderId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/libraries/me/folders/${folderId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete folder')
}

// PATCH /api/libraries/me/games/:gameId/reorder — reorder root games
export async function reorderRootGames(gameIds: string[]): Promise<void> {
  const res = await fetch(`${BASE_URL}/libraries/me/games/reorder`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameIds }),
  })
  if (!res.ok) throw new Error('Failed to reorder games')
}

// Check if user is logged in
export async function checkAuth(): Promise<{ ok: boolean; user?: { appUserId: number; username: string; email: string } }> {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, { credentials: 'include' })
    return await res.json()
  } catch {
    return { ok: false }
  }
}