import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import os

# Load trained model
model = tf.keras.models.load_model("ewaste_model.keras")

# Metal mapping
metal_mapping = {
    "Battery": {"metal": "Lead", "recyclable": False, "hazardLevel": "High"},
    "Keyboard": {"metal": "Aluminum", "recyclable": True, "hazardLevel": "Low"},
    "Microwave": {"metal": "Iron", "recyclable": True, "hazardLevel": "Medium"},
    "Mobile": {"metal": "Copper", "recyclable": True, "hazardLevel": "Medium"},
    "Mouse": {"metal": "Copper", "recyclable": True, "hazardLevel": "Low"},
    "PCB": {"metal": "Copper", "recyclable": True, "hazardLevel": "Low"},
    "Player": {"metal": "Aluminum", "recyclable": True, "hazardLevel": "Low"},
    "Printer": {"metal": "Iron", "recyclable": True, "hazardLevel": "Medium"},
    "Television": {"metal": "Aluminum", "recyclable": True, "hazardLevel": "Medium"},
    "Washing Machine": {"metal": "Iron", "recyclable": True, "hazardLevel": "Low"}
}

# Get class labels from training folder
train_folder = r"C:\chestbox\modified-dataset\train"
class_labels = sorted(os.listdir(train_folder))

# 🔥 Take image path from user
img_path = input("Enter full image path: ")

if not os.path.exists(img_path):
    print("❌ Image not found. Please check the path.")
    exit()

# Preprocess image
img = image.load_img(img_path, target_size=(224,224))
img_array = image.img_to_array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

# Predict
prediction = model.predict(img_array)[0]

# Get top 3 predictions
top_indices = prediction.argsort()[-3:][::-1]

print("\n🔍 Prediction Results:")

for idx in top_indices:
    print(f"{class_labels[idx]}: {prediction[idx]*100:.2f}%")

predicted_class = class_labels[top_indices[0]]
confidence = prediction[top_indices[0]] * 100

metal_info = metal_mapping.get(predicted_class, {})

print("\n✅ Final Decision:")
print("Device:", predicted_class)
print(f"Confidence: {confidence:.2f}%")
print("Dominant Metal:", metal_info.get("metal"))
print("Recyclable:", metal_info.get("recyclable"))
print("Hazard Level:", metal_info.get("hazardLevel"))

# Safety check
if confidence < 70:
    print("\n⚠ Low confidence prediction. Please capture a clearer image.")