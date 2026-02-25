import * as libraryService from "../services/libraryService.js";

export async function createFolder(req, res) {
  try {
    const { userId } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ ok: false, error: "name is required" });

    const folder = await libraryService.createFolder(userId, name);
    return res.status(201).json({ ok: true, folder });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

export async function addGame(req, res) {
  try {
    const { userId, folderId } = req.params;
    const { source, gameId, name, coverUrl } = req.body;

    if (!source || !gameId || !name) {
      return res.status(400).json({ ok: false, error: "source, gameId, and name are required" });
    }

    const saved = await libraryService.addGameToFolder(userId, folderId, {
      source,
      gameId,
      name,
      coverUrl,
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