from pymongo import MongoClient
import pandas as pd
from urllib.parse import quote_plus
import os
from dotenv import load_dotenv
import numpy as np
from ALS import ALSStarter


load_dotenv()  # Load environment variables from .env file

username = quote_plus(os.getenv("DBUSERNAME"))  # encode special chars
password = quote_plus(os.getenv("DBPASSWORD"))  # encode special chars
cluster = os.getenv("DATABASE")                 # just host
dbname = os.getenv("DBNAME")                    # your database inside the cluster

# Build URI
uri = f"mongodb+srv://{username}:{password}@{cluster}/{dbname}?retryWrites=true&w=majority" 

client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        
print("✅ Connected to MongoDB")

db = client["Capstone"]
users_col = db["Users"]
games_col = db["Games"]
foldergames_col = db["FolderGames"]


user_ids = [u["ID"] for u in users_col.find({}, {"ID": 1, "_id": 0})]
game_ids = [g["rawgId"] for g in games_col.find({}, {"rawgId": 1, "_id": 0})]

# Map IDs to indices for CSV (0-indexed)
user_to_index = {uid: i for i, uid in enumerate(user_ids)}
game_to_index = {gid: i for i, gid in enumerate(game_ids)}

# ---------------------------
# Status weights
# ---------------------------
status_weights = {
    "wishlist": 1.0,
    "playing": 2.0,
    "completed": 3.0
}

# ---------------------------
# Prepare rows for CSV
# ---------------------------
csv_rows = []

for fg in foldergames_col.find({}, {"USER_ID": 1, "GAME_RAWG_ID": 1, "STATUS": 1, "_id": 0}):
    user = fg.get("USER_ID")
    game = fg.get("GAME_RAWG_ID")
    status = fg.get("STATUS", "wishlist")  # default to wishlist if missing
    
    if user in user_to_index and game in game_to_index:
        weight = status_weights.get(status.lower(), 1.0)  # fallback to 1.0
        csv_rows.append([user_to_index[user], game_to_index[game], weight])

# ---------------------------
# Convert to DataFrame
# ---------------------------
df = pd.DataFrame(csv_rows, columns=["user_id", "item_id", "Interaction_score"])

# ---------------------------
# Aggregate duplicates (sum weights)
# ---------------------------
df = df.groupby(["user_id", "item_id"], as_index=False).sum()



# ---------------------------
# Created csv 
# ---------------------------
ALSStarter(df)