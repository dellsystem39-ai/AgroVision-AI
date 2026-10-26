import pandas as pd
import numpy as np
import joblib

from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ==========================================
# 1. LOAD DATASET
# ==========================================

df = pd.read_csv("../data/crop_prices.csv")

df["Date"] = pd.to_datetime(df["Date"])


# ==========================================
# 2. SORT DATA CHRONOLOGICALLY
# ==========================================

group_columns = [
    "Crop",
    "State",
    "District",
    "Market"
]

df = df.sort_values(
    ["Crop", "State", "District", "Market", "Date"]
)


# ==========================================
# 3. CREATE HISTORICAL PRICE FEATURES
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
# 4. CREATE DATE FEATURES
# ==========================================

df["Year"] = df["Date"].dt.year
df["Month"] = df["Date"].dt.month
df["Day"] = df["Date"].dt.day
df["Day_of_Week"] = df["Date"].dt.dayofweek


# ==========================================
# 5. REMOVE ROWS WITHOUT ENOUGH HISTORY
# ==========================================

df = df.dropna(
    subset=[
        "Previous_Price",
        "Previous_3_Day_Avg",
        "Previous_7_Day_Avg"
    ]
)


# ==========================================
# 6. SORT BY DATE
# ==========================================

df = df.sort_values("Date")


# ==========================================
# 7. DEFINE FEATURES AND TARGET
# ==========================================

features = [
    "Crop",
    "State",
    "District",
    "Market",
    "Year",
    "Month",
    "Day",
    "Day_of_Week",
    "Previous_Price",
    "Previous_3_Day_Avg",
    "Previous_7_Day_Avg"
]

target = "Modal_Price"

X = df[features]
y = df[target]


# ==========================================
# 8. TIME-BASED TRAIN/TEST SPLIT
# ==========================================

split_index = int(len(df) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]


# ==========================================
# 9. CATEGORICAL FEATURES
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


# ==========================================
# 10. ONE-HOT ENCODING
# ==========================================

encoder = OneHotEncoder(
    handle_unknown="ignore",
    sparse_output=False
)

X_train_categorical = encoder.fit_transform(
    X_train[categorical_features]
)

X_test_categorical = encoder.transform(
    X_test[categorical_features]
)


# ==========================================
# 11. GET NUMERICAL FEATURES
# ==========================================

X_train_numerical = X_train[numerical_features].values
X_test_numerical = X_test[numerical_features].values


# ==========================================
# 12. COMBINE FEATURES
# ==========================================

X_train_final = np.hstack(
    [
        X_train_numerical,
        X_train_categorical
    ]
)

X_test_final = np.hstack(
    [
        X_test_numerical,
        X_test_categorical
    ]
)


# ==========================================
# 13. CREATE RANDOM FOREST MODEL
# ==========================================

model = RandomForestRegressor(
    n_estimators=200,
    random_state=42,
    n_jobs=-1
)


# ==========================================
# 14. TRAIN THE MODEL
# ==========================================

print("===================================")
print("   AGROVISION AI - MODEL TRAINING")
print("===================================")

print("\nTraining Random Forest...")

model.fit(
    X_train_final,
    y_train
)

print("Training completed successfully!")


# ==========================================
# 15. MAKE PREDICTIONS
# ==========================================

y_pred = model.predict(X_test_final)
# ==========================================
# 16. MODEL EVALUATION
# ==========================================

mae = mean_absolute_error(y_test, y_pred)

rmse = np.sqrt(
    mean_squared_error(y_test, y_pred)
)

r2 = r2_score(y_test, y_pred)


print("\n===================================")
print("       MODEL EVALUATION")
print("===================================")

print("\nMAE:", round(mae, 2))

print("RMSE:", round(rmse, 2))

print("R2 Score:", round(r2, 4))

# ==========================================
# 16. DISPLAY SAMPLE PREDICTIONS
# ==========================================

print("\nSample Predictions:")
print("-----------------------------------")

for actual, predicted in zip(
    y_test.head(10),
    y_pred[:10]
):
    print(
        "Actual:",
        actual,
        "| Predicted:",
        round(predicted, 2)
    )


# ==========================================
# 17. DISPLAY MODEL INFORMATION
# ==========================================

print("\n-----------------------------------")
print("Model Information")
print("-----------------------------------")

print("Number of trees:", model.n_estimators)

print("Training rows:", len(X_train_final))

print("Testing rows:", len(X_test_final))

print("Number of features:", X_train_final.shape[1])
# ==========================================
# 18. SAVE MODEL AND ENCODER
# ==========================================

joblib.dump(
    model,
    "model.pkl"
)

joblib.dump(
    encoder,
    "encoder.pkl"
)

print("\n===================================")
print("       FILES SAVED")
print("===================================")

print("\nModel saved as: model.pkl")
print("Encoder saved as: encoder.pkl")