/**
 * seedGames.js
 * -----------------------------------------------------------
 * Fetches games from RAWG and upserts them into MongoDB.
 * Now fetches: videos, up to 20 screenshots, stores, series
 *
 * Usage:
 *   node src/scripts/seedGames.js
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
    "Batman: Arkham City",
  ],
  INDIE: [
    "Outer Wilds",
    "Hollow Knight",
    "Celeste",
    "Shovel Knight",
    "Cuphead",
    "Undertale",
    "Disco Elysium",
    "Slay the Spire",
    "Stardew Valley",
    "Hades",
    "Baba Is You",
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
  PUZZLE: ["Tetris Effect", "Portal 2", "The Witness", "Baba Is You", "Limbo", "Inside"],
  RACING: [
    "Mario Kart 8 Deluxe",
    "Gran Turismo 7",
    "Forza Horizon 5",
    "Trackmania",
    "F1 23",
    "Dirt 5",
    "Need for Speed Heat",
  ],
  SIMULATION: [
    "Garry's Mod",
    "Totally Accurate Battle Simulator",
    "The Sims 4",
    "RollerCoaster Tycoon 3",
    "Microsoft Flight Simulator",
    "Farming Simulator 22",
    "Cities: Skylines",
  ],
  ARCADE: [
    "Pac-Man",
    "Galaga",
    "Space Invaders",
    "Donkey Kong",
    "Asteroids",
    "Frogger",
    "Street Fighter II",
    "Mortal Kombat",
    "NBA Jam",
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
    "Helldivers 2",
    "World of Warcraft",
    "Old School RuneScape",
    "Final Fantasy XIV",
    "Roblox",
    "Guild Wars 2",
    "EVE Online",
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
  FAMILY: [
    "Mario Party Superstars",
    "Jackbox Party Pack",
    "Minecraft",
    "Animal Crossing: New Horizons",
    "Luigi's Mansion 3",
    "Overcooked! 2",
  ],
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
    "Dead Cells",
    "Spelunky 2",
    "Slay the Spire 2",
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchRAWG(gameName) {
  const res = await axios.get(`${RAWG_BASE}/games`, {
    params: { key: RAWG_KEY, search: gameName, page_size: 5, search_precise: true },
  });
  const results = res.data.results || [];
  if (!results.length) return null;
  const exact = results.find(g => g.name.toLowerCase() === gameName.toLowerCase());
  return exact || results[0];
}

async function getGameDetails(rawgId) {
  const res = await axios.get(`${RAWG_BASE}/games/${rawgId}`, {
    params: { key: RAWG_KEY },
  });
  return res.data;
}

async function getScreenshots(rawgId) {
  const res = await axios.get(`${RAWG_BASE}/games/${rawgId}/screenshots`, {
    params: { key: RAWG_KEY, page_size: 20 }, // increased to 20
  });
  return res.data.results || [];
}

async function getVideos(rawgId) {
  try {
    const res = await axios.get(`${RAWG_BASE}/games/${rawgId}/movies`, {
      params: { key: RAWG_KEY },
    });
    return res.data.results || [];
  } catch {
    return []; // not all games have trailers
  }
}

async function getStores(rawgId) {
  try {
    const res = await axios.get(`${RAWG_BASE}/games/${rawgId}/stores`, {
      params: { key: RAWG_KEY },
    });
    return res.data.results || [];
  } catch {
    return [];
  }
}

async function getSeries(rawgId) {
  try {
    const res = await axios.get(`${RAWG_BASE}/games/${rawgId}/game-series`, {
      params: { key: RAWG_KEY, page_size: 10 },
    });
    return res.data.results || [];
  } catch {
    return [];
  }
}

function buildGameDoc(details, screenshots, videos, stores, series, categories) {
  return {
    rawgId: details.id,
    name: details.name,
    slug: details.slug,
    description: details.description_raw,
    released: details.released,
    backgroundImage: details.background_image,
    backgroundImageAdditional: details.background_image_additional,

    // Ratings
    rating: details.rating,
    ratingTop: details.rating_top,
    ratingsCount: details.ratings_count,
    metacritic: details.metacritic,
    ratingsBreakdown: (details.ratings || []).map(r => ({
      id: r.id,
      title: r.title,
      count: r.count,
      percent: r.percent,
    })),

    // Info
    playtime: details.playtime,
    website: details.website,
    esrbRating: details.esrb_rating?.name,
    developer: details.developers?.[0]?.name,
    publisher: details.publishers?.[0]?.name,
    achievementsCount: details.achievements_count || 0,

    // Media
    screenshots: screenshots.map(s => ({ id: s.id, image: s.image })),
    videos: videos.map(v => ({
      id: v.id,
      name: v.name,
      preview: v.preview,
      data: {
        480: v.data?.[480],
        max: v.data?.max,
      },
    })),

    // Stores
    stores: stores.map(s => ({
      id: s.store?.id,
      name: s.store?.name,
      slug: s.store?.slug,
      url: s.url,
    })),

    // Series
    series: series.map(g => ({
      rawgId: g.id,
      name: g.name,
      slug: g.slug,
      backgroundImage: g.background_image,
      rating: g.rating,
      released: g.released,
    })),

    // Genres, tags, platforms
    genres: (details.genres || []).map(({ id, name, slug }) => ({ id, name, slug })),
    tags: (details.tags || []).slice(0, 20).map(({ id, name, slug }) => ({ id, name, slug })),
    platforms: (details.platforms || []).map(({ platform }) => ({
      name: platform.name,
      slug: platform.slug,
    })),

    categories,
    lastFetched: new Date(),
    extendedDataFetched: true,
  };
}

// -----------------------------------------------------------
// Main seed function
// -----------------------------------------------------------
async function seed() {
  await connectDB();

  // Build deduplicated game map
  const gameMap = new Map();
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

      const searchResult = await searchRAWG(displayName);
      await sleep(300);
      if (!searchResult) {
        console.warn(`  ⚠️  Not found: "${displayName}"`);
        failed++;
        continue;
      }

      const [details, screenshots, videos, stores, series] = await Promise.all([
        getGameDetails(searchResult.id).then(r => (sleep(300), r)),
        getScreenshots(searchResult.id).then(r => (sleep(300), r)),
        getVideos(searchResult.id).then(r => (sleep(300), r)),
        getStores(searchResult.id).then(r => (sleep(300), r)),
        getSeries(searchResult.id).then(r => (sleep(300), r)),
      ]);

      const gameDoc = buildGameDoc(details, screenshots, videos, stores, series, [...categories]);

      await Game.findOneAndUpdate(
        { rawgId: gameDoc.rawgId },
        {
          $set: gameDoc,
          $addToSet: { categories: { $each: [...categories] } },
        },
        { upsert: true, returnDocument: "after" }
      );

      console.log(`  ✅ Saved: "${details.name}" [${[...categories].join(", ")}]`);
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