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

# ---------------------------
# Build Mongo URI   
# ---------------------------
uri = os.getenv("MONGO_URI") 

client = MongoClient(
    uri,
    serverSelectionTimeoutMS=10000,
)
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
    "default": 0.0,
    "wishlist": 1.0,
    "playing": 2.0,
    "completed": 3.0
}

def calculate_rating_adjustment(user_rating):
    """
    Convert user rating (1-6) to weight adjustment.
    Rating 6 is the default value that contributes 0 weight.
    """
    rating_adjustments = {
        1: -1.0,    # Very negative
        2: -0.5,    # Slightly negative
        3: 0.10,    # Neutral-positive
        4: 0.75,    # Positive
        5: 1.5,     # Very positive
        6: 0.0      # Default (no adjustment)
    }
    return rating_adjustments.get(user_rating, 0.0)

# ---------------------------
# Build interaction rows
# ---------------------------
csv_rows = []

for fg in foldergames_col.find({}, {"USER_ID": 1, "GAME_RAWG_ID": 1, "STATUS": 1, "_id": 0}):

    user = fg.get("USER_ID")
    game = fg.get("GAME_RAWG_ID")
    status = fg.get("STATUS", "default")  # default if missing
    Rating = fg.get("RATING",6)

    # Ensure user and game exist in our mappings
    if user in user_to_index and game in game_to_index:

        weight = status_weights.get(status.lower(), 1.0)

        if isinstance(Rating, (int, float)):
            rating_adjustment = calculate_rating_adjustment(int(Rating))
            weight += rating_adjustment
        
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

df["Interaction_score"] = df["Interaction_score"].apply(lambda x: max(0, x))


# ---------------------------
# Ensure users with zero interactions are present
# (adds a zero-scored row for any missing user so they appear in the items×users matrix)
# ---------------------------
all_user_indices = set(user_to_index.values())
present_user_indices = set(df["user_id"].unique()) if not df.empty else set()
missing_users = sorted(all_user_indices - present_user_indices)

if missing_users:
    # pick an existing item index to attach the zero-row; if no items, skip
    if len(index_to_game) > 0:
        default_item_idx = next(iter(index_to_game.keys()))
        filler_rows = [[u, default_item_idx, 0.0] for u in missing_users]
        filler_df = pd.DataFrame(filler_rows, columns=["user_id", "item_id", "Interaction_score"])
        df = pd.concat([df, filler_df], ignore_index=True)


# ---------------------------
# Calculate total interactions per user
# ---------------------------
user_interaction_counts = df.groupby("user_id").size().to_dict()


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
ALSStarter(df, index_to_game, user_interaction_counts)