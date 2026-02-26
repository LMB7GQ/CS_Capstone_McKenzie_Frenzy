# main.py
import pandas as pd
from utils.recommendation_utils import recommend_top_items
from model.train import train
from utils.preprocessing import create_interaction_matrix
from utils.data_loader import load_data

CSV_PATH = "alsRecomender/data/data.csv"
OUTPUT_CSV = "alsRecomender/data/top10_recommendations.csv"

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
# Recommend top 10 items for each user and store in a DataFrame
# -------------------------
recommendations = []

for user_idx, user_id in user_index_to_id.items():
    top_items = recommend_top_items(
        model=als_model,
        user_idx=user_idx,
        interaction_matrix=interaction_matrix,
        item_index_to_id=item_index_to_id,
        N=10
    )
    if top_items is not None:
        # Make sure they are Python ints
        top_items = [int(i) for i in top_items]
    else:
        top_items = []

    recommendations.append([user_id, top_items])

# Save as CSV (top_10_items stored as a stringified list)
df_recommendations = pd.DataFrame(recommendations, columns=["user_id", "top_10_items"])
df_recommendations.to_csv(OUTPUT_CSV, index=False)

print(f"Saved top 10 recommendations for {len(recommendations)} users → {OUTPUT_CSV}")