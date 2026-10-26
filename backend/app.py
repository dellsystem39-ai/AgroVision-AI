from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os


# =========================================================
# CREATE FLASK APP
# =========================================================

app = Flask(__name__)


# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

ML_DIR = os.path.join(
    BASE_DIR,
    "..",
    "ml"
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "..",
    "data"
)


# =========================================================
# LOAD ML PIPELINE
# =========================================================

pipeline_path = os.path.join(
    ML_DIR,
    "pipeline.pkl"
)


try:

    pipeline = joblib.load(
        pipeline_path
    )

    print("ML pipeline loaded successfully.")

except Exception as e:

    print(
        "ERROR: Could not load ML pipeline."
    )

    print(e)

    pipeline = None


if pipeline is not None:

    model = pipeline["model"]

    encoder = pipeline["encoder"]

else:

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

    print(
        "Dataset loaded successfully."
    )

    print(
        f"Total records: {len(df)}"
    )

except Exception as e:

    print(
        "ERROR: Could not load crop_prices.csv."
    )

    print(e)

    df = pd.DataFrame()


# =========================================================
# PREPARE DATASET
# =========================================================

if not df.empty:

    # -----------------------------------------------------
    # Convert date
    # -----------------------------------------------------

    df["Date"] = pd.to_datetime(
        df["Date"],
        errors="coerce"
    )


    # -----------------------------------------------------
    # Clean text columns
    # -----------------------------------------------------

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


    # -----------------------------------------------------
    # Convert price column
    # -----------------------------------------------------

    df["Modal_Price"] = pd.to_numeric(
        df["Modal_Price"],
        errors="coerce"
    )


    # -----------------------------------------------------
    # Remove invalid rows
    # -----------------------------------------------------

    df = df.dropna(
        subset=[
            "Date",
            "Crop",
            "State",
            "District",
            "Market",
            "Modal_Price"
        ]
    )


    # -----------------------------------------------------
    # Sort data
    # -----------------------------------------------------

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

        "message":
            "AgroVision AI Backend is running!",

        "status":
            "success"

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

        # =================================================
        # CHECK ML MODEL
        # =================================================

        if model is None or encoder is None:

            return jsonify({

                "status": "error",

                "message":
                    "ML model could not be loaded."

            }), 500


        # =================================================
        # CHECK DATASET
        # =================================================

        if df.empty:

            return jsonify({

                "status": "error",

                "message":
                    "Dataset could not be loaded."

            }), 500


        # =================================================
        # GET REQUEST DATA
        # =================================================

        data = request.get_json()


        if not data:

            return jsonify({

                "status": "error",

                "message":
                    "No prediction data received."

            }), 400


        crop = data.get(
            "crop"
        )

        state = data.get(
            "state"
        )

        district = data.get(
            "district"
        )

        market = data.get(
            "market"
        )

        date_input = data.get(
            "date"
        )


        # =================================================
        # CHECK REQUIRED INPUTS
        # =================================================

        if not all([
            crop,
            state,
            district,
            market,
            date_input
        ]):

            return jsonify({

                "status": "error",

                "message":
                    "Crop, state, district, market and date are required."

            }), 400


        # =================================================
        # CONVERT DATE
        # =================================================

        prediction_date = pd.to_datetime(
            date_input,
            errors="coerce"
        )


        if pd.isna(
            prediction_date
        ):

            return jsonify({

                "status": "error",

                "message":
                    "Invalid prediction date."

            }), 400


        # =================================================
        # CHECK HISTORICAL DATA
        # =================================================

        historical = df[
            (df["Crop"] == crop) &
            (df["State"] == state) &
            (df["District"] == district) &
            (df["Market"] == market) &
            (df["Date"] < prediction_date)
        ].sort_values(
            "Date"
        )


        if len(historical) < 7:

            return jsonify({

                "status": "error",

                "message":
                    "At least 7 previous records are required."

            }), 400


        # =================================================
        # HISTORICAL FEATURES
        # =================================================

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


        # =================================================
        # DATE FEATURES
        # =================================================

        year = prediction_date.year

        month = prediction_date.month

        day = prediction_date.day

        day_of_week = prediction_date.dayofweek


        # =================================================
        # CREATE INPUT DATA
        # =================================================

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


        # =================================================
        # ENCODE CATEGORICAL FEATURES
        # =================================================

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
            input_data[
                categorical_features
            ]
        )


        encoded_df = pd.DataFrame(

            encoded_data,

            columns=encoder.get_feature_names_out(
                categorical_features
            )

        )


        # =================================================
        # COMBINE FEATURES
        # =================================================

        final_input = pd.concat(

            [

                input_data[
                    numerical_features
                ].reset_index(
                    drop=True
                ),

                encoded_df.reset_index(
                    drop=True
                )

            ],

            axis=1

        )


        # =================================================
        # ML PREDICTION
        # =================================================

        prediction = model.predict(
            final_input.values
        )


        predicted_price = float(
            prediction[0]
        )


        # =================================================
        # RESULT
        # =================================================

        return jsonify({

            "status":
                "success",

            "crop":
                crop,

            "state":
                state,

            "district":
                district,

            "market":
                market,

            "date":
                date_input,

            "previous_price":
                round(
                    float(previous_price),
                    2
                ),

            "previous_3_day_average":
                round(
                    float(previous_3_day_avg),
                    2
                ),

            "previous_7_day_average":
                round(
                    float(previous_7_day_avg),
                    2
                ),

            "predicted_modal_price":
                round(
                    predicted_price,
                    2
                )

        })


    except Exception as e:

        print(
            "Prediction error:",
            str(e)
        )

        return jsonify({

            "status":
                "error",

            "message":
                str(e)

        }), 500


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )