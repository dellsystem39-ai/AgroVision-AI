import pandas as pd
import os

# ==========================================
# AGROVISION AI - FINAL ML REPORT
# ==========================================

print("==========================================")
print("       AGROVISION AI - ML REPORT")
print("==========================================")

# ==========================================
# MODEL PERFORMANCE
# ==========================================

print("\nMODEL PERFORMANCE")
print("------------------------------------------")

print("Model              : Random Forest Regression")
print("Training Rows      : 13,760")
print("Testing Rows       : 3,440")
print("Number of Trees    : 200")
print("Number of Features : 75")

print("\nEvaluation Metrics:")
print("MAE                : ₹187.81")
print("RMSE               : ₹264.10")
print("R² Score           : 0.9878")

# ==========================================
# FEATURES
# ==========================================

print("\nFEATURES USED")
print("------------------------------------------")

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

for i, feature in enumerate(features, 1):
    print(f"{i}. {feature}")

# ==========================================
# TOP FEATURES
# ==========================================

print("\nTOP IMPORTANT FEATURES")
print("------------------------------------------")

print("1. Previous_3_Day_Avg  : 68.54%")
print("2. Previous_7_Day_Avg  : 28.30%")
print("3. Previous_Price      : 1.64%")
print("4. Crop_Turmeric       : 1.09%")
print("5. Day                 : 0.17%")

# ==========================================
# GENERATED FILES
# ==========================================

print("\nGENERATED ML FILES")
print("------------------------------------------")

files = [
    "model.pkl",
    "encoder.pkl",
    "pipeline.pkl",
    "feature_importance.csv",
    "feature_importance.png",
    "model_predictions.csv",
    "actual_vs_predicted.png"
]

for file in files:

    if os.path.exists(file):
        print(f"✓ {file}")
    else:
        print(f"- {file} not found")

# ==========================================
# FINAL SUMMARY
# ==========================================

print("\nPROJECT SUMMARY")
print("------------------------------------------")

print("AgroVision AI uses Machine Learning")
print("to predict crop Modal Prices.")

print("\nAlgorithm:")
print("Random Forest Regression")

print("\nPrediction Target:")
print("Modal_Price")

print("\nThe model uses historical price trends,")
print("crop information, location information,")
print("market information and date features.")

print("\n==========================================")
print("          ML REPORT COMPLETED")
print("==========================================")