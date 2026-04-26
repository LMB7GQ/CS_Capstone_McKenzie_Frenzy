import {ObjectId} from 'mongodb';
import {getDB} from '../config/db.js';

/*
class Folder {
    #id;
    #userId;
    #name;
    #games;

    constructor(userId, name, games) {
        this.#userId = userId;
        this.#name = name;
        this.#games = games;
    }
    
    //getters
    get id() {
        return this.#id;
    }

    get userId() {
        return this.#userId;
    }

    get name() {
        return this.#name;
    }

    get games() {
        return this.#games;
    }

    //setters
    set id(newId) {
        this.#id = newId;
    }

    set userId(newUserId) {
        this.#userId = newUserId;
    }

    set name(newName) {
        this.#name = newName;
    }
    
    set games(newGames) {
        this.#games = newGames;
    }

    //methods

    export async function addGameToFolder(folderId, gameId) {
        //code to add game to folder in database
        const db = getDB();
        const game = await db.collection('games').findOne({_id: new ObjectId(gameId)});
        const folder = await db.collection('folders').findOne({_id: new ObjectId(folderId)});
        folder.games.push(game);
        await db.collection('folders').updateOne({_id: new ObjectId(folderId)}, {$set: {games: folder.games}});
    }

    function RemoveGame(game) {

    }

    function addFoldertoDatabase() {

    }

    function updateDatabase() {
        //code to update folder in database

    }

    function deleteFolderFromDatabase() {
        //code to delete folder from database
    }
}
    */
import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema(
  {
    USER_ID: { type: Number, required: true, index: true },
    NAME: { type: String, required: true, trim: true },
    CREATED_DATE: { type: Date, default: Date.now },
  },
  { collection: "Folders" }
);

FolderSchema.index({ USER_ID: 1, NAME: 1 }, { unique: true });

export default mongoose.model("Folder", FolderSchema);
