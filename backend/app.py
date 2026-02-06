from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os

app = Flask(__name__)
CORS(app)

# ---------- Load RL model ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "reinforcement.pkl")

with open(MODEL_PATH, "rb") as f:
    Q = pickle.load(f)

ACTIONS = {0: "HOLD", 1: "BUY", 2: "SELL"}

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    # Common input
    holding = int(data["holding"])

    # Decide source
    if data["mode"] == "manual":
        prev_price = float(data["prev_price"])
        curr_price = float(data["curr_price"])

    elif data["mode"] == "csv":
        prices = data["close_prices"]
        prev_price = float(prices[-2])
        curr_price = float(prices[-1])

    else:
        return jsonify({"error": "Invalid mode"}), 400

    # Price trend
    if curr_price > prev_price:
        price_trend = 1
    elif curr_price < prev_price:
        price_trend = -1
    else:
        price_trend = 0

    state = (price_trend, holding)

    # Action masking
    if holding == 0:
        allowed_actions = [0, 1]   # HOLD, BUY
    else:
        allowed_actions = [0, 2]   # HOLD, SELL

    q_values = Q[state]
    best_action = max(allowed_actions, key=lambda a: q_values[a])

    return jsonify({
        "previous_price": prev_price,
        "current_price": curr_price,
        "price_trend": price_trend,
        "holding": holding,
        "decision": ACTIONS[best_action],
        "allowed_actions": [ACTIONS[a] for a in allowed_actions],
        "model": "Reinforcement Learning (Q-Learning)"
    })

if __name__ == "__main__":
    app.run(debug=True)
