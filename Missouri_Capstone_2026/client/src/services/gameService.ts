import { apiGet } from '../api/client'
import { API_ENDPOINTS } from '../api/config'
import { getCacheFromCookie, setCacheInCookie } from './cookieCache'

// Game type matching RAWG API's actual response structure
export type Game = {
  id: number
  name: string
  description_raw?: string
  background_image?: string
  rating: number
  released?: string
  genres?: Array<{ id: number; name: string }>
  platforms?: Array<{
    platform: { id: number; name: string }
  }>
  metacritic?: number
  playtime?: number
}

// Fetch all games (returns a single game for testing from /api/games)
// Uses cookie cache: if cached, returns immediately; if not, fetches from API and caches
export async function fetchGames(): Promise<Game> {
  const cacheKey = 'featured'

  // Step 1: Check if featured game is in cookie cache
  const cachedGame = getCacheFromCookie<Game>(cacheKey)
  if (cachedGame) {
    console.log('✓ Featured game returned from cookie cache')
    return cachedGame
  }

  // Step 2: Not in cache, fetch from backend API
  console.log('⇢ Featured game not in cache, fetching from API...')
  const res = await apiGet<{ success: boolean; data: Game; message?: string }>(
    API_ENDPOINTS.games.getAll
  )

  if (!res || !res.success) {
    throw new Error(res?.message || 'Failed to fetch games')
  }

  // Step 3: Save to cookie cache for next time
  setCacheInCookie(cacheKey, res.data, 7) // Cache for 7 days

  return res.data
}

// Fetch single game by id
// Uses cookie cache: if cached, returns immediately; if not, fetches from API and caches
export async function fetchGameById(id: number | string): Promise<Game | null> {
  const gameId = Number(id)
  const cacheKey = `game_${gameId}`

  // Step 1: Check if game is in cookie cache
  const cachedGame = getCacheFromCookie<Game>(cacheKey)
  if (cachedGame) {
    console.log(`✓ Game ${gameId} returned from cookie cache`)
    return cachedGame
  }

  // Step 2: Not in cache, fetch from backend API
  console.log(`⇢ Game ${gameId} not in cache, fetching from API...`)
  const res = await apiGet<{ success: boolean; data: Game; message?: string }>(
    API_ENDPOINTS.games.getById(gameId)
  )

  if (!res || !res.success) {
    return null
  }

  // Step 3: Save to cookie cache for next time
  setCacheInCookie(cacheKey, res.data, 7) // Cache for 7 days

  return res.data
}
