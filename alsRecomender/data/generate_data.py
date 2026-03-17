import random
import csv
import os

NUM_USERS = 100
NUM_ITEMS = 1000
OUTPUT_FILE = "alsRecomender/data/data.csv"

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

rows = []

for user_id in range(NUM_USERS):
    for item_id in range(NUM_ITEMS):
        roll = random.random()

        if roll < 0.94:
            continue  # DO NOT write zeros

        elif roll < 0.97:
            hours_played = round(random.uniform(0.5, 5), 2)

        elif roll < 0.99:
            hours_played = round(random.uniform(5, 700), 2)

        else:
            hours_played = round(random.uniform(40, 3000), 2)

        rows.append([user_id, item_id, hours_played])

with open(OUTPUT_FILE, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["user_id", "item_id", "hours_played"])
    writer.writerows(rows)

print(f"Generated {len(rows)} NON-ZERO interactions → {OUTPUT_FILE}")
