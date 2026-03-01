/**
 * seedGames.js
 * -----------------------------------------------------------
 * Fetches games from the RAWG API and upserts them into MongoDB.
 *
 * Usage:
 *   node scripts/seedGames.js
 *
 * Requires in .env:
 *   MONGO_URI=your_atlas_connection_string
 *   RAWG_API_KEY=your_rawg_api_key
 * -----------------------------------------------------------
 */

import "dotenv/config";
import axios from "axios";
import connectDB from "../config/db.js";
import Game from "../models/Game.js";

const RAWG_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE = "https://api.rawg.io/api";

// -----------------------------------------------------------
// MASTER GAME LIST
// Keys are the category names shown on your home page.
// Values are search terms — kept close to what RAWG understands.
// Duplicates across categories are intentional; we merge them.
// -----------------------------------------------------------
const GAME_LIST = {
  ACTION: [
    "Grand Theft Auto V",
    "The Witcher 3: Wild Hunt",
    "Tomb Raider 2013",
    "Red Dead Redemption 2",
    "Half-Life 2",
    "God of War 2018",
    "Team Fortress 2",
    "Metal Gear Solid V: The Phantom Pain",
    "Dark Souls III",
    "Elden Ring",
    "Batman: Arkham City", // representative of the series
  ],
  INDIE: [
    "Outer Wilds",
    "Hollow Knight",
    "Celeste",
    "Shovel Knight",
    "Cuphead",
    "Undertale",
  ],
  STRATEGY: ["StarCraft II", "Sid Meier's Civilization VI", "League of Legends"],
  RPG: [
    "Pokemon FireRed",
    "Fallout: New Vegas",
    "Final Fantasy VII",
    "Chrono Trigger",
    "Persona 5 Royal",
    "Kingdom Hearts",
    "Dragon Quest XI",
    "Baldur's Gate 3",
    "Elden Ring",
    "Dark Souls",
  ],
  SHOOTER: [
    "Counter-Strike: Global Offensive",
    "Valorant",
    "Overwatch 2",
    "Marvel Rivals",
    "Tom Clancy's Rainbow Six Siege",
    "Helldivers 2",
    "ARC Raiders",
    "Fortnite",
    "DOOM Eternal",
    "BioShock",
    "Left 4 Dead 2",
    "Half-Life",
    "Half-Life 2",
    "Team Fortress 2",
    "Fallout: New Vegas",
    "Borderlands 2",
    "Call of Duty: Modern Warfare",
    "Halo: The Master Chief Collection",
    "Battlefield V",
    "Far Cry 5",
  ],
  ADVENTURE: [
    "God of War 2018",
    "Elden Ring",
    "Life is Strange",
    "The Legend of Zelda: Breath of the Wild",
    "Uncharted 4: A Thief's End",
    "Tomb Raider 2013",
    "The Elder Scrolls V: Skyrim",
    "Horizon Zero Dawn",
    "Dark Souls",
    "Ghost of Tsushima",
  ],
  PUZZLE: ["Tetris Effect"],
  RACING: [
    "Mario Kart 8 Deluxe",
    "Gran Turismo 7",
    "Forza Horizon 5",
    "Trackmania",
    "F1 23",
  ],
  SIMULATION: [
    "Garry's Mod",
    "Totally Accurate Battle Simulator",
    "The Sims 4",
    "RollerCoaster Tycoon 3",
    "Microsoft Flight Simulator",
    "Farming Simulator 22",
  ],
  ARCADE: [
    "Pac-Man",
    "Galaga",
    "Space Invaders",
    "Donkey Kong",
  ],
  PLATFORMER_2D: [
    "Super Mario Bros.",
    "Sonic the Hedgehog",
    "Castlevania: Symphony of the Night",
    "Celeste",
    "Shovel Knight",
    "Mega Man 11",
    "Donkey Kong Country",
    "Kirby's Return to Dream Land",
    "Limbo",
  ],
  PLATFORMER_3D: [
    "Super Mario 64",
    "Super Mario Odyssey",
    "Crash Bandicoot N. Sane Trilogy",
    "Kirby and the Forgotten Land",
    "Astro Bot",
    "Ratchet & Clank: Rift Apart",
    "Spyro Reignited Trilogy",
  ],
  MMO: [
    "ARC Raiders",
    "Helldivers 2",
    "World of Warcraft",
    "Old School RuneScape",
    "Final Fantasy XIV",
    "Roblox",
  ],
  FIGHTING: [
    "Mortal Kombat 11",
    "Street Fighter 6",
    "Super Smash Bros. Ultimate",
    "Tekken 8",
    "Guilty Gear Strive",
    "Dragon Ball FighterZ",
    "Marvel vs. Capcom: Infinite",
    "Injustice 2",
  ],
  FAMILY: ["Mario Party Superstars", "Jackbox Party Pack"],
  CARD: [
    "Hearthstone",
    "Balatro",
    "Uno",
    "Yu-Gi-Oh! Master Duel",
    "Magic: The Gathering Arena",
    "Microsoft Solitaire Collection",
  ],
  ROGUELIKE: [
    "The Binding of Isaac: Rebirth",
    "Risk of Rain 2",
    "Balatro",
    "Hades",
    "Enter the Gungeon",
  ],
  SPORTS: [
    "NBA 2K24",
    "Madden NFL 24",
    "NHL 24",
    "EA FC 24",
    "MLB The Show 24",
    "UFC 5",
    "Wii Sports",
  ],
  HORROR: [
    "Outlast",
    "Silent Hill 2",
    "Dead Space",
    "The Last of Us",
    "Silent Hill 3",
    "Resident Evil 4 Remake",
    "Resident Evil 2 Remake",
  ],
};

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/** Sleep to respect RAWG's rate limit (free tier ~20 req/s) */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Search RAWG for a game by name and return the best match.
 * Falls back to the first result if exact match not found.
 */
async function searchRAWG(gameName) {
  const url = `${RAWG_BASE}/games`;
  const response = await axios.get(url, {
    params: {
      key: RAWG_KEY,
      search: gameName,
      page_size: 5,
      search_precise: true,
    },
  });

  const results = response.data.results;
  if (!results || results.length === 0) return null;

  // Try to find an exact (case-insensitive) name match first
  const exact = results.find(
    (g) => g.name.toLowerCase() === gameName.toLowerCase()
  );
  return exact || results[0];
}

/**
 * Fetch full game details (includes description, website, developer, etc.)
 */
async function getGameDetails(rawgId) {
  const url = `${RAWG_BASE}/games/${rawgId}`;
  const response = await axios.get(url, { params: { key: RAWG_KEY } });
  return response.data;
}

/**
 * Fetch up to 3 screenshots for a game
 */
async function getScreenshots(rawgId) {
  const url = `${RAWG_BASE}/games/${rawgId}/screenshots`;
  const response = await axios.get(url, {
    params: { key: RAWG_KEY, page_size: 3 },
  });
  return response.data.results || [];
}

/**
 * Build a clean document from RAWG data
 */
function buildGameDoc(details, screenshots, categories) {
  const developer =
    details.developers && details.developers.length > 0
      ? details.developers[0].name
      : undefined;

  const publisher =
    details.publishers && details.publishers.length > 0
      ? details.publishers[0].name
      : undefined;

  return {
    rawgId: details.id,
    name: details.name,
    slug: details.slug,
    description: details.description_raw,
    released: details.released,
    backgroundImage: details.background_image,
    rating: details.rating,
    ratingTop: details.rating_top,
    ratingsCount: details.ratings_count,
    metacritic: details.metacritic,
    playtime: details.playtime,
    website: details.website,
    esrbRating: details.esrb_rating ? details.esrb_rating.name : undefined,
    developer,
    publisher,
    genres: (details.genres || []).map(({ id, name, slug }) => ({
      id,
      name,
      slug,
    })),
    tags: (details.tags || [])
      .slice(0, 20)
      .map(({ id, name, slug }) => ({ id, name, slug })), // cap tags at 20
    platforms: (details.platforms || []).map(({ platform }) => ({
      name: platform.name,
      slug: platform.slug,
    })),
    screenshots: screenshots.map(({ id, image }) => ({ id, image })),
    categories,
    lastFetched: new Date(),
  };
}

// -----------------------------------------------------------
// Main seed function
// -----------------------------------------------------------
async function seed() {
  await connectDB();

  // Build a map: normalizedName -> Set of categories
  // This handles duplicates (e.g. Elden Ring in ACTION, RPG, ADVENTURE)
  const gameMap = new Map(); // key: lowercase name, value: { displayName, categories }

  for (const [category, games] of Object.entries(GAME_LIST)) {
    for (const gameName of games) {
      const key = gameName.toLowerCase();
      if (!gameMap.has(key)) {
        gameMap.set(key, { displayName: gameName, categories: new Set() });
      }
      gameMap.get(key).categories.add(category);
    }
  }

  console.log(`\n🎮 Total unique games to seed: ${gameMap.size}\n`);

  let seeded = 0;
  let failed = 0;

  for (const [, { displayName, categories }] of gameMap) {
    try {
      console.log(`🔍 Searching: "${displayName}"...`);

      // 1. Search for the game
      const searchResult = await searchRAWG(displayName);
      await sleep(300); // be polite to the API

      if (!searchResult) {
        console.warn(`  ⚠️  Not found: "${displayName}"`);
        failed++;
        continue;
      }

      // 2. Get full details
      const details = await getGameDetails(searchResult.id);
      await sleep(300);

      // 3. Get screenshots
      const screenshots = await getScreenshots(searchResult.id);
      await sleep(300);

      // 4. Build the document
      const gameDoc = buildGameDoc(details, screenshots, [...categories]);

      // 5. Upsert — update if exists, insert if not
      const { categories: gameCategories, ...gameData } = gameDoc;

    await Game.findOneAndUpdate(
      { rawgId: gameDoc.rawgId },
        {
          $set: gameData,
          $addToSet: { categories: { $each: gameCategories } },
        },
      { upsert: true, returnDocument: "after" }
    );

      console.log(
        `  ✅ Saved: "${details.name}" [${[...categories].join(", ")}]`
      );
      seeded++;
    } catch (err) {
      console.error(`  ❌ Error for "${displayName}": ${err.message}`);
      failed++;
    }
  }

  console.log(`\n🏁 Seed complete! Saved: ${seeded} | Failed: ${failed}`);
  process.exit(0);
}

seed();
