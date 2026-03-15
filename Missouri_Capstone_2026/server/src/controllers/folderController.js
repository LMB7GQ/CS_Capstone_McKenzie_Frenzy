import {ObjectId} from 'mongodb';
import Folder from '../models/Folder.js';
import Game from '../models/Game.js';
import {getDB} from '../config/db.js';

async function createFolder(userId, folderName) {
    const folder = new Folder(userId, folderName, []);
    
    //save folder to database and get the id
    const id  = await saveFolderToDatabase(folder);
    folder.id = id;

    return folder;
}

async function DeleteFolder(folderId) {
    //code to delete folder from database
    const db = getDB();
    return await db.collection('folders').deleteOne({_id: new ObjectId(folderId)});
}

async function saveFolderToDatabase(folder) {
    //code to save folder to database and return the id
    const db = getDB();
    const result = await db.collection('folders').insertOne({
        userId: folder.userId,
        name: folder.name,
        games: folder.games
    });
    return result.insertedId;
}

async function addGame(folderId, gameId) {
    //code to add game to folder in database
    Game game = getGameById(gameId); 
    Folder folder = getFolderById(folderId);
    await addGameToFolder(folderId, gameId);
}

async function getFolderById(folderId) {
    //code to get folder from database by id
    const db = getDB();
    return await db.collection('folders').findOne({_id: new ObjectId(folderId)});
}

//function that removes a game from a folder in the database
async function removeGame(folderId, gameId) {
    //code to remove game from folder in database
    const db = getDB();
    return await db.collection('folders').updateOne({_id: new ObjectId(folderId)}, {$pull: {games: {_id: new ObjectId(gameId)}}});
}