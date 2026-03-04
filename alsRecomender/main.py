# main.py
import pandas as pd
from urllib.parse import quote_plus
from utils.recommendation_utils import recommend_top_items
from pymongo import MongoClient, errors
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

USE_MONGO = False   # ← switch this to True when you want MongoDB

df_recommendations = pd.DataFrame(
    recommendations,
    columns=["user_id", "top_10_items"]
)

if not USE_MONGO:
    # -------------------------
    # Save as CSV
    # -------------------------
    df_recommendations.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved top 10 recommendations for {len(recommendations)} users → {OUTPUT_CSV}")

else:
    # -------------------------
    # Save to MongoDB
    # -------------------------
    try:
        username = quote_plus("DBUSERNAME")
        password = quote_plus("DBPASSWORD")

        uri = f"mongodb+srv://{username}:{password}@capstoneproject.bsi5mti.mongodb.net/?appName=CapstoneProject"

        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        
        # Force connection test
        client.server_info()
        print("✅ Connected to MongoDB")

        db = client["Capstone"]
        collection = db["user_recommendations"]

         # Optional: clear old recommendations
        collection.delete_many({})

        # Prepare documents
        documents = [
            {
                "user_id": int(user_id),
                "top_10_items": top_items
            }
            for user_id, top_items in recommendations
        ]

        if documents:
            collection.insert_many(documents)
            collection.create_index("user_id", unique=True)
            print(f"✅ Saved {len(documents)} users to MongoDB")
        else:
            print("⚠️ No documents to insert")

        client.close()

    except errors.ServerSelectionTimeoutError:
        print("❌ Could not connect to MongoDB server.")
        print("   Make sure Mongo is running or check your connection string.")

    except errors.DuplicateKeyError:
        print("❌ Duplicate user_id detected (unique index violation).")

    except errors.PyMongoError as e:
        print(f"❌ MongoDB error: {e}")
