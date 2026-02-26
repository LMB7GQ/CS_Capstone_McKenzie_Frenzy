"""
Defines the ALS model configuration.

Keeping this separate makes it easy to:
- Tune hyperparameters
- Swap algorithms later
"""

from implicit.als import AlternatingLeastSquares

def get_als_model():
    """
    Create and return an ALS recommender model.
    """

    model = AlternatingLeastSquares(
    factors=7,       # number of latent dimensions
    regularization=0.25,
    iterations=25  # way higher than default (usually 15)
    )   
    
    return model
