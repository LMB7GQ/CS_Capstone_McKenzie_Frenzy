from pymongo import MongoClient
import pandas as pd
from urllib.parse import quote_plus
import os
from dotenv import load_dotenv
import numpy as np
from ALS import ALSStarter


# ---------------------------
# Load environment variables
# ---------------------------
load_dotenv()

username = quote_plus(os.getenv("DBUSERNAME"))
password = quote_plus(os.getenv("DBPASSWORD"))
cluster = os.getenv("DATABASE")
dbname = os.getenv("DBNAME")

# ---------------------------
# Build Mongo URI
# ---------------------------
uri = f"mongodb+srv://{username}:{password}@{cluster}/{dbname}?retryWrites=true&w=majority"

client = MongoClient(uri, serverSelectionTimeoutMS=5000)

print("✅ Connected to MongoDB")

# ---------------------------
# Collections
# ---------------------------
db = client["Capstone"]
users_col = db["Users"]
games_col = db["Games"]
foldergames_col = db["FolderGames"]


# ---------------------------
# Load IDs from MongoDB
# ---------------------------
user_ids = [u["ID"] for u in users_col.find({}, {"ID": 1, "_id": 0})]
game_ids = [g["rawgId"] for g in games_col.find({}, {"rawgId": 1, "_id": 0})]


# ---------------------------
# Map IDs to indices (required for ALS)
# ---------------------------
user_to_index = {uid: i for i, uid in enumerate(user_ids)}
game_to_index = {gid: i for i, gid in enumerate(game_ids)}

# Reverse mappings (important for recovering RAWG IDs later)
index_to_user = {i: uid for uid, i in user_to_index.items()}
index_to_game = {i: gid for gid, i in game_to_index.items()}


# ---------------------------
# Status weights
# ---------------------------
status_weights = {
    "wishlist": 1.0,
    "playing": 2.0,
    "completed": 3.0
}


# ---------------------------
# Build interaction rows
# ---------------------------
csv_rows = []

for fg in foldergames_col.find({}, {"USER_ID": 1, "GAME_RAWG_ID": 1, "STATUS": 1, "_id": 0}):

    user = fg.get("USER_ID")
    game = fg.get("GAME_RAWG_ID")
    status = fg.get("STATUS", "wishlist")  # default if missing

    # Ensure user and game exist in our mappings
    if user in user_to_index and game in game_to_index:

        weight = status_weights.get(status.lower(), 1.0)

        csv_rows.append([
            user_to_index[user],
            game_to_index[game],
            weight
        ])


# ---------------------------
# Convert to DataFrame
# ---------------------------
df = pd.DataFrame(
    csv_rows,
    columns=["user_id", "item_id", "Interaction_score"]
)


# ---------------------------
# Aggregate duplicates
# ---------------------------
df = df.groupby(["user_id", "item_id"], as_index=False).sum()

df["Interaction_score"] = df["Interaction_score"].astype(float)


# ---------------------------
# Optional: Save mappings
# ---------------------------
game_map_df = pd.DataFrame({
    "item_id": list(index_to_game.keys()),
    "rawgId": list(index_to_game.values())
})

user_map_df = pd.DataFrame({
    "user_id": list(index_to_user.keys()),
    "USER_ID": list(index_to_user.values())
})

# Uncomment if you want files
# game_map_df.to_csv("game_index_map.csv", index=False)
# user_map_df.to_csv("user_index_map.csv", index=False)


# ---------------------------
# Run ALS
# ---------------------------
ALSStarter(df, index_to_game)