import Folder from "../models/Folder.js";
import FolderGame from "../models/FolderGame.js";

export async function createFolder(userId, name) {
  return await Folder.create({
    USER_ID: Number(userId),
    NAME: name,
    CREATED_DATE: new Date(),
  });
}

export async function addGameToFolder(userId, folderId, game) {
  return await FolderGame.create({
    USER_ID: Number(userId),
    FOLDER_ID: folderId,
    GAME_RAWG_ID: Number(game.gameRawgId),
    GAME_NAME: game.gameName,
    STATUS: game.status,
    RATING: game.rating ?? null,
    ADDED_DATE: new Date(),
  });
}

export async function getLibrary(userId) {
  const numericUserId = Number(userId);

  const folders = await Folder.find({ USER_ID: numericUserId })
    .sort({ CREATED_DATE: 1 })
    .lean();

  const folderIds = folders.map((f) => f._id);

  const games = await FolderGame.find({
    USER_ID: numericUserId,
    FOLDER_ID: { $in: folderIds },
  })
    .sort({ ADDED_DATE: -1 })
    .lean();

  const byFolder = new Map();

  for (const g of games) {
    const key = String(g.FOLDER_ID);
    if (!byFolder.has(key)) byFolder.set(key, []);
    byFolder.get(key).push(g);
  }

  return folders.map((folder) => ({
    folderId: folder._id,
    userId: folder.USER_ID,
    folderName: folder.NAME,
    createdDate: folder.CREATED_DATE,
    games: (byFolder.get(String(folder._id)) ?? []).map((game) => ({
      folderGameId: game._id,
      rawgId: game.GAME_RAWG_ID,
      name: game.GAME_NAME,
      status: game.STATUS,
      rating: game.RATING,
      addedDate: game.ADDED_DATE,
    })),
  }));
}

export async function deleteFolder(userId, folderId) {
  const folder = await Folder.findOne({
    _id: folderId,
    USER_ID: Number(userId),
  });

  if (!folder) {
    return {
      ok: false,
      error: "Folder not found for this user",
    };
  }

  const deletedGames = await FolderGame.deleteMany({
    USER_ID: Number(userId),
    FOLDER_ID: folder._id,
  });

  await Folder.deleteOne({
    _id: folder._id,
    USER_ID: Number(userId),
  });

  return {
    ok: true,
    deletedGamesCount: deletedGames.deletedCount ?? 0,
  };
}