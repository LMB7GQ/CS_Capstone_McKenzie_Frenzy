// src/routes/games.js
// -----------------------------------------------------------
// Game routes with Redis caching integrated.
// Pattern: Check cache → Hit: return instantly
//                      → Miss: query MongoDB → store in cache → return
// -----------------------------------------------------------

import express from "express";
import Game from "../models/Game.js";
import {
  getCache,
  setCache,
  CacheKeys,
  TTL,
} from "../utils/cacheHelpers.js";

const router = express.Router();

// -----------------------------------------------------------
// GET /api/games/home
// GLOBAL CACHE — first user hits MongoDB, everyone else gets cache
// -----------------------------------------------------------
router.get("/home", async (req, res) => {
  try {
    const cacheKey = CacheKeys.homePage();

    // 1. Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, source: "cache", data: cached });
    }

    // 2. Cache miss — query MongoDB
    const [topRated, byCategory] = await Promise.all([
      Game.find()
        .sort("-rating")
        .limit(10)
        .select("name slug backgroundImage rating categories metacritic released"),

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
              },
            },
          },
        },
        { $project: { games: { $slice: ["$games", 5] } } },
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

    // 3. Store in cache for all subsequent users
    await setCache(cacheKey, data, TTL.HOME_PAGE);

    res.json({ success: true, source: "database", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games/categories
// GLOBAL CACHE
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
// GET /api/games?category=ACTION
// GLOBAL CACHE per category
// -----------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      sort = "-rating",
      page = 1,
      limit = 20,
    } = req.query;

    // Only cache simple category requests (no search, page 1)
    const isCacheable = category && !search && parseInt(page) === 1;
    const cacheKey = isCacheable ? CacheKeys.gamesByCategory(category) : null;

    if (cacheKey) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({ success: true, source: "cache", ...cached });
      }
    }

    const query = {};
    if (category) query.categories = category.toUpperCase();
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [games, total] = await Promise.all([
      Game.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-description -tags -screenshots"),
      Game.countDocuments(query),
    ]);

    const result = {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: games,
    };

    if (cacheKey) await setCache(cacheKey, result, TTL.CATEGORY);

    res.json({ success: true, source: "database", ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games/:id
// GLOBAL CACHE per game — individual game pages
// -----------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = CacheKeys.singleGame(id);

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, source: "cache", data: cached });
    }

    const query = isNaN(id) ? { _id: id } : { rawgId: parseInt(id) };
    const game = await Game.findOne(query);

    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    await setCache(cacheKey, game, TTL.SINGLE_GAME);

    res.json({ success: true, source: "database", data: game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
