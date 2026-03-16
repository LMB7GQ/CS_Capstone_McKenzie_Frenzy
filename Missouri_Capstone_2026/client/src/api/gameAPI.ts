const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Types
export interface Game {
  _id: string;
  rawgId: number;
  name: string;
  slug: string;
  description?: string;
  released?: string;
  backgroundImage?: string;
  rating?: number;
  ratingTop?: number;
  ratingsCount?: number;
  metacritic?: number;
  playtime?: number;
  website?: string;
  genres?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
  platforms?: { name: string; slug: string }[];
  screenshots?: { id: number; image: string }[];
  categories?: string[];
  esrbRating?: string;
  developer?: string;
  publisher?: string;
}

export interface HomePageData {
  topRated: Game[];
  byCategory: Record<string, Game[]>;
}

// Fetch home page data (cached in Redis on backend)
export async function getHomePageData(): Promise<HomePageData> {
  const res = await fetch(`${BASE_URL}/games/home`);
  if (!res.ok) throw new Error("Failed to fetch home page data");
  const json = await res.json();
  return json.data;
}

// Fetch a single game by its MongoDB _id or rawgId
export async function getGameById(id: string): Promise<Game> {
  const res = await fetch(`${BASE_URL}/games/${id}`);
  if (!res.ok) throw new Error("Failed to fetch game");
  const json = await res.json();
  return json.data;
}

// Fetch games by category
export async function getGamesByCategory(category: string): Promise<Game[]> {
  const res = await fetch(`${BASE_URL}/games?category=${category}&limit=20`);
  if (!res.ok) throw new Error("Failed to fetch category games");
  const json = await res.json();
  return json.data;
}

// Search games by name
export async function searchGames(query: string): Promise<Game[]> {
  const res = await fetch(
    `${BASE_URL}/games?search=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Failed to search games");
  const json = await res.json();
  return json.data;
}


