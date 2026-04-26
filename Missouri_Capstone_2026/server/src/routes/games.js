import express from "express";
import Game from "../models/Game.js";
import {
    getCache,
    setCache,
    CacheKeys,
    TTL,
} from "../utils/cacheHelpers.js";
import axios from "axios";

const router = express.Router();

const RAWG_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE = "https://api.rawg.io/api";

// ── Helper: Search RAWG API ────────────────────────────────
/**
 * Search RAWG for best matches, then apply optional minimum rating / popularity filters.
 * Returns filtered results if they exist, otherwise returns RAWG's original results.
 *
 * @param {string} query
 * @param {number} limit
 * @param {number} minRating - minimum RAWG rating (0-5)
 * @param {number} minPopularity - minimum ratings_count / added threshold
 */
async function searchRAWG(query, limit = 10, minRating = 0, minPopularity = 0) {
    try {
        console.log(`🌐 RAWG search: "${query}" (limit=${limit}, minRating=${minRating}, minPopularity=${minPopularity})`);

        // Let RAWG return relevance-based results (do not force ordering by rating)
        const response = await axios.get(`${RAWG_BASE}/games`, {
            params: {
                key: RAWG_KEY,
                search: query,
                page_size: limit,
                // prefer precise search to get better name matches
                search_precise: true,
            },
        });

        const rawResults = response.data.results || [];

        const results = rawResults.map((game) => ({
            rawgId: game.id,
            name: game.name,
            slug: game.slug,
            backgroundImage: game.background_image,
            rating: game.rating,
            ratingsCount: game.ratings_count || 0,
            added: game.added || 0,
            released: game.released,
            source: "rawg", // Mark as from RAWG
        }));

        console.log(`  ↳ RAWG returned ${results.length} results for "${query}"`);

        // Apply server-side filtering for minimum rating/popularity (popularity uses ratingsCount || added)
        const filtered = results.filter((g) => {
            const popularity = Math.max(g.ratingsCount || 0, g.added || 0);
            return (g.rating || 0) >= minRating && popularity >= minPopularity;
        });

        if (filtered.length) {
            console.log(`  ↳ ${filtered.length} results remain after applying filters`);
            return filtered;
        }

        // If filters are too strict, fall back to RAWG unfiltered results (but still limited)
        if (minRating > 0 || minPopularity > 0) {
            console.log(`  ↳ Filters removed (too strict) — returning unfiltered RAWG results`);
        }

        return results;
    } catch (error) {
        console.warn(`⚠️  RAWG search failed for "${query}": ${error.message}`);
        return [];
    }
}

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
// Hybrid search: MongoDB first, then fill gaps with RAWG
// Max 10-15 API calls to RAWG per search
// -----------------------------------------------------------
router.get("/", async (req, res) => {
    try {
        const { category, search, sort = "-rating", page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // allow clients to request minimum rating/popularity for RAWG fallback
        const minRating = parseFloat(req.query.minRating) || 0; // e.g., 3.5
        const minPopularity = parseInt(req.query.minPopularity) || 0; // e.g., 50 (ratings_count or added)

        // For category browsing, use cache
        const isCacheable = category && !search && pageNum === 1;
        const cacheKey = isCacheable ? CacheKeys.gamesByCategory(category) : null;

        if (cacheKey) {
            const cached = await getCache(cacheKey);
            if (cached) return res.json({ success: true, source: "cache", ...cached });
        }

        let games = [];
        let total = 0;

        if (search) {
            // HYBRID SEARCH: MongoDB first, then RAWG for gaps
            console.log(`🔍 Hybrid search for: "${search}" (minRating=${minRating}, minPopularity=${minPopularity})`);

            // Step 1: Get from MongoDB (prefix match)
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const mongoQuery = {
                name: { $regex: `(^|\\s)${escapedSearch}`, $options: "i" },
            };

            const mongoGames = await Game.find(mongoQuery)
                .sort(sort)
                .select("-description -tags");

            console.log(`  📦 Found ${mongoGames.length} games in MongoDB`);
            games = mongoGames;

            // Step 2: Fill gaps with RAWG results
            if (pageNum === 1) {
                const remainingNeeded = limitNum - games.length;

                if (remainingNeeded > 0) {
                    console.log(`  🌐 Need ${remainingNeeded} more results from RAWG (requesting up to 25)`);

                    try {
                        // Request up to 25 from RAWG, but only use what we need to reach limitNum
                        const rawgLimit = Math.min(remainingNeeded, 25);
                        const rawgGames = await searchRAWG(search, rawgLimit, minRating, minPopularity);

                        // Filter out duplicates (games already in MongoDB)
                        const mongoRawgIds = new Set(mongoGames.map(g => g.rawgId));
                        const uniqueRawgGames = (rawgGames || []).filter(g => !mongoRawgIds.has(g.rawgId));

                        console.log(`  ✅ Got ${uniqueRawgGames.length} new games from RAWG`);
                        games = [...games, ...uniqueRawgGames];
                    } catch (err) {
                        console.warn(`  ⚠️  RAWG search error: ${err.message}`);
                    }
                }
            }

            total = games.length;

            // Apply pagination after combining results
            const skip = (pageNum - 1) * limitNum;
            games = games.slice(skip, skip + limitNum);

        } else if (category) {
            // Category filtering (existing logic)
            const skip = (pageNum - 1) * limitNum;
            const [categoryGames, categoryTotal] = await Promise.all([
                Game.find({ categories: category.toUpperCase() })
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum)
                    .select("-description -tags"),
                Game.countDocuments({ categories: category.toUpperCase() }),
            ]);

            games = categoryGames;
            total = categoryTotal;
        } else {
            // No search or category — return all (existing logic)
            const skip = (pageNum - 1) * limitNum;
            const [allGames, allTotal] = await Promise.all([
                Game.find({})
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum)
                    .select("-description -tags"),
                Game.countDocuments({}),
            ]);

            games = allGames;
            total = allTotal;
        }

        const result = {
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: games,
            searchType: search ? "hybrid" : category ? "category" : "all",
        };

        // make the top-level source reflect hybrid/rawg usage
        const responseSource = search ? "hybrid" : category ? "category" : "database";

        if (cacheKey) await setCache(cacheKey, result, TTL.CATEGORY);
        res.json({ success: true, source: responseSource, ...result });

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