import {ObjectId} from 'mongodb';
import {getDB} from '../config/db.js';
import Game from '../models/Game.js';

//Fishes the database and returns the game with teh given id
function getGameById(gameId) {

    //for now this function just tries to find games in the database.
    //I need to update it later to check if the game is in the database, and if not, fetch it from the RAWG API and then save it to the database before returning it.
    const db = getDB();
    return db.collection('games').findOne({_id: new ObjectId(gameId)});
}