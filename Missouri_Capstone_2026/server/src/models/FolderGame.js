import mongoose from "mongoose";

const FolderGameSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", required: true, index: true },

    source: { type: String, required: true, enum: ["rawg", "igdb"] },
    gameId: { type: String, required: true },
    name: { type: String, required: true },
    coverUrl: { type: String },
  },
  { timestamps: true }
);

FolderGameSchema.index({ folderId: 1, source: 1, gameId: 1 }, { unique: true });

export default mongoose.model("FolderGame", FolderGameSchema);