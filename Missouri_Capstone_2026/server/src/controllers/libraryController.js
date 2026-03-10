import * as libraryService from "../services/libraryService.js";

export async function createFolder(req, res) {
  try {
    const { userId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, error: "name is required" });
    }

    const folder = await libraryService.createFolder(userId, name);
    return res.status(201).json({ ok: true, folder });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

export async function addGame(req, res) {
  try {
    const { userId, folderId } = req.params;
    const { gameRawgId, gameName, status, rating } = req.body;

    if (!gameRawgId || !gameName || !status) {
      return res.status(400).json({
        ok: false,
        error: "gameRawgId, gameName, and status are required",
      });
    }

    const saved = await libraryService.addGameToFolder(userId, folderId, {
      gameRawgId,
      gameName,
      status,
      rating,
    });

    return res.status(201).json({ ok: true, saved });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

export async function getLibrary(req, res) {
  try {
    const { userId } = req.params;
    const library = await libraryService.getLibrary(userId);
    return res.json({ ok: true, library });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}