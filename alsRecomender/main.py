# main.py
import pandas as pd
from utils.recommendation_utils import recommend_top_items
from model.train import train
from utils.preprocessing import create_interaction_matrix
from utils.data_loader import load_data

CSV_PATH = "alsRecomender/data/data.csv"

# -------------------------
# Load data
# -------------------------
df = load_data(CSV_PATH)

# -------------------------
# Create interaction matrix (items x users)
# -------------------------
interaction_matrix, user_index_to_id, item_index_to_id = create_interaction_matrix(df)

# Build reverse mapping: raw user_id -> ALS internal index
user_id_to_index = {uid: idx for idx, uid in user_index_to_id.items()}

# -------------------------
# Train ALS model using THIS SAME MATRIX
# -------------------------
als_model = train(interaction_matrix)

print("Model thinks num_users =", als_model.user_factors.shape[0])
print("Matrix num_users =", interaction_matrix.shape[1])

# -------------------------
# Recommend top 3 items for each user
# -------------------------
for user_idx, user_id in user_index_to_id.items():
    # Get top 3 recommendations
    top_items = recommend_top_items(
        model=als_model,
        user_idx=user_idx,
        interaction_matrix=interaction_matrix,  # fixed variable
        item_index_to_id=item_index_to_id,
        N=3
    )

    # Ensure everything is Python int for clean printing
    if top_items is not None:
        top_items = [int(i) for i in top_items]

    print(f"User {user_id} recommended: {top_items}")
