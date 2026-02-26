import { apiGet } from '../api/client'
import { API_ENDPOINTS } from '../api/config'

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
export async function fetchGames(): Promise<Game> {
  const res = await apiGet<{ success: boolean; data: Game; message?: string }>(
    API_ENDPOINTS.games.getAll
  )

  if (!res || !res.success) {
    throw new Error(res?.message || 'Failed to fetch games')
  }

  return res.data
}

// Fetch single game by id
export async function fetchGameById(id: number | string): Promise<Game | null> {
  const res = await apiGet<{ success: boolean; data: Game; message?: string }>(
    API_ENDPOINTS.games.getById(Number(id))
  )

  if (!res || !res.success) {
    return null
  }

  return res.data
}
