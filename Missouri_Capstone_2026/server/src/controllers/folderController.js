function createFolder(userId, folderName) {
    const folder = new Folder(userId, folderName, []);
    
    //save folder to database and get the id
    const id  = saveFolderToDatabase(folder);
    folder.id = id;

    return folder;
}

function DeleteFolder(folderId) {
    //code to delete folder from database
}

function saveFolderToDatabase(folder) {
    //code to save folder to database and return the id
}

fucntion addGameToFolder(folderId, gameId) {
    //code to add game to folder in database
    Game game = getGameById(gameId);
    Folder folder = getFolderById(folderId);
    folder.addGame(game);
    updateFolderInDatabase(folder);
}

function removeGameFromFolder(folderId, gameId) {
    //code to remove game from folder in database
}

function updateFolderInDatabase(folder) {
    folder.updateDatabase();
}