from pymongo import MongoClient
import pandas as pd
from urllib.parse import quote_plus


username = quote_plus("DBUSERNAME")
password = quote_plus("DBPASSWORD")

uri = f"mongodb+srv://{username}:{password}@capstoneproject.bsi5mti.mongodb.net/?appName=CapstoneProject"

client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        
print("✅ Connected to MongoDB")

db = client["Capstone"]
Usercollection = db["Users"]
Tablecollection = db["UserInteractionTable"]





interaction_table
Tablecollection.delete_many({})
Tablecollection.insert_many(interaction_table)