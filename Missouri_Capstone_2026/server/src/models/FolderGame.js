import mongoose from "mongoose";

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
    STATUS: { type: String, required: true },
    RATING: { type: Number, default: null },
    ADDED_DATE: { type: Date, default: Date.now },
  },
  { collection: "FolderGames" }
);

FolderGameSchema.index(
  { USER_ID: 1, FOLDER_ID: 1, GAME_RAWG_ID: 1 },
  { unique: true }
);

export default mongoose.model("FolderGame", FolderGameSchema);