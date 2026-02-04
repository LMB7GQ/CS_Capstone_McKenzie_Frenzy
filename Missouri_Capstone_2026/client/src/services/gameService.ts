import { apiGet } from '../api/client'
import { API_ENDPOINTS } from '../api/config'

export type Game = {
	id: number
	title: string
	description: string
	genre: string
	platform: string
	rating: number
	releaseDate: string
	imageUrl: string
}

// Fetch all games (returns the "data" array from the backend response)
export async function fetchGames(): Promise<Game[]> {
	const res = await apiGet<{ success: boolean; data: Game[]; message?: string }>(
		API_ENDPOINTS.games.getAll
	)

	if (!res || !res.success) {
		throw new Error(res?.message || 'Failed to fetch games')
	}

	return res.data
}

// Fetch single game by id (optional helper)
export async function fetchGameById(id: number): Promise<Game | null> {
	const res = await apiGet<{ success: boolean; data: Game; message?: string }>(
		API_ENDPOINTS.games.getById(id)
	)

	if (!res || !res.success) {
		return null
	}

	return res.data
}
