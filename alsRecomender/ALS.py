# main.py
import pandas as pd
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus
from utils.recommendation_utils import recommend_top_items
from pymongo import MongoClient, errors
from model.train import train
from utils.preprocessing import create_interaction_matrix
from utils.data_loader import load_data


def ALSStarter(df, index_to_game, user_interaction_counts):
    load_dotenv()  # Load environment variables from .env file
    CSV_PATH = "alsRecomender/data/user_game_interactions_weighted.csv"
    OUTPUT_CSV = "alsRecomender/data/top10_recommendations.csv"
    PRESET_RAWG_IDS = [28, 3498, 3328, 13537, 58175, 3192, 2551, 326243, 28154, 13627]
    INTERACTION_THRESHOLD = 3

    # -------------------------
    # Create interaction matrix (items x users)
    # -------------------------
    interaction_matrix, user_index_to_id, item_index_to_id = create_interaction_matrix(df)

    # Build reverse mapping: raw user_id -> ALS internal index
    user_id_to_index = {uid: idx for idx, uid in user_index_to_id.items()}

    # Train ALS model
    # -------------------------
    als_model = train(interaction_matrix)

    print("Model thinks num_users =", als_model.user_factors.shape[0])
    print("Matrix num_users =", interaction_matrix.shape[1])

    # -------------------------
    # Recommend top 10 items
    # -------------------------
    recommendations = []
    preset_user_count = 0

    for user_idx, user_id in user_index_to_id.items():
        # Check if user has fewer than threshold interactions
        total_interactions = user_interaction_counts.get(user_idx, 0)
        
        if total_interactions < INTERACTION_THRESHOLD:
            # User has too few interactions — use preset recommendations
            rawg_ids = PRESET_RAWG_IDS
            preset_user_count += 1
        else:
            # User has enough interactions — use ALS recommendations
            top_items = recommend_top_items(
                model=als_model,
                user_idx=user_idx,
                interaction_matrix=interaction_matrix,
                item_index_to_id=item_index_to_id,
                N=10
            )

            if top_items is not None:
                # Convert ALS item indices -> RAWG IDs
                rawg_ids = [int(index_to_game[i]) for i in top_items if i in index_to_game]
            else:
                # Fallback to preset if ALS returns None
                rawg_ids = PRESET_RAWG_IDS

        recommendations.append([user_id, rawg_ids])

    USE_MONGO = True

    df_recommendations = pd.DataFrame(
        recommendations,
        columns=["user_id", "top_10_items"]
    )

    if not USE_MONGO:
        df_recommendations.to_csv(OUTPUT_CSV, index=False)
        print(f"Saved top 10 recommendations for {len(recommendations)} users → {OUTPUT_CSV}")

    else:
        try:
            username = quote_plus(os.getenv("DBUSERNAME"))
            password = quote_plus(os.getenv("DBPASSWORD"))
            cluster = os.getenv("DATABASE")
            dbname = os.getenv("DBNAME")

            uri = f"mongodb+srv://{username}:{password}@{cluster}/{dbname}?retryWrites=true&w=majority"
            client = MongoClient(uri, serverSelectionTimeoutMS=5000)

            client.server_info()
            print("✅ Connected to MongoDB")

            db = client["Capstone"]
            collection = db["user_recommendations"]

            collection.delete_many({})

            documents = [
                {
                    "user_id": int(user_id),
                    "top_10_items": rawg_ids
                }
                for user_id, rawg_ids in recommendations
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

