import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import gamesRouter from "./routes/games.js";
import usersRouter from "./routes/users.js";
import librariesRouter from "./routes/libraries.js";
import authRouter from "./routes/auth.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // change if needed
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

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
app.use("/api/auth", authRouter);

export default app;