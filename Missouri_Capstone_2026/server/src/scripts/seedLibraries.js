import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const db = mongoose.connection.useDb("Capstone");

    const UserSchema = new mongoose.Schema(
      {
        ID: Number,
        FIRST_NAME: String,
        LAST_NAME: String,
        USERNAME: String,
        EMAIL: String,
        PASSWORD: mongoose.Schema.Types.Mixed,
        CREATED_DATE: Date,
      },
      { collection: "Users", strict: false }
    );

    const GameSchema = new mongoose.Schema(
      {
        rawgId: Number,
        name: String,
        slug: String,
        backgroundImage: String,
      },
      { collection: "Games", strict: false }
    );

    const FolderSchema = new mongoose.Schema(
      {
        USER_ID: { type: Number, required: true, index: true },
        NAME: { type: String, required: true },
        CREATED_DATE: { type: Date, default: Date.now },
      },
      { collection: "Folders" }
    );

    FolderSchema.index({ USER_ID: 1, NAME: 1 }, { unique: true });

    const FolderGameSchema = new mongoose.Schema(
      {
        USER_ID: { type: Number, required: true, index: true },
        FOLDER_ID: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          index: true,
        },
        GAME_RAWG_ID: { type: Number, required: true, index: true },
        GAME_NAME: { type: String, required: true },
        STATUS: { type: String, required: true }, // wishlist / playing / completed
        RATING: { type: Number, default: null },
        ADDED_DATE: { type: Date, default: Date.now },
      },
      { collection: "FolderGames" }
    );

    FolderGameSchema.index(
      { USER_ID: 1, FOLDER_ID: 1, GAME_RAWG_ID: 1 },
      { unique: true }
    );

    const User = db.models.User || db.model("User", UserSchema);
    const Game = db.models.Game || db.model("Game", GameSchema);
    const Folder = db.models.Folder || db.model("Folder", FolderSchema);
    const FolderGame =
      db.models.FolderGame || db.model("FolderGame", FolderGameSchema);

    const users = await User.find({}).sort({ ID: 1 }).lean();
    const games = await Game.find({}).sort({ rawgId: 1 }).lean();

    if (!users.length) {
      throw new Error("No users found in Capstone.Users");
    }

    if (!games.length) {
      throw new Error("No games found in Capstone.Games");
    }

    console.log(`Found ${users.length} users`);
    console.log(`Found ${games.length} games`);

    const folderNames = ["Wishlist", "Playing", "Completed"];

    // Create default folders for each user
    for (const user of users) {
      for (const folderName of folderNames) {
        await Folder.updateOne(
          { USER_ID: user.ID, NAME: folderName },
          {
            $setOnInsert: {
              USER_ID: user.ID,
              NAME: folderName,
              CREATED_DATE: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }

    console.log("Default folders ensured");

    // Reload all folders so we have _id values
    const allFolders = await Folder.find({}).lean();

    const folderMap = new Map();
    for (const folder of allFolders) {
      folderMap.set(`${folder.USER_ID}:${folder.NAME}`, folder);
    }

    // Build overlapping library data so recommendations make sense
    // Each user gets:
    // - 5 wishlist
    // - 3 playing
    // - 4 completed
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      const wishlistFolder = folderMap.get(`${user.ID}:Wishlist`);
      const playingFolder = folderMap.get(`${user.ID}:Playing`);
      const completedFolder = folderMap.get(`${user.ID}:Completed`);

      
      const base = (i * 3) % Math.max(games.length - 12, 1);

      const wishlistGames = games.slice(base, base + 5);
      const playingGames = games.slice(base + 2, base + 5);
      const completedGames = games.slice(base + 5, base + 9);

      const inserts = [
        ...wishlistGames.map((g) => ({
          USER_ID: user.ID,
          FOLDER_ID: wishlistFolder._id,
          GAME_RAWG_ID: g.rawgId,
          GAME_NAME: g.name,
          STATUS: "wishlist",
          RATING: null,
        })),
        ...playingGames.map((g) => ({
          USER_ID: user.ID,
          FOLDER_ID: playingFolder._id,
          GAME_RAWG_ID: g.rawgId,
          GAME_NAME: g.name,
          STATUS: "playing",
          RATING: null,
        })),
        ...completedGames.map((g) => ({
          USER_ID: user.ID,
          FOLDER_ID: completedFolder._id,
          GAME_RAWG_ID: g.rawgId,
          GAME_NAME: g.name,
          STATUS: "completed",
          RATING: 4 + ((g.rawgId % 2) * 0.5), 
        })),
      ];

      for (const entry of inserts) {
        await FolderGame.updateOne(
          {
            USER_ID: entry.USER_ID,
            FOLDER_ID: entry.FOLDER_ID,
            GAME_RAWG_ID: entry.GAME_RAWG_ID,
          },
          { $setOnInsert: entry },
          { upsert: true }
        );
      }
    }

    console.log("FolderGames seeded successfully");

    await mongoose.disconnect();
    console.log("Done");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

start();