import pandas as pd
# ---------------------------------------------------------
# Load CSV
# ---------------------------------------------------------
def load_data(csv_path):
    """
    Load CSV file with columns: user_id, item_id, hours_played
    """
    return pd.read_csv(csv_path)
