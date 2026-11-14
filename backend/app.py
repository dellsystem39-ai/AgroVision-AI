from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import requests
import psycopg
from werkzeug.security import generate_password_hash, check_password_hash
from argon2 import PasswordHasher
from itsdangerous import URLSafeTimedSerializer


# =========================================================
# CREATE FLASK APP
# =========================================================

app = Flask(__name__)
CORS(app)

DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "agrovision_db",
    "user": "postgres",
    "password": os.environ.get("DB_PASSWORD", "")
}

def get_db_connection():
    database_url = os.environ.get("DATABASE_URL")

    if database_url:
        return psycopg.connect(database_url, connect_timeout=3)

    return psycopg.connect(**DATABASE_CONFIG, connect_timeout=3)

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
    "historical_mandi_prices_clean.csv"
)

try:
  df = pd.read_csv(data_path).rename(columns={"date": "Date", "commodity": "Crop", "state": "State", "district": "District", "market": "Market", "modal_price": "Modal_Price"})

  print("Dataset loaded successfully.")
  print(f"Total records: {len(df)}")

except Exception as e:

    print("ERROR: Could not load crop_prices.csv.")
    print(str(e))

    df = pd.DataFrame()

history_group_indices = {}

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

        # Build a one-time index for faster historical lookups
        history_group_indices = {
            key: positions
            for key, positions in
            df.groupby(group_columns, sort=False).indices.items()
        }
# =========================================================

# =========================================================
# =========================================================
# OPTIONS API - CASCADING LOCATION AND CROP FILTERS
# =========================================================

@app.route("/options", methods=["GET"])
def get_options():
    try:
        if df.empty:
            return jsonify({
                "states": [],
                "districts": [],
                "markets": [],
                "crops": [],
                "coverage": None
            })

        state = request.args.get("state", "").strip()
        district = request.args.get("district", "").strip()
        market = request.args.get("market", "").strip()

        states = sorted(df["State"].dropna().astype(str).unique().tolist())

        state_data = df.iloc[0:0]
        if state:
            state_data = df[
                df["State"].astype(str).str.strip().str.casefold()
                == state.casefold()
            ]

        districts = sorted(
            state_data["District"].dropna().astype(str).unique().tolist()
        )

        district_data = state_data.iloc[0:0]
        if district:
            district_data = state_data[
                state_data["District"].astype(str).str.strip().str.casefold()
                == district.casefold()
            ]

        markets = sorted(
            district_data["Market"].dropna().astype(str).unique().tolist()
        )

        market_data = district_data.iloc[0:0]
        if market:
            market_data = district_data[
                district_data["Market"].astype(str).str.strip().str.casefold()
                == market.casefold()
            ]

        crop_counts = market_data["Crop"].dropna().astype(str).value_counts()
        crops = sorted(crop_counts[crop_counts >= 7].index.tolist())

        return jsonify({
            "states": states,
            "districts": districts,
            "markets": markets,
            "crops": crops,
            "coverage": None
        })

    except Exception:
        app.logger.exception("Options API failed")
        return jsonify({"error": "Could not load options"}), 500

# =========================================================# HOME API
# =========================================================


# =========================================================
# AGROVISION AUTH API
# =========================================================

AUTH_SECRET = os.environ.get("AGROVISION_SECRET_KEY")
if not AUTH_SECRET:
    raise RuntimeError("AGROVISION_SECRET_KEY environment variable is required")

token_serializer = URLSafeTimedSerializer(AUTH_SECRET)

@app.route("/auth/signup", methods=["POST"])
def auth_signup():
    data = request.get_json(silent=True) or {}

    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip() or None
    password = data.get("password") or ""

    if not full_name or not email or not password:
        return jsonify({"detail": "Name, email and password are required."}), 400

    if len(password) < 8:
        return jsonify({"detail": "Password must contain at least 8 characters."}), 400

    if len(email) > 255 or len(full_name) > 255:
        return jsonify({"detail": "Name or email is too long."}), 400

    password_hash = generate_password_hash(password)

    try:
        with get_db_connection() as conn:
            user = conn.execute(
                """
                INSERT INTO users
                    (full_name, email, phone, role, password_hash)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, full_name, email, phone, role
                """,
                (full_name, email, phone, "farmer", password_hash)
            ).fetchone()

        return jsonify({
            "message": "Account created successfully.",
            "user": {
                "id": user[0],
                "full_name": user[1],
                "email": user[2],
                "phone": user[3],
                "role": user[4]
            }
        }), 201

    except psycopg.errors.UniqueViolation:
        return jsonify({"detail": "An account with this email already exists."}), 409

    except Exception:
        app.logger.exception("Signup failed")
        return jsonify({"detail": "Unable to create account. Please try again."}), 500


@app.route("/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"detail": "Email and password are required."}), 400

    try:
        with get_db_connection() as conn:
            user = conn.execute(
                """
                SELECT id, full_name, email, phone, role, password_hash
                FROM users
                WHERE email = %s
                """,
                (email,)
            ).fetchone()

        if not user:
            return jsonify({"detail": "Invalid email or password."}), 401

        stored_hash = user[5] or ""
        if stored_hash.startswith("$argon2"):
            try:
                password_valid = PasswordHasher().verify(stored_hash, password)
            except Exception:
                password_valid = False
        else:
            password_valid = check_password_hash(stored_hash, password)

        if not password_valid:
            return jsonify({"detail": "Invalid email or password."}), 401

        access_token = token_serializer.dumps({
            "user_id": user[0],
            "email": user[2]
        })

        return jsonify({
            "access_token": access_token,
            "token_type": "Bearer",
            "user": {
                "id": user[0],
                "full_name": user[1],
                "email": user[2],
                "phone": user[3],
                "role": user[4]
            }
        }), 200

    except Exception:
        import traceback
        error_text = traceback.format_exc()
        app.logger.error("Login failed:\n%s", error_text)
        error_path = os.path.join(os.path.dirname(__file__), "login_error.log")
        with open(error_path, "a", encoding="utf-8") as error_file:
            error_file.write("\n--- LOGIN ERROR ---\n" + error_text + "\n")
        return jsonify({"detail": "Unable to sign in. Please try again."}), 500

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
        date_input = data.get("date") or pd.Timestamp.today().strftime("%Y-%m-%d")
        pd.Timestamp.today().strftime("%Y-%m-%d")

        if not all([crop, state, district]):
            return jsonify({
                "status": "error",
                "message": "Crop, state and district are required."
            }), 400

        prediction_date = pd.to_datetime(date_input, errors="coerce")

        if pd.isna(prediction_date):
            return jsonify({
                "status": "error",
                "message": "Invalid prediction date."
            }), 400

        if not market:
            available_markets = df[
                (df["Crop"] == crop) &
                (df["State"] == state) &
                (df["District"] == district)
            ]["Market"].dropna().unique()

            if len(available_markets) == 0:
                return jsonify({
                    "status": "error",
                    "message": "No supported market data for this crop and district."
                }), 404

            market = available_markets[0]

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
        print("DEBUG crop:", repr(crop))
        print("DEBUG state:", repr(state))
        print("DEBUG district:", repr(district))
        print("DEBUG market:", repr(market))
        # Retrieve only the selected crop and market history
        history_indices = history_group_indices.get(
            (crop, state, district, market)
        )

        if history_indices is None:
            historical = df.iloc[0:0]
        else:
            group_history = df.iloc[history_indices]
            historical = group_history[
                group_history["Date"] < prediction_date
            ]

        # Validate historical records before calculating price features
        if len(historical) < 7:
            return jsonify({
                "status": "error",
                "message": "Insufficient historical data for this crop, district and market. At least 7 previous records are required."
            }), 422
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

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO prediction_history
                (crop_name, state, district, predicted_price, market)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (crop, state, district, predicted_price, market)
            )
            conn.commit()
            cur.close()
            conn.close()
        except Exception as db_error:
            app.logger.exception("Database save failed")

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

            "predicted_modal_price": round(predicted_price, 2),

            "historical_prices": [
                {
                    "date": row["Date"].strftime("%Y-%m-%d"),
                    "price": round(float(row["Modal_Price"]), 2)
                }
                for _, row in historical.tail(30).iterrows()
            ]
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
