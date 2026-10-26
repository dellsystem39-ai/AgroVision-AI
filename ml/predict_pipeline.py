import joblib
import pandas as pd

# ==========================================
# LOAD PIPELINE
# ==========================================

pipeline = joblib.load("pipeline.pkl")

model = pipeline["model"]
encoder = pipeline["encoder"]

# ==========================================
# LOAD DATASET
# ==========================================

df = pd.read_csv("../data/crop_prices.csv")

df["Date"] = pd.to_datetime(df["Date"])

# ==========================================
# SORT DATA
# ==========================================

group_columns = [
    "Crop",
    "State",
    "District",
    "Market"
]

df = df.sort_values(
    group_columns + ["Date"]
).reset_index(drop=True)

# ==========================================
# CREATE HISTORICAL FEATURES
# ==========================================

group = df.groupby(group_columns)["Modal_Price"]

df["Previous_Price"] = group.shift(1)

df["Previous_3_Day_Avg"] = group.transform(
    lambda x: x.shift(1).rolling(3).mean()
)

df["Previous_7_Day_Avg"] = group.transform(
    lambda x: x.shift(1).rolling(7).mean()
)

# ==========================================
# AGROVISION AI
# ==========================================

print("===================================")
print("   AGROVISION AI - PIPELINE TEST")
print("===================================")

print("\nPipeline loaded successfully!")
print("Dataset loaded successfully!")

# ==========================================
# CROP
# ==========================================

crops = sorted(df["Crop"].unique())

print("\nAvailable Crops:")

for i, value in enumerate(crops, 1):
    print(f"{i}. {value}")

crop_choice = int(input("\nEnter Crop Number: "))

crop = crops[crop_choice - 1]

# ==========================================
# STATE
# ==========================================

states = sorted(
    df[df["Crop"] == crop]["State"].unique()
)

print("\nAvailable States:")

for i, value in enumerate(states, 1):
    print(f"{i}. {value}")

state_choice = int(input("\nEnter State Number: "))

state = states[state_choice - 1]

# ==========================================
# DISTRICT
# ==========================================

districts = sorted(
    df[
        (df["Crop"] == crop) &
        (df["State"] == state)
    ]["District"].unique()
)

print("\nAvailable Districts:")

for i, value in enumerate(districts, 1):
    print(f"{i}. {value}")

district_choice = int(input("\nEnter District Number: "))

district = districts[district_choice - 1]

# ==========================================
# MARKET
# ==========================================

markets = sorted(
    df[
        (df["Crop"] == crop) &
        (df["State"] == state) &
        (df["District"] == district)
    ]["Market"].unique()
)

print("\nAvailable Markets:")

for i, value in enumerate(markets, 1):
    print(f"{i}. {value}")

market_choice = int(input("\nEnter Market Number: "))

market = markets[market_choice - 1]

# ==========================================
# DATE
# ==========================================

date_input = input(
    "\nEnter Date (YYYY-MM-DD): "
)

prediction_date = pd.to_datetime(date_input)

# ==========================================
# HISTORICAL DATA
# ==========================================

historical = df[
    (df["Crop"] == crop) &
    (df["State"] == state) &
    (df["District"] == district) &
    (df["Market"] == market) &
    (df["Date"] < prediction_date)
].sort_values("Date")

if len(historical) < 7:

    print("\nNot enough historical data available.")
    print("At least 7 previous records are required.")

    exit()

# ==========================================
# HISTORICAL FEATURES
# ==========================================

previous_price = historical.iloc[-1]["Modal_Price"]

previous_3_day_avg = (
    historical.tail(3)["Modal_Price"].mean()
)

previous_7_day_avg = (
    historical.tail(7)["Modal_Price"].mean()
)

# ==========================================
# DATE FEATURES
# ==========================================

year = prediction_date.year
month = prediction_date.month
day = prediction_date.day
day_of_week = prediction_date.dayofweek

# ==========================================
# CREATE INPUT
# ==========================================

input_data = pd.DataFrame({
    "Crop": [crop],
    "State": [state],
    "District": [district],
    "Market": [market],
    "Year": [year],
    "Month": [month],
    "Day": [day],
    "Day_of_Week": [day_of_week],
    "Previous_Price": [previous_price],
    "Previous_3_Day_Avg": [previous_3_day_avg],
    "Previous_7_Day_Avg": [previous_7_day_avg]
})

# ==========================================
# ENCODE
# ==========================================

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

# ==========================================
# COMBINE FEATURES
# ==========================================

final_input = pd.concat(
    [
        input_data[numerical_features].reset_index(drop=True),
        encoded_df.reset_index(drop=True)
    ],
    axis=1
)

# ==========================================
# PREDICTION
# ==========================================

prediction = model.predict(
    final_input.values
)

# ==========================================
# RESULT
# ==========================================

print("\n===================================")
print("       PREDICTION RESULT")
print("===================================")

print(f"Crop: {crop}")
print(f"State: {state}")
print(f"District: {district}")
print(f"Market: {market}")
print(f"Date: {date_input}")

print(
    f"\nPredicted Modal Price: ₹{prediction[0]:.2f}"
)

print("===================================")