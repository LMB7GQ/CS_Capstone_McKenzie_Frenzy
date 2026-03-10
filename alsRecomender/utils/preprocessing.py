import pandas as pd
import numpy as np
from scipy.sparse import coo_matrix

# ---------------------------------------------------------
# Create interaction matrix (items x users)
# ---------------------------------------------------------
def create_interaction_matrix(df):
    """
    Build an items x users sparse matrix for implicit ALS.

    Returns:
        interaction_matrix (csr_matrix): items x users
        user_index_to_id (dict)
        item_index_to_id (dict)
    """

    unique_users = np.sort(df["user_id"].unique())
    unique_items = np.sort(df["item_id"].unique())

    # Maps
    user_id_to_idx = {uid: idx for idx, uid in enumerate(unique_users)}
    item_id_to_idx = {iid: idx for idx, iid in enumerate(unique_items)}

    # Rows = items, Cols = users
    rows = df["item_id"].map(item_id_to_idx).values
    cols = df["user_id"].map(user_id_to_idx).values
    data = df["hours_played"].values

    # Build items x users matrix
    interaction_matrix = coo_matrix(
        (data, (rows, cols)),
        shape=(len(unique_items), len(unique_users))
    ).tocsr()

    # Reverse lookup
    user_index_to_id = {idx: uid for uid, idx in user_id_to_idx.items()}
    item_index_to_id = {idx: iid for iid, idx in item_id_to_idx.items()}

    return interaction_matrix, user_index_to_id, item_index_to_id

