import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
  {
    // RAWG data
    rawgId: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    slug: { type: String },
    description: { type: String },
    released: { type: String },
    backgroundImage: { type: String },
    rating: { type: Number },
    ratingTop: { type: Number },
    ratingsCount: { type: Number },
    metacritic: { type: Number },
    playtime: { type: Number }, // avg playtime in hours
    website: { type: String },

    // Genres & tags from RAWG
    genres: [{ id: Number, name: String, slug: String }],
    tags: [{ id: Number, name: String, slug: String }],
    platforms: [{ name: String, slug: String }],

    // Screenshots
    screenshots: [{ id: Number, image: String }],

    // Our own categorization (from the seed list)
    categories: [{ type: String }], // e.g. ["ACTION", "SHOOTER"]

    // Metadata
    esrbRating: { type: String },
    developer: { type: String },
    publisher: { type: String },

    // Control flag — lets us re-seed without duplication
    lastFetched: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for common query patterns
GameSchema.index({ categories: 1 });
GameSchema.index({ rating: -1 });
GameSchema.index({ name: "text" }); // enables text search

// "Games" (third argument) explicitly targets your existing Atlas collection
// Without this, Mongoose would auto-create a new "games" (lowercase) collection
export default mongoose.model("Game", GameSchema, "Games");
