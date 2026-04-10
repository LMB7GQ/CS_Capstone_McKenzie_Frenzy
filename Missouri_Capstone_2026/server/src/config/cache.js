
// src/config/cache.js
import { createClient } from "redis";

const redis = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
});

redis.on("connect", () => console.log("✅ Redis Cache Connected"));
redis.on("error", (err) => console.warn(`⚠️  Redis error: ${err.message}`));

// Connect when this module is first imported
await redis.connect();

export default redis;
