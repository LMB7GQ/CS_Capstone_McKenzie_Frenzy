import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import gamesRouter from "./routes/games.js";
import usersRouter from "./routes/users.js";
import librariesRouter from "./routes/libraries.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

// keep your dbinfo route if you like
app.get("/api/dbinfo", (req, res) => {
  res.json({
    readyState: mongoose.connection.readyState,
    dbName: mongoose.connection.name,
    host: mongoose.connection.host,
  });
});

app.use("/api/games", gamesRouter);
app.use("/api/users", usersRouter);
app.use("/api/libraries", librariesRouter);

export default app;