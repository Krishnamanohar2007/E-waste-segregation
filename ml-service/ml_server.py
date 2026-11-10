import tensorflow as tf
import numpy as np
from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io

from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from ewaste_knowledge import EWASTE_INFO

app = FastAPI()

MODEL_PATH = "ewaste_model_robust_v2.keras"
model = tf.keras.models.load_model(MODEL_PATH)

import os
import json

MAPPING_PATH = "class_mapping.json"

if os.path.exists(MAPPING_PATH):
    with open(MAPPING_PATH, "r") as f:
        class_indices = json.load(f)

    # safer sorting by index
    class_names = [name for name, idx in sorted(class_indices.items(), key=lambda x: x[1])]

else:
    class_names = [
        'Battery', 'Keyboard', 'Microwave', 'Mobile', 'Mouse',
        'PCB', 'Player', 'Printer', 'Television', 'Washing Machine', 'Others'
    ]

IMG_SIZE = (224,224)

def preprocess(img_bytes):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img)
    arr = preprocess_input(arr)
    arr = np.expand_dims(arr, axis=0)
    return arr

@app.get("/")
def home():
    return {"message": "E-Waste Robust ML Server Running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    contents = await file.read()
    img = preprocess(contents)

    preds = model.predict(img)[0]

    # Top predictions
    top_indices = preds.argsort()[-3:][::-1]
    best_idx = int(top_indices[0])
    second_idx = int(top_indices[1])

    device = class_names[best_idx]
    confidence = float(preds[best_idx])
    second_conf = float(preds[second_idx])
    confidence_gap = confidence - second_conf

    top3 = [
        {"device": class_names[i], "confidence": float(preds[i])}
        for i in top_indices
    ]

    # Entropy (uncertainty)
    entropy = -np.sum(preds * np.log(preds + 1e-10))

    # Thresholds
    STRONG_TH = 0.80
    MODERATE_TH = 0.55
    LOW_CONF_TH = 0.65
    GAP_TH = 0.30
    ENTROPY_TH = 1.3

    # ==============================
    # CASE 1: NON E-WASTE (ONLY Others)
    # ==============================
    if device == "Others":
        return {
            "success": True,
            "prediction_type": "non_ewaste",
            "message": "This does not appear to be electronic waste.",
            "confidence": confidence,
            "entropy": float(entropy),
            "top3": top3
        }

    # ==============================
    # CASE 2: LOW CONFIDENCE → UNCERTAIN
    # ==============================
    if confidence < LOW_CONF_TH:
        return {
            "success": True,
            "prediction_type": "uncertain",
            "message": "Image unclear or object not confidently recognized. Please upload a clearer image.",
            "confidence": confidence,
            "entropy": float(entropy),
            "top3": top3
        }

    # ==============================
    # CASE 3: UNCERTAIN / UNKNOWN
    # ==============================
    if entropy > ENTROPY_TH or confidence_gap < GAP_TH:
        return {
            "success": True,
            "prediction_type": "unknown_ewaste",
            "message": "Uncertain prediction. Please verify the item.",
            "confidence": confidence,
            "entropy": float(entropy),
            "top3": top3
        }

    # ==============================
    # NORMAL PREDICTION
    # ==============================
    info = EWASTE_INFO.get(device, {})

    prediction_payload = {
        "device": device,
        "confidence": confidence,
        "hazard": info.get("hazard"),
        "metals": info.get("metals"),
        "recyclability": info.get("recyclability"),
        "environmental_impact": info.get("environmental_impact"),
        "reuse": info.get("reuse"),
        "user_guidance": info.get(
            "user_guidance",
            "Dispose through certified e-waste centers. Do not mix with regular waste."
        )
    }

    # ==============================
    # MODERATE (SAFETY)
    # ==============================
    if confidence < STRONG_TH:
        return {
            "success": True,
            "prediction_type": "moderate",
            "message": "Prediction not fully confident. Please verify.",
            "prediction": prediction_payload,
            "top3": top3
        }

    # ==============================
    # STRONG
    # ==============================
    return {
        "success": True,
        "prediction_type": "strong",
        "prediction": prediction_payload,
        "top3": top3
    }
