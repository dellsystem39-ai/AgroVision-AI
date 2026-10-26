import joblib

# Load the existing trained model
model = joblib.load("model.pkl")

# Load the existing encoder
encoder = joblib.load("encoder.pkl")

# Store both together
pipeline = {
    "model": model,
    "encoder": encoder
}

# Save combined file
joblib.dump(pipeline, "pipeline.pkl")

print("===================================")
print("   AGROVISION AI - PIPELINE")
print("===================================")

print("\nModel loaded successfully!")
print("Encoder loaded successfully!")
print("Combined pipeline saved successfully!")

print("\nFile created: pipeline.pkl")