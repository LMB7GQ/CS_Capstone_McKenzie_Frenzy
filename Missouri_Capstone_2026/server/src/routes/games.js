/**
 * routes/games.js
 * -----------------------------------------------------------
 * All game-related API endpoints for the frontend.
 *
 * Mount in your server.js with:
 *   app.use('/api/games', require('./routes/games'));
 * -----------------------------------------------------------
 */

import express from "express";
import Game from "../models/Game.js";

const router = express.Router();

// -----------------------------------------------------------
// GET /api/games
// Returns all games with optional filtering & pagination
//
// Query params:
//   category  - filter by category  e.g. ?category=ACTION
//   search    - text search         e.g. ?search=dark souls
//   sort      - field to sort by    e.g. ?sort=rating (default: -rating)
//   page      - page number         e.g. ?page=2 (default: 1)
//   limit     - results per page    e.g. ?limit=20 (default: 20)
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

    const query = {};

    if (category) {
      query.categories = category.toUpperCase();
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [games, total] = await Promise.all([
      Game.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-description -tags -screenshots"), // lean response for lists
      Game.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: games,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games/categories
// Returns all unique categories and the count of games in each
// -----------------------------------------------------------
router.get("/categories", async (req, res) => {
  try {
    const categories = await Game.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: categories.map((c) => ({ category: c._id, count: c.count })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games/featured
// Returns top-rated game per category — perfect for the home page hero sections
// -----------------------------------------------------------
router.get("/featured", async (req, res) => {
  try {
    const featured = await Game.aggregate([
      { $unwind: "$categories" },
      { $sort: { rating: -1 } },
      {
        $group: {
          _id: "$categories",
          game: { $first: "$$ROOT" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: featured.map((f) => ({
        category: f._id,
        game: f.game,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games/home
// Returns a curated set for the home page:
//   - Top 10 highest rated overall
//   - Up to 5 games per category
// -----------------------------------------------------------
router.get("/home", async (req, res) => {
  try {
    const [topRated, byCategory] = await Promise.all([
      // Top 10 overall
      Game.find()
        .sort("-rating")
        .limit(10)
        .select("name slug backgroundImage rating categories metacritic released"),

      // Group by category, up to 5 each
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
                categories: "$categories",
              },
            },
          },
        },
        {
          $project: {
            games: { $slice: ["$games", 5] },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        topRated,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item._id] = item.games;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------------------------------------
// GET /api/games/:id
// Returns full details for a single game (by MongoDB _id or rawgId)
// -----------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Support lookup by either MongoDB _id or RAWG numeric id
    const query = isNaN(id) ? { _id: id } : { rawgId: parseInt(id) };
    const game = await Game.findOne(query);

    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    res.json({ success: true, data: game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
