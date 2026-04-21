import express from "express";
import {
  getMyLibrary,
  createMyFolder,
  addGameToMyFolder,
  deleteMyFolder,
} from "../controllers/libraryController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", requireAuth, getMyLibrary);
router.post("/me/folders", requireAuth, createMyFolder);
router.post("/me/folders/:folderId/games", requireAuth, addGameToMyFolder);
router.delete("/me/folders/:folderId", requireAuth, deleteMyFolder);

export default router;