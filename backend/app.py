from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import requests


# =========================================================
# CREATE FLASK APP
# =========================================================

app = Flask(__name__)
CORS(app)

# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PROJECT_DIR = os.path.dirname(BASE_DIR)
ML_DIR = os.path.join(PROJECT_DIR, "ml")
DATA_DIR = os.path.join(PROJECT_DIR, "data")

os.makedirs(ML_DIR, exist_ok=True)


# =========================================================
# DOWNLOAD ML PIPELINE FROM HUGGING FACE IF NEEDED
# =========================================================

pipeline_path = os.path.join(
    ML_DIR,
    "pipeline.pkl"
)

MODEL_URL = (
    "https://huggingface.co/agrovisionai2026/"
    "agrovision-ai-model/resolve/main/pipeline_small.pkl"
)

def download_pipeline():
    if os.path.isfile(pipeline_path):
        print("Local small ML pipeline found.")
        return

    print("Downloading ML pipeline from Hugging Face...")
    print("The model is large, so this may take several minutes.")

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

                for chunk in response.iter_content(
                    chunk_size=1024 * 1024
                ):
                    if chunk:
                        model_file.write(chunk)

        if os.path.getsize(temporary_path) == 0:
            raise RuntimeError("Downloaded model file is empty.")

        os.replace(temporary_path, pipeline_path)
        print("Small ML pipeline downloaded successfully.")

    except Exception:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)
        raise

try:
    download_pipeline()

    pipeline = joblib.load(
        pipeline_path
    )

    model = pipeline["model"]
    encoder = pipeline["encoder"]

    print("ML pipeline loaded successfully.")

except Exception as e:

    print("ERROR: Could not download or load ML pipeline.")
    print(str(e))

    pipeline = None
    model = None
    encoder = None


# =========================================================
# LOAD DATASET
# =========================================================

data_path = os.path.join(
    DATA_DIR,
    "crop_prices.csv"
)

try:

    df = pd.read_csv(
        data_path
    )

    print("Dataset loaded successfully.")
    print(f"Total records: {len(df)}")

except Exception as e:

    print("ERROR: Could not load crop_prices.csv.")
    print(str(e))

    df = pd.DataFrame()

if not df.empty:
    required_columns = [
        "Date", "Crop", "State", "District", "Market", "Modal_Price"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        print(
            "ERROR: Dataset is missing columns:",
            missing_columns
        )

        df = pd.DataFrame()

    else:

        # Convert date
        df["Date"] = pd.to_datetime(
            df["Date"],
            errors="coerce"
        )

        # Clean text columns
        text_columns = [
            "Crop",
            "State",
            "District",
            "Market"
        ]

        for column in text_columns:

            df[column] = (
                df[column]
                .astype(str)
                .str.strip()
            )

        # Convert modal price
        df["Modal_Price"] = pd.to_numeric(
            df["Modal_Price"],
            errors="coerce"
        )

        # Remove invalid rows
        df = df.dropna(
            subset=required_columns
        )

        # Sort records
        group_columns = [
            "Crop",
            "State",
            "District",
            "Market"
        ]

        df = df.sort_values(
            group_columns + ["Date"]
        ).reset_index(
            drop=True
        )


# =========================================================
# HOME API
# =========================================================

@app.route("/")
def home():
    return jsonify({
        "message": "AgroVision AI Backend is running!",
        "status": "success"
    })


# =========================================================
# PREDICTION API
# =========================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():
    try:

        # Check ML model
        if model is None or encoder is None:
            return jsonify({
                "status": "error",
                "message": "ML model could not be loaded."
            }), 500

        # Check dataset
        if df.empty:
            return jsonify({
                "status": "error",
                "message": "Dataset could not be loaded."
            }), 500

        # Get request data
        data = request.get_json(
            silent=True
        )

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

        # Check required inputs
        if not all([
            crop,
            state,
            district,
            market,
            date_input
        ]):

            return jsonify({
                "status": "error",
                "message": "Crop, state, district, market and date are required."
            }), 400

        # Convert date
        prediction_date = pd.to_datetime(
            date_input,
            errors="coerce"
        )

        if pd.isna(prediction_date):
            return jsonify({
                "status": "error",
                "message": "Invalid prediction date."
            }), 400

        # Check historical data
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

        # Historical price features
        previous_price = (
            historical.iloc[-1]["Modal_Price"]
        )

        previous_3_day_avg = (
            historical
            .tail(3)["Modal_Price"]
            .mean()
        )

        previous_7_day_avg = (
            historical
            .tail(7)["Modal_Price"]
            .mean()
        )

        # Date features
        year = prediction_date.year
        month = prediction_date.month
        day = prediction_date.day
        day_of_week = prediction_date.dayofweek

        # Create input data
        input_data = pd.DataFrame({

            "Crop": [crop],
            "State": [state],
            "District": [district],
            "Market": [market],

            "Year": [year],
            "Month": [month],
            "Day": [day],
            "Day_of_Week": [day_of_week],

            "Previous_Price": [
                previous_price
            ],

            "Previous_3_Day_Avg": [
                previous_3_day_avg
            ],

            "Previous_7_Day_Avg": [
                previous_7_day_avg
            ]

        })

        # Encode categorical features
        categorical_features = [
            "Crop",
            "State",
            "District",
            "Market"
        ]

        numerical_features = [
            "Year",
            "Month",
            "Day",
            "Day_of_Week",
            "Previous_Price",
            "Previous_3_Day_Avg",
            "Previous_7_Day_Avg"
        ]

        encoded_data = encoder.transform(
            input_data[categorical_features]
        )

        encoded_df = pd.DataFrame(
            encoded_data,
            columns=encoder.get_feature_names_out(
                categorical_features
            )
        )

        # Combine features
        final_input = pd.concat(
            [
                input_data[numerical_features].reset_index(
                    drop=True
                ),
                encoded_df.reset_index(
                    drop=True
                )
            ],
            axis=1
        )

        # Make ML prediction
        prediction = model.predict(
            final_input.values
        )

        predicted_price = float(
            prediction[0]
        )

        # Return result
        return jsonify({
            "status": "success",
            "crop": crop,
            "state": state,
            "district": district,
            "market": market,
            "date": date_input,

            "previous_price": round(
                float(previous_price),
                2
            ),

            "previous_3_day_average": round(
                float(previous_3_day_avg),
                2
            ),

            "previous_7_day_average": round(
                float(previous_7_day_avg),
                2
            ),

            "predicted_modal_price": round(
                predicted_price,
                2
            )

        })

    except Exception as e:

        app.logger.exception(
            "Prediction error"
        )

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
