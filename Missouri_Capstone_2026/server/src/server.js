/**
 * server.js
 * -----------------------------------------------------------
 * Main Express server entry point.
 * Shows how to wire up MongoDB + the games routes.
 * -----------------------------------------------------------
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import gameRoutes from "./routes/games.js";

const app = express();

// ------- Middleware -------
app.use(cors());
app.use(express.json());

// ------- DB Connection -------
connectDB();

// ------- Routes -------
app.use("/api/games", gameRoutes);

// Health check
app.get("/", (req, res) => res.json({ message: "API is running" }));

// ------- Start Server -------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
