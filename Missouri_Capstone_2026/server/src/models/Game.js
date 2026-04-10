// TODO: Implement Game model schema

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
