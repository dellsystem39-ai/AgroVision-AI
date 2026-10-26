from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import os
import requests

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
ML_DIR = os.path.join(PROJECT_DIR, "ml")
DATA_DIR = os.path.join(PROJECT_DIR, "data")

os.makedirs(ML_DIR, exist_ok=True)

pipeline_path = os.path.join(ML_DIR, "pipeline_small.pkl")
MODEL_URL = (
    "https://huggingface.co/agrovisionai2026/"
    "agrovision-ai-model/resolve/main/pipeline_small.pkl"
)

def download_pipeline():
    if os.path.isfile(pipeline_path):
        print("Local small ML pipeline found.")
        return

    print("Downloading small ML pipeline from Hugging Face...")
    temporary_path = pipeline_path + ".download"

    try:
        with requests.get(
            MODEL_URL,
            stream=True,
            timeout=(30, 180),
            allow_redirects=True
        ) as response:
            response.raise_for_status()
            with open(temporary_path, "wb") as model_file:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        model_file.write(chunk)

        if not os.path.isfile(temporary_path) or os.path.getsize(temporary_path) == 0:
            raise RuntimeError("Downloaded model file is empty or missing.")

        os.replace(temporary_path, pipeline_path)
        print("Small ML pipeline downloaded successfully.")

    except Exception:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)
        raise

try:
    download_pipeline()
    pipeline = joblib.load(pipeline_path)
    model = pipeline["model"]
    encoder = pipeline["encoder"]
    print("Small ML pipeline loaded successfully.")
except Exception:
    app.logger.exception("Could not download or load ML pipeline.")
    model = None
    encoder = None

data_path = os.path.join(DATA_DIR, "crop_prices.csv")

try:
    df = pd.read_csv(data_path)
    print("Dataset loaded successfully. Total records:", len(df))
except Exception:
    app.logger.exception("Could not load crop_prices.csv.")
    df = pd.DataFrame()

if not df.empty:
    required_columns = [
        "Date", "Crop", "State", "District", "Market", "Modal_Price"
    ]

    if all(column in df.columns for column in required_columns):
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

        for column in ["Crop", "State", "District", "Market"]:
            df[column] = df[column].astype(str).str.strip()

        df["Modal_Price"] = pd.to_numeric(df["Modal_Price"], errors="coerce")
        df = df.dropna(subset=required_columns)
        df = df.sort_values(
            ["Crop", "State", "District", "Market", "Date"]
        ).reset_index(drop=True)
    else:
        app.logger.error("Dataset is missing required columns.")
        df = pd.DataFrame()

@app.route("/")
def home():
    return jsonify({
        "message": "AgroVision AI Backend is running!",
        "status": "success"
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if model is None or encoder is None:
            return jsonify({
                "status": "error",
                "message": "ML model could not be loaded."
            }), 500

        if df.empty:
            return jsonify({
                "status": "error",
                "message": "Dataset could not be loaded."
            }), 500

        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "status": "error",
                "message": "No prediction data received."
            }), 400

        crop = data.get("crop")
        state = data.get("state")
        district = data.get("district")
        market = data.get("market")
        date_input = data.get("date")

        if not all([crop, state, district, market, date_input]):
            return jsonify({
                "status": "error",
                "message": "Crop, state, district, market and date are required."
            }), 400

        prediction_date = pd.to_datetime(date_input, errors="coerce")
        if pd.isna(prediction_date):
            return jsonify({
                "status": "error",
                "message": "Invalid prediction date."
            }), 400

        historical = df[
            (df["Crop"] == crop) &
            (df["State"] == state) &
            (df["District"] == district) &
            (df["Market"] == market) &
            (df["Date"] < prediction_date)
        ].sort_values("Date")

        if len(historical) < 7:
            return jsonify({
                "status": "error",
                "message": "At least 7 previous records are required."
            }), 400

        previous_price = float(historical.iloc[-1]["Modal_Price"])
        previous_3_day_avg = float(historical.tail(3)["Modal_Price"].mean())
        previous_7_day_avg = float(historical.tail(7)["Modal_Price"].mean())

        categorical_features = ["Crop", "State", "District", "Market"]
        numerical_features = [
            "Year", "Month", "Day", "Day_of_Week",
            "Previous_Price", "Previous_3_Day_Avg", "Previous_7_Day_Avg"
        ]

        categorical_data = pd.DataFrame({
            "Crop": [crop],
            "State": [state],
            "District": [district],
            "Market": [market]
        })

        encoded_data = encoder.transform(categorical_data[categorical_features])

        numerical_data = np.array([[
            prediction_date.year,
            prediction_date.month,
            prediction_date.day,
            prediction_date.dayofweek,
            previous_price,
            previous_3_day_avg,
            previous_7_day_avg
        ]], dtype=np.float32)

        final_input = np.hstack([
            numerical_data,
            np.asarray(encoded_data, dtype=np.float32)
        ]).astype(np.float32, copy=False)

        predicted_price = float(model.predict(final_input)[0])

        return jsonify({
            "status": "success",
            "crop": crop,
            "state": state,
            "district": district,
            "market": market,
            "date": date_input,
            "previous_price": round(previous_price, 2),
            "previous_3_day_average": round(previous_3_day_avg, 2),
            "previous_7_day_average": round(previous_7_day_avg, 2),
            "predicted_modal_price": round(predicted_price, 2)
        })

    except Exception as e:
        app.logger.exception("Prediction error")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
