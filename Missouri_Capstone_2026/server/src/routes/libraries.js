import express from "express";
import { createFolder, addGame, getLibrary } from "../controllers/libraryController.js";

const router = express.Router();

router.get("/:userId", getLibrary);
router.post("/:userId/folders", createFolder);
router.post("/:userId/folders/:folderId/games", addGame);

export default router;