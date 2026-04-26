// TODO: Implement Game model schema
/*
class Game {
    #id;
    #rawgId;
    #name;
    #description;
    #releaseDate;
    #rating;
    #backgroundImage;
    #catergories;
    #createdAt
    #devloper;
    #esrbRating
    #esrbRating;
    #lastFetched;
    #metacritic;
    #platforms;
    #playtime;
    #publisher;
    #genres;
    #ratingTop;
    #ratingsCount;
    #released;
    #screenshots;
    #slug;
    #tags;
    #updatedAt;
    #website;



    constructor(id, rawgId, name, description, releaseDate, rating, backgroundImage, catergories, createdAt, devloper, esrbRating
        genres, lastFetched, metacritic, platforms, playtime, publisher, ratingTop, ratingsCount, released, screenshots, slug, tags, updatedAt, website
    ) {
        this.#id = id;
        this.#rawgId = rawgId;
        this.#name = name;
        this.#description = description;
        this.#releaseDate = releaseDate;
        this.#rating = rating;
        this.#backgroundImage = backgroundImage;
        this.#catergories = catergories;
        this.#createdAt = createdAt;
        this.#devloper = devloper;
        this.#esrbRating = esrbRating;
        this.#genres = genres;
        this.#lastFetched = lastFetched;
        this.#metacritic = metacritic;
        this.#platforms = platforms;
        this.#playtime = playtime;
        this.#publisher = publisher;
        this.#ratingTop = ratingTop;
        this.#ratingsCount = ratingsCount;
        this.#released = released;
        this.#screenshots = screenshots;
        this.#slug = slug;
        this.#tags = tags;
        this.#updatedAt = updatedAt;
        this.#website = website;
    }

    //getters
    get id() {
        return this.#id;
    }

    get rawgId() {
        return this.#rawgId;
    }   

    get name() {
        return this.#name;
    }   

    get description() {
        return this.#description;
    }

    get releaseDate() {
        return this.#releaseDate;
    }

    get rating() {
        return this.#rating;
    }

    get backgroundImage() {
        return this.#backgroundImage;
    }

    get catergories() {
        return this.#catergories;
    }

    get createdAt() {
        return this.#createdAt;
    }

    get devloper() {
        return this.#devloper;
    }

    get esrbRating() {
        return this.#esrbRating;
    }

    get genres() {
        return this.#genres;
    }

    get lastFetched() {
        return this.#lastFetched;
    }   

    get metacritic() {
        return this.#metacritic;
    }   

    get platforms() {
        return this.#platforms;
    }

    get playtime() {
        return this.#playtime;
    }

    get publisher() {
        return this.#publisher;
    }

    get ratingTop() {
        return this.#ratingTop;
    }   

    get ratingsCount() {
        return this.#ratingsCount;
    }

    get released() {
        return this.#released;
    }

    get screenshots() {
        return this.#screenshots;
    }

    get slug() {
        return this.#slug;
    }

    get tags() {
        return this.#tags;
    }

    get updatedAt() {
        return this.#updatedAt;
    }

    get website() {
        return this.#website;
    }

    //setters
    set id(newId) {
        this.#id = newId;
    }

    set rawgId(newRawgId) {
        this.#rawgId = newRawgId;
    }

    set name(newName) {
        this.#name = newName;
    }

    set description(newDescription) {
        this.#description = newDescription;
    }

    set releaseDate(newReleaseDate) {
        this.#releaseDate = newReleaseDate;
    }

    set rating(newRating) {
        this.#rating = newRating;
    }

    set backgroundImage(newBackgroundImage) {
        this.#backgroundImage = newBackgroundImage;
    }

    set catergories(newCatergories) {
        this.#catergories = newCatergories;
    }

    set createdAt(newCreatedAt) {
        this.#createdAt = newCreatedAt;
    }

    set devloper(newDevloper) {
        this.#devloper = newDevloper;
    }

    set esrbRating(newEsrbRating) {
        this.#esrbRating = newEsrbRating;
    }

    set genres(newGenres) {
        this.#genres = newGenres;
    }

    set lastFetched(newLastFetched) {
        this.#lastFetched = newLastFetched;
    }

    set metacritic(newMetacritic) {
        this.#metacritic = newMetacritic;
    }

    set platforms(newPlatforms) {
        this.#platforms = newPlatforms;
    }

    set playtime(newPlaytime) {
        this.#playtime = newPlaytime;
    }

    set publisher(newPublisher) {
        this.#publisher = newPublisher;
    }

    set ratingTop(newRatingTop) {
        this.#ratingTop = newRatingTop;
    }

    set ratingsCount(newRatingsCount) {
        this.#ratingsCount = newRatingsCount;
    }

    set released(newReleased) {
        this.#released = newReleased;
    }

    set screenshots(newScreenshots) {
        this.#screenshots = newScreenshots;
    }

    set slug(newSlug) {
        this.#slug = newSlug;
    }

    set tags(newTags) {
        this.#tags = newTags;
    }

    set updatedAt(newUpdatedAt) {
        this.#updatedAt = newUpdatedAt;
    }

    set website(newWebsite) {
        this.#website = newWebsite;
    }

    
}
*/
//this stuff was randomly added. Gotta check if we need it or not.
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

// "Games" (third argument) explicitly targets your existing Atlas collection
// Without this, Mongoose would auto-create a new "games" (lowercase) collection
//export default mongoose.model("Game", GameSchema, "Games");

// "Games" targets your existing Atlas collection exactly
export default mongoose.model("Game", GameSchema, "Games");
