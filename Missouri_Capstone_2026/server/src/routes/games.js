import express from "express";
import Game from "../models/Game.js";
import {
  getCache,
  setCache,
  CacheKeys,
  TTL,
} from "../utils/cacheHelpers.js";

const router = express.Router();

const RAWG_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE = "https://api.rawg.io/api";

// ── RAWG fetch helpers ────────────────────────────────────
async function fetchFromRAWG(rawgId) {
  const [details, screenshots, videos, stores, series] = await Promise.all([
    fetch(`${RAWG_BASE}/games/${rawgId}?key=${RAWG_KEY}`).then(r => r.json()),
    fetch(`${RAWG_BASE}/games/${rawgId}/screenshots?key=${RAWG_KEY}&page_size=20`).then(r => r.json()),
    fetch(`${RAWG_BASE}/games/${rawgId}/movies?key=${RAWG_KEY}`).then(r => r.json()),
    fetch(`${RAWG_BASE}/games/${rawgId}/stores?key=${RAWG_KEY}`).then(r => r.json()),
    fetch(`${RAWG_BASE}/games/${rawgId}/game-series?key=${RAWG_KEY}&page_size=10`).then(r => r.json()),
  ]);

  return {
    rawgId: details.id,
    name: details.name,
    slug: details.slug,
    description: details.description_raw,
    released: details.released,
    backgroundImage: details.background_image,
    backgroundImageAdditional: details.background_image_additional,
    rating: details.rating,
    ratingTop: details.rating_top,
    ratingsCount: details.ratings_count,
    metacritic: details.metacritic,
    ratingsBreakdown: (details.ratings || []).map(r => ({
      id: r.id, title: r.title, count: r.count, percent: r.percent,
    })),
    playtime: details.playtime,
    website: details.website,
    esrbRating: details.esrb_rating?.name,
    developer: details.developers?.[0]?.name,
    publisher: details.publishers?.[0]?.name,
    achievementsCount: details.achievements_count || 0,
    screenshots: (screenshots.results || []).map(s => ({ id: s.id, image: s.image })),
    videos: (videos.results || []).map(v => ({
      id: v.id, name: v.name, preview: v.preview,
      data: { 480: v.data?.[480], max: v.data?.max },
    })),
    stores: (stores.results || []).map(s => ({
      id: s.store?.id, name: s.store?.name, slug: s.store?.slug, url: s.url,
    })),
    series: (series.results || []).map(g => ({
      rawgId: g.id, name: g.name, slug: g.slug,
      backgroundImage: g.background_image, rating: g.rating, released: g.released,
    })),
    genres: (details.genres || []).map(({ id, name, slug }) => ({ id, name, slug })),
    tags: (details.tags || []).slice(0, 20).map(({ id, name, slug }) => ({ id, name, slug })),
    platforms: (details.platforms || []).map(({ platform }) => ({
      name: platform.name, slug: platform.slug,
    })),
    lastFetched: new Date(),
    extendedDataFetched: true,
  };
}

// -----------------------------------------------------------
// GET /api/games/home
// -----------------------------------------------------------
router.get("/home", async (req, res) => {
  try {
    const cacheKey = CacheKeys.homePage();

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, source: "cache", data: cached });
    }

    const [topRated, byCategory] = await Promise.all([
      Game.find()
        .sort("-rating")
        .limit(10)
        .select("name slug backgroundImage rating categories metacritic released screenshots developer publisher playtime"),
      Game.aggregate([
        { $unwind: "$categories" },
        { $sort: { rating: -1 } },
        {
          $group: {
            _id: "$categories",
            games: {
              $push: {
                _id: "$_id",
                name: "$name",
                slug: "$slug",
                backgroundImage: "$backgroundImage",
                rating: "$rating",
                metacritic: "$metacritic",
                released: "$released",
                screenshots: "$screenshots",
                categories: "$categories",
                developer: "$developer",
                playtime: "$playtime",
              },
            },
          },
        },
        { $project: { games: { $slice: ["$games", 6] } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const data = {
      topRated,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.games;
        return acc;
      }, {}),
    };

    await setCache(cacheKey, data, TTL.HOME_PAGE);
    res.json({ success: true, source: "database", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games/categories
// -----------------------------------------------------------
router.get("/categories", async (req, res) => {
  try {
    const cacheKey = CacheKeys.allCategories();

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, source: "cache", data: cached });
    }

    const categories = await Game.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const data = categories.map((c) => ({ category: c._id, count: c.count }));
    await setCache(cacheKey, data, TTL.CATEGORY);
    res.json({ success: true, source: "database", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games
// -----------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const { category, search, sort = "-rating", page = 1, limit = 20 } = req.query;

    const isCacheable = category && !search && parseInt(page) === 1;
    const cacheKey = isCacheable ? CacheKeys.gamesByCategory(category) : null;

    if (cacheKey) {
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ success: true, source: "cache", ...cached });
    }

    const query = {};
    if (category) query.categories = category.toUpperCase();
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [games, total] = await Promise.all([
      Game.find(query).sort(sort).skip(skip).limit(parseInt(limit)).select("-description -tags"),
      Game.countDocuments(query),
    ]);

    const result = { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), data: games };
    if (cacheKey) await setCache(cacheKey, result, TTL.CATEGORY);
    res.json({ success: true, source: "database", ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games/:id
// 1. Check Redis cache
// 2. Check MongoDB
// 3. If not in MongoDB → fetch from RAWG → save to MongoDB → cache
// 4. If in MongoDB but missing extended data → lazy update from RAWG
// -----------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = CacheKeys.singleGame(id);

    // 1. Check cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, source: "cache", data: cached });
    }

    // 2. Check MongoDB
    const query = isNaN(id) ? { _id: id } : { rawgId: parseInt(id) };
    let game = await Game.findOne(query);

    // 3. Not in MongoDB at all — fetch full game from RAWG and store it
    if (!game) {
      if (isNaN(id)) {
        return res.status(404).json({ success: false, message: "Game not found" });
      }

      console.log(`🌐 Game ${id} not in DB — fetching from RAWG...`);
      try {
        const gameData = await fetchFromRAWG(parseInt(id));
        game = await Game.findOneAndUpdate(
          { rawgId: gameData.rawgId },
          { $set: gameData },
          { upsert: true, new: true }
        );
        console.log(`✅ Fetched and stored: "${game.name}" from RAWG`);
      } catch (rawgErr) {
        console.error(`❌ RAWG fetch failed: ${rawgErr.message}`);
        return res.status(404).json({ success: false, message: "Game not found" });
      }
    }

    // 4. In MongoDB but missing extended data — lazy update
    else if (!game.extendedDataFetched) {
      console.log(`🔄 Lazy updating: "${game.name}"...`);
      try {
        const gameData = await fetchFromRAWG(game.rawgId);
        // Keep existing categories when updating
        const { categories: _, ...updateData } = gameData;
        game = await Game.findOneAndUpdate(
          { rawgId: game.rawgId },
          { $set: updateData },
          { new: true }
        );
        console.log(`✅ Lazy updated: "${game.name}"`);
      } catch (rawgErr) {
        console.warn(`⚠️  Lazy update failed for "${game.name}": ${rawgErr.message}`);
        // Return existing data even if update fails
      }
    }

    // 5. Cache and return
    await setCache(cacheKey, game, TTL.SINGLE_GAME);
    res.json({ success: true, source: "database", data: game });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;