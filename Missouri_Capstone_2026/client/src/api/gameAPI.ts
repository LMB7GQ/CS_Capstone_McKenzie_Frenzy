const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Types ─────────────────────────────────────────────────
export interface Game {
  _id: string
  rawgId: number
  name: string
  slug?: string
  description?: string
  released?: string
  backgroundImage?: string
  backgroundImageAdditional?: string
  rating?: number
  ratingTop?: number
  ratingsCount?: number
  metacritic?: number
  ratingsBreakdown?: { id: number; title: string; count: number; percent: number }[]
  playtime?: number
  website?: string
  esrbRating?: string
  developer?: string
  publisher?: string
  achievementsCount?: number
  screenshots?: { id: number; image: string }[]
  videos?: {
    id: number
    name: string
    preview: string
    data: { 480?: string; max?: string }
  }[]
  stores?: { id?: number; name?: string; slug?: string; url?: string }[]
  series?: {
    rawgId: number
    name: string
    slug?: string
    backgroundImage?: string
    rating?: number
    released?: string
  }[]
  genres?: { id: number; name: string; slug: string }[]
  tags?: { id: number; name: string; slug: string }[]
  platforms?: { name: string; slug: string }[]
  categories?: string[]
  extendedDataFetched?: boolean
  lastFetched?: string
}

export interface HomePageData {
  topRated: Game[]
  byCategory: Record<string, Game[]>
}

// ── API calls ─────────────────────────────────────────────

export async function getHomePageData(): Promise<HomePageData> {
  const res = await fetch(`${BASE_URL}/games/home`)
  if (!res.ok) throw new Error('Failed to fetch home page data')
  const json = await res.json()
  return json.data
}

export async function getGameById(id: string): Promise<Game> {
  const res = await fetch(`${BASE_URL}/games/${id}`)
  if (!res.ok) throw new Error('Failed to fetch game')
  const json = await res.json()
  return json.data
}

export async function getGamesByCategory(category: string): Promise<Game[]> {
  const res = await fetch(`${BASE_URL}/games?category=${category}&limit=20`)
  if (!res.ok) throw new Error('Failed to fetch category games')
  const json = await res.json()
  return json.data
}

export async function searchGames(query: string): Promise<Game[]> {
  const res = await fetch(`${BASE_URL}/games?search=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Failed to search games')
  const json = await res.json()
  return json.data
}