from model.als_model import get_als_model

def train(interaction_matrix):
    """
    Train ALS recommender model using the provided interaction matrix.

    Args:
        interaction_matrix: items x users CSR matrix

    Returns:
        model: trained ALS model
    """

    model = get_als_model()

    # ALS expects users x items
    user_items = interaction_matrix.T.tocsr()
    model.fit(user_items)

    print("ALS model trained successfully.")
    print(f"User factors shape: {model.user_factors.shape}")
    print(f"Item factors shape: {model.item_factors.shape}")

    return model
