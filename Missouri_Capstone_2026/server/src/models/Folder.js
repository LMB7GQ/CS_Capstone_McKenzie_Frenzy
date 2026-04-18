import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema(
  {
    USER_ID: { type: Number, required: true, index: true },
    NAME: { type: String, required: true, trim: true },
    CREATED_DATE: { type: Date, default: Date.now },
  },
  { collection: "Folders" }
);

FolderSchema.index({ USER_ID: 1, NAME: 1 }, { unique: true });

export default mongoose.model("Folder", FolderSchema);