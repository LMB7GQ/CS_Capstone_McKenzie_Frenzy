import Folder from "../models/Folder.js";
import FolderGame from "../models/FolderGame.js";

export async function createFolder(userId, name) {
  return await Folder.create({ userId, name });
}

export async function addGameToFolder(userId, folderId, game) {
  return await FolderGame.create({
    userId,
    folderId,
    source: game.source,
    gameId: String(game.gameId),
    name: game.name,
    coverUrl: game.coverUrl,
  });
}

export async function getLibrary(userId) {
  const folders = await Folder.find({ userId }).sort({ createdAt: 1 }).lean();
  const folderIds = folders.map(f => f._id);

  const games = await FolderGame.find({ userId, folderId: { $in: folderIds } })
    .sort({ createdAt: -1 })
    .lean();

  const byFolder = new Map();
  for (const g of games) {
    const key = String(g.folderId);
    if (!byFolder.has(key)) byFolder.set(key, []);
    byFolder.get(key).push(g);
  }

  return folders.map(f => ({
    ...f,
    games: byFolder.get(String(f._id)) ?? [],
  }));
}