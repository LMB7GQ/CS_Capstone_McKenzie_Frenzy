import pandas as pd
import numpy as np
from scipy.sparse import coo_matrix

# ---------------------------------------------------------
# Recommend top item for a user
# ---------------------------------------------------------
def recommend_top_items(model, user_idx, interaction_matrix, item_index_to_id, N=3):
    """
    Recommend top N items for a given user index.
    Works with all implicit return formats.
    """

    # items x users → users x items
    user_items = interaction_matrix.T.tocsr()
    user_row = user_items[user_idx]

    recommendations = model.recommend(
        userid=user_idx,
        user_items=user_row,
        N=N,
        filter_already_liked_items=True,
        recalculate_user=True
    )

    # -------------------------
    # Handle return formats
    # -------------------------

    # Case 1: (item_ids_array, scores_array)
    if isinstance(recommendations, tuple):
        item_ids = recommendations[0]
    else:
        # Case 2: list of (item_id, score)
        item_ids = []
        for rec in recommendations:
            if isinstance(rec, tuple):
                item_ids.append(rec[0])
            else:
                item_ids.append(rec)

    # Convert safely to Python ints
    item_ids = [int(i) for i in item_ids]

    # Map back to original IDs
    return [item_index_to_id[i] for i in item_ids]
