import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    ID: { type: Number, required: true, unique: true, index: true },
    USERNAME: { type: String, required: true, unique: true, trim: true },
    EMAIL: { type: String, required: true, unique: true, lowercase: true, trim: true },
    DISPLAY_NAME: { type: String, required: true, trim: true },
    CREATED_DATE: { type: Date, default: Date.now },
  },
  { collection: "Users", timestamps: false }
);

export default mongoose.model("User", UserSchema);