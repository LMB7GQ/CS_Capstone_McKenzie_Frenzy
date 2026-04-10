// src/utils/cacheHelpers.js
// -----------------------------------------------------------
// Wrapper functions around Redis to keep route files clean.
// Handles errors gracefully — if Redis is down, the app still
// works by falling through to MongoDB.
// -----------------------------------------------------------

import redis from "../config/cache.js";

// -----------------------------------------------------------
// TTL Constants (in seconds)
// Adjust these based on how often your data changes
// -----------------------------------------------------------
export const TTL = {
  HOME_PAGE:    60 * 60,       // 1 hour   — game data doesn't change often
  CATEGORY:     60 * 30,       // 30 min   — category lists
  SINGLE_GAME:  60 * 60 * 24,  // 24 hours — individual game details rarely change
  USER_DATA:    60 * 15,       // 15 min   — user-specific data (library, prefs)
};

// -----------------------------------------------------------
// Cache Key Builders
// Centralizing key names prevents typos across files
// -----------------------------------------------------------
export const CacheKeys = {
  // Global keys — shared across ALL users
  homePage:       () => "global:home_page",
  allCategories:  () => "global:categories",
  gamesByCategory:(category) => `global:category:${category.toLowerCase()}`,
  singleGame:     (id) => `global:game:${id}`,

  // User-specific keys — isolated per user
  userLibrary:    (userId) => `user:${userId}:library`,
  userProfile:    (userId) => `user:${userId}:profile`,
  userRecs:       (userId) => `user:${userId}:recommendations`,
};

// -----------------------------------------------------------
// getCache(key)
// Returns parsed data from cache, or null if not found/error
// -----------------------------------------------------------
export async function getCache(key) {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.warn(`⚠️  Cache GET failed for "${key}": ${err.message}`);
    return null; // fall through to DB
  }
}

// -----------------------------------------------------------
// setCache(key, data, ttl)
// Stores data in cache as JSON string with expiry
// -----------------------------------------------------------
export async function setCache(key, data, ttl) {
  try {
    console.log(`💾 Setting cache: "${key}" with TTL: ${ttl}s`);
    const result = await redis.set(key, JSON.stringify(data), { EX: ttl });
    console.log(`💾 Cache set result: ${result}`);

    // Verify TTL was actually applied
    const actualTTL = await redis.ttl(key);
    console.log(`⏱️  Verified TTL for "${key}": ${actualTTL}s`);
  } catch (err) {
    console.warn(`⚠️  Cache SET failed for "${key}": ${err.message}`);
  }
}

// -----------------------------------------------------------
// deleteCache(key)
// Removes a single key — use when data is updated
// -----------------------------------------------------------
export async function deleteCache(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`⚠️  Cache DELETE failed for "${key}": ${err.message}`);
  }
}

// -----------------------------------------------------------
// invalidateUserCache(userId)
// Clears ALL cached data for a specific user
// -----------------------------------------------------------
export async function invalidateUserCache(userId) {
  try {
    const keys = [];
    for await (const key of redis.scanIterator({ MATCH: `user:${userId}:*` })) {
      keys.push(key);
    }
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🗑️  Cleared ${keys.length} cache entries for user ${userId}`);
    }
  } catch (err) {
    console.warn(`⚠️  Cache invalidation failed for user ${userId}: ${err.message}`);
  }
}

// -----------------------------------------------------------
// invalidateGlobalCache()
// Clears ALL global cache — run this after re-seeding games
// -----------------------------------------------------------
export async function invalidateGlobalCache() {
  try {
    const keys = [];
    for await (const key of redis.scanIterator({ MATCH: "global:*" })) {
      keys.push(key);
    }
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🗑️  Cleared ${keys.length} global cache entries`);
    }
  } catch (err) {
    console.warn(`⚠️  Global cache invalidation failed: ${err.message}`);
  }
}