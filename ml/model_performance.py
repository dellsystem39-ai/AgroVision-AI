import pandas as pd
import joblib
import matplotlib.pyplot as plt

from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_squared_error
from sklearn.metrics import r2_score

# ==========================================
# LOAD MODEL AND DATASET
# ==========================================

model = joblib.load("model.pkl")
encoder = joblib.load("encoder.pkl")

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
# DATE FEATURES
# ==========================================

df["Year"] = df["Date"].dt.year
df["Month"] = df["Date"].dt.month
df["Day"] = df["Date"].dt.day
df["Day_of_Week"] = df["Date"].dt.dayofweek

# ==========================================
# REMOVE MISSING VALUES
# ==========================================

df = df.dropna().copy()

# ==========================================
# SORT CHRONOLOGICALLY
# ==========================================

df = df.sort_values("Date").reset_index(drop=True)

# ==========================================
# FEATURES AND TARGET
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

target = "Modal_Price"

# ==========================================
# TIME-BASED SPLIT
# ==========================================

split_index = int(len(df) * 0.8)

train_data = df.iloc[:split_index]
test_data = df.iloc[split_index:]

X_test = test_data[
    categorical_features + numerical_features
]

y_test = test_data[target]

# ==========================================
# ENCODE TEST DATA
# ==========================================

encoded_test = encoder.transform(
    X_test[categorical_features]
)

encoded_test_df = pd.DataFrame(
    encoded_test,
    columns=encoder.get_feature_names_out(
        categorical_features
    )
)

# ==========================================
# COMBINE FEATURES
# ==========================================

final_test = pd.concat(
    [
        X_test[numerical_features].reset_index(drop=True),
        encoded_test_df.reset_index(drop=True)
    ],
    axis=1
)

# ==========================================
# PREDICTION
# ==========================================

predictions = model.predict(
    final_test.values
)

# ==========================================
# MODEL PERFORMANCE
# ==========================================

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = mean_squared_error(
    y_test,
    predictions
) ** 0.5

r2 = r2_score(
    y_test,
    predictions
)

print("===================================")
print(" AGROVISION AI - MODEL PERFORMANCE")
print("===================================")

print(f"\nTesting Rows: {len(y_test)}")

print(f"\nMAE  : ₹{mae:.2f}")
print(f"RMSE : ₹{rmse:.2f}")
print(f"R² Score : {r2:.4f}")

# ==========================================
# SAMPLE PREDICTIONS
# ==========================================

print("\nSample Predictions:\n")

for actual, predicted in zip(
    y_test.head(10),
    predictions[:10]
):
    print(
        f"Actual: ₹{actual:.2f} | "
        f"Predicted: ₹{predicted:.2f}"
    )

# ==========================================
# SAVE PERFORMANCE DATA
# ==========================================

performance_df = pd.DataFrame({
    "Actual": y_test.values,
    "Predicted": predictions
})

performance_df.to_csv(
    "model_predictions.csv",
    index=False
)

print("\nPrediction results saved as:")
print("model_predictions.csv")

# ==========================================
# ACTUAL VS PREDICTED GRAPH
# ==========================================

plt.figure(figsize=(10, 6))

plt.scatter(
    y_test,
    predictions,
    alpha=0.5
)

plt.xlabel("Actual Modal Price")
plt.ylabel("Predicted Modal Price")

plt.title(
    "AgroVision AI - Actual vs Predicted Prices"
)

plt.tight_layout()

plt.savefig(
    "actual_vs_predicted.png",
    dpi=300
)

plt.show()

print("\nGraph saved as:")
print("actual_vs_predicted.png")

print("\n===================================")
print("       ANALYSIS COMPLETED")
print("===================================")