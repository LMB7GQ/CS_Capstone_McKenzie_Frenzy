import pandas as pd

num_users = 30
rows = []

# ----------------------
# CLUSTER 1 (Users 0–9)
# Games 0–4
# ----------------------
for user in range(0, 10):
    cluster_games = [0, 1, 2, 3, 4]
    missing_game = cluster_games[user % 5]

    for game in cluster_games:
        if game != missing_game:
            rows.append((user, game, 1000))


# ----------------------
# CLUSTER 2 (Users 10–19)
# Games 50–54
# ----------------------
for user in range(10, 20):
    cluster_games = [50, 51, 52, 53, 54]
    missing_game = cluster_games[user % 5]

    for game in cluster_games:
        if game != missing_game:
            rows.append((user, game, 1000))


# ----------------------
# CLUSTER 3 (Users 20–29)
# Games 100–104
# ----------------------
for user in range(20, 30):
    cluster_games = [100, 101, 102, 103, 104]
    missing_game = cluster_games[user % 5]

    for game in cluster_games:
        if game != missing_game:
            rows.append((user, game, 1000))


df = pd.DataFrame(rows, columns=["user_id", "item_id", "hours_played"])
df.to_csv("alsRecomender\data\data.csv", index=False)

print("Super obvious dataset created!")
print(df.head(20))

