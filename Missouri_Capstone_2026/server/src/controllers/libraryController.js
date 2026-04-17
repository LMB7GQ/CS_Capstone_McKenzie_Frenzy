import * as libraryService from "../services/libraryService.js";

export async function createMyFolder(req, res) {
  try {
    const userId = req.user.appUserId;
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

export async function addGameToMyFolder(req, res) {
  try {
    const userId = req.user.appUserId;
    const { folderId } = req.params;
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

export async function getMyLibrary(req, res) {
  try {
    const userId = req.user.appUserId;
    const library = await libraryService.getLibrary(userId);
    return res.json({ ok: true, library });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

export async function deleteMyFolder(req, res) {
  try {
    const userId = req.user.appUserId;
    const { folderId } = req.params;

    const result = await libraryService.deleteFolder(userId, folderId);

    if (!result.ok) {
      return res.status(404).json({
        ok: false,
        error: result.error,
      });
    }

    return res.json({
      ok: true,
      message: "Folder deleted successfully",
      deletedFolderId: folderId,
      deletedGamesCount: result.deletedGamesCount,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}