import axios from 'axios'

const RAWG_API_KEY = '57e1d5aba86c45618bc5502eb760e204'
const RAWG_BASE_URL = 'https://api.rawg.io/api'

/**
 * Fetch all games from RAWG API with basic info
 * @param {number} limit - How many games to fetch (default 20)
 * @param {number} page - Page number for pagination
 * @returns {Promise<Array>} Array of games from RAWG
 */
export async function fetchAllGamesFromRAWG(limit = 20, page = 1) {
  try {
    const response = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        page_size: limit,
        page: page,
        ordering: '-rating', // Order by highest rating
      },
    })

    return response.data.results // RAWG returns games in 'results' array
  } catch (error) {
    console.error('Error fetching games from RAWG:', error.message)
    throw new Error('Failed to fetch games from RAWG API')
  }
}

/**
 * Fetch a single game by ID from RAWG API
 * @param {number} gameId - The RAWG game ID
 * @returns {Promise<Object>} Game object with detailed info
 */
export async function fetchGameByIdFromRAWG(gameId) {
  try {
    const response = await axios.get(`${RAWG_BASE_URL}/games/${gameId}`, {
      params: {
        key: RAWG_API_KEY,
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error fetching game ${gameId} from RAWG:`, error.message)
    throw new Error(`Failed to fetch game details from RAWG API`)
  }
}