import tensorflow as tf
import numpy as np
from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io

from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from ewaste_knowledge import EWASTE_INFO

app = FastAPI()

MODEL_PATH = "ewaste_model_robust_v1.keras"
model = tf.keras.models.load_model(MODEL_PATH)

class_names = [
    'Battery',
    'Keyboard',
    'Microwave',
    'Mobile',
    'Mouse',
    'PCB',
    'Player',
    'Printer',
    'Television',
    'Washing Machine'
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

    top_indices = preds.argsort()[-3:][::-1]

    best_idx = int(top_indices[0])
    device = class_names[best_idx]
    confidence = float(preds[best_idx])

    STRONG_TH = 0.75
    MODERATE_TH = 0.45

    alternatives = [
        {
            "device": class_names[i],
            "confidence": float(preds[i])
        }
        for i in top_indices
    ]

    info = EWASTE_INFO.get(device, {})

    prediction_payload = {
        "device": device,
        "confidence": confidence,
        "hazard": info.get("hazard"),
        "metals": info.get("metals"),
        "recyclability": info.get("recyclability"),
        "environmental_impact": info.get("environmental_impact"),
        "reuse": info.get("reuse"),
        "user_guidance": info.get("user_guidance", "Follow authorised e-waste disposal methods")
    }

    # ⭐ STRONG
    if confidence >= STRONG_TH:
        return {
            "success": True,
            "prediction_type": "strong",
            "prediction": prediction_payload
        }

    # ⭐ MODERATE
    if confidence >= MODERATE_TH:
        return {
            "success": True,
            "prediction_type": "moderate",
            "message": "Model somewhat confident. Please verify device.",
            "prediction": prediction_payload,
            "alternatives": alternatives
        }

    # ⭐ WEAK
    return {
        "success": True,
        "prediction_type": "weak",
        "message": "Model uncertain. Capture clearer image.",
        "prediction": prediction_payload,
        "alternatives": alternatives
    }