import joblib
import pandas as pd

# ==========================================
# LOAD MODEL AND ENCODER
# ==========================================

model = joblib.load("model.pkl")
encoder = joblib.load("encoder.pkl")

# Load dataset
df = pd.read_csv("../data/crop_prices.csv")

df["Date"] = pd.to_datetime(df["Date"])

# Sort the data
group_columns = ["Crop", "State", "District", "Market"]

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
print("     AGROVISION AI - PREDICTION")
print("===================================")

print("\nModel loaded successfully!")
print("Dataset loaded successfully!")

# ==========================================
# USER INPUT
# ==========================================

crop = input("\nEnter Crop: ")
state = input("Enter State: ")
district = input("Enter District: ")
market = input("Enter Market: ")
date_input = input("Enter Date (YYYY-MM-DD): ")

prediction_date = pd.to_datetime(date_input)

# ==========================================
# FIND HISTORICAL DATA
# ==========================================

historical = df[
    (df["Crop"].str.lower() == crop.lower()) &
    (df["State"].str.lower() == state.lower()) &
    (df["District"].str.lower() == district.lower()) &
    (df["Market"].str.lower() == market.lower()) &
    (df["Date"] < prediction_date)
].sort_values("Date")

# Check if enough historical data exists
if len(historical) < 7:
    print("\nNot enough historical data available.")
    print("At least 7 previous records are required.")
    exit()

# Get latest historical values
previous_price = historical.iloc[-1]["Modal_Price"]

previous_3_day_avg = historical.tail(3)["Modal_Price"].mean()

previous_7_day_avg = historical.tail(7)["Modal_Price"].mean()

# ==========================================
# CREATE DATE FEATURES
# ==========================================

year = prediction_date.year
month = prediction_date.month
day = prediction_date.day
day_of_week = prediction_date.dayofweek

# ==========================================
# DISPLAY HISTORICAL VALUES
# ==========================================

print("\nHistorical information:")
print(f"Previous Price: ₹{previous_price:.2f}")
print(f"Previous 3-Day Average: ₹{previous_3_day_avg:.2f}")
print(f"Previous 7-Day Average: ₹{previous_7_day_avg:.2f}")

# ==========================================
# CREATE INPUT DATA
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
# ENCODE CATEGORICAL FEATURES
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
# MAKE PREDICTION
# ==========================================

prediction = model.predict(final_input.values)

# ==========================================
# DISPLAY RESULT
# ==========================================

print("\n===================================")
print("       PREDICTION RESULT")
print("===================================")

print(f"Crop: {crop}")
print(f"Market: {market}")
print(f"Date: {date_input}")

print(f"\nPredicted Modal Price: ₹{prediction[0]:.2f}")

print("===================================")
