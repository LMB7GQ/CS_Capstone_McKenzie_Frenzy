const {MongoClient} = require('mongodb');
const uri = mongodb+srv://<db_username>:<db_password>@capstoneproject.bsi5mti.mongodb.net/?appName=CapstoneProject

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
    
    function addGame(game) {
        this.#games.push(game);
    }

    function RemoveGame(game) {

    }

    function addFoldertoDatabase() {

    }

    function updateDatabase() {
        //code to update folder in database
    }
}