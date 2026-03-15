import {MongoClient} from 'mongodb';


const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db; 

async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db("Capstone");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

async function disconnectFromDatabase() {
    try {
        await client.close();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error disconnecting from MongoDB:", error);
    }
}

export function getDB() {
    if(!db) {
        throw new Error("Database not connected. Call connectToDatabase first.");
    }
    return db;
}