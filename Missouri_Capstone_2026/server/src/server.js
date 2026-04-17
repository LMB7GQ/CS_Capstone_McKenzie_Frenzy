
import "dotenv/config";
import connectDB from "./config/db.js";
import "./config/cache.js";
import app from "./app.js";

// connect to DB, then start server
const start = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
};

start();