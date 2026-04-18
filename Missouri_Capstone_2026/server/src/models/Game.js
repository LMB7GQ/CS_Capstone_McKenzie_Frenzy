import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
  {
    // ── Core RAWG data ──────────────────────────────────────
    rawgId:       { type: Number, unique: true, required: true },
    name:         { type: String, required: true },
    slug:         { type: String },
    description:  { type: String },
    released:     { type: String },
    backgroundImage: { type: String },
    backgroundImageAdditional: { type: String }, // second promo image RAWG provides

    // ── Ratings ─────────────────────────────────────────────
    rating:       { type: Number },
    ratingTop:    { type: Number },
    ratingsCount: { type: Number },
    metacritic:   { type: Number },

    // Breakdown of how users rated it
    ratingsBreakdown: [
      {
        id:      Number,
        title:   String,  // "exceptional" | "recommended" | "meh" | "skip"
        count:   Number,
        percent: Number,
      }
    ],

    // ── Game info ───────────────────────────────────────────
    playtime:     { type: Number }, // avg hours
    website:      { type: String },
    esrbRating:   { type: String },
    developer:    { type: String },
    publisher:    { type: String },

    // ── Achievements ────────────────────────────────────────
    achievementsCount: { type: Number, default: 0 },

    // ── Media — screenshots (up to 20) ──────────────────────
    screenshots: [
      {
        id:    Number,
        image: String,
      }
    ],

    // ── Media — trailers/videos ──────────────────────────────
    videos: [
      {
        id:      Number,
        name:    String,  // trailer title e.g. "Launch Trailer"
        preview: String,  // thumbnail image URL
        data: {
          480:  String,   // video URL at 480p
          max:  String,   // video URL at max quality
        }
      }
    ],

    // ── Store links ─────────────────────────────────────────
    stores: [
      {
        id:       Number,
        name:     String, // "Steam" | "Epic Games" | "GOG" etc
        slug:     String,
        url:      String, // direct store page URL
      }
    ],

    // ── Related games in same series ────────────────────────
    series: [
      {
        rawgId:          Number,
        name:            String,
        slug:            String,
        backgroundImage: String,
        rating:          Number,
        released:        String,
      }
    ],

    // ── Genres, tags, platforms ─────────────────────────────
    genres:    [{ id: Number, name: String, slug: String }],
    tags:      [{ id: Number, name: String, slug: String }],
    platforms: [{ name: String, slug: String }],

    // ── Our categorization ──────────────────────────────────
    categories: [{ type: String }],

    // ── Metadata ────────────────────────────────────────────
    lastFetched: { type: Date, default: Date.now },

    // Flag to track if extended data has been fetched
    // (videos, full screenshots, stores, series)
    extendedDataFetched: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────────────
GameSchema.index({ categories: 1 });
GameSchema.index({ rating: -1 });
GameSchema.index({ name: "text" });

// "Games" targets your existing Atlas collection exactly
export default mongoose.model("Game", GameSchema, "Games");