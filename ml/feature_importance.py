import joblib
import pandas as pd
import matplotlib.pyplot as plt

# ==========================================
# LOAD MODEL AND ENCODER
# ==========================================

model = joblib.load("model.pkl")
encoder = joblib.load("encoder.pkl")

# ==========================================
# FEATURE NAMES
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

encoded_features = encoder.get_feature_names_out(
    categorical_features
)

feature_names = list(numerical_features) + list(encoded_features)

# ==========================================
# FEATURE IMPORTANCE
# ==========================================

importance = model.feature_importances_

importance_df = pd.DataFrame({
    "Feature": feature_names,
    "Importance": importance
})

importance_df = importance_df.sort_values(
    "Importance",
    ascending=False
)

# ==========================================
# DISPLAY RESULTS
# ==========================================

print("===================================")
print("   AGROVISION AI - FEATURE IMPORTANCE")
print("===================================")

print("\nTop 15 Important Features:\n")

print(
    importance_df.head(15).to_string(index=False)
)

# ==========================================
# SAVE RESULTS
# ==========================================

importance_df.to_csv(
    "feature_importance.csv",
    index=False
)

print("\nFeature importance saved as:")
print("feature_importance.csv")

# ==========================================
# CREATE GRAPH
# ==========================================

top_features = importance_df.head(10).sort_values(
    "Importance"
)

plt.figure(figsize=(10, 6))

plt.barh(
    top_features["Feature"],
    top_features["Importance"]
)

plt.xlabel("Importance")
plt.ylabel("Feature")
plt.title("AgroVision AI - Top 10 Feature Importance")

plt.tight_layout()

plt.savefig(
    "feature_importance.png",
    dpi=300
)

plt.show()

print("\nGraph saved as:")
print("feature_importance.png")