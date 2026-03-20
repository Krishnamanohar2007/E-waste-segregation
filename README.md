# EcoSort AI — Intelligent E-Waste Segregation and Recycling Management System

> An end-to-end AI-powered system for classifying electronic waste, assessing environmental hazards, and delivering recycling intelligence through a production-grade microservice architecture.

---

## Problem Statement

Electronic waste (e-waste) is the fastest-growing solid waste stream in the world, generating over **62 million tonnes annually** as of 2023 (Global E-Waste Monitor). Less than 20% of this is formally recycled. The remaining 80% is either landfilled, incinerated, or informally processed — releasing toxic heavy metals such as lead, cadmium, and mercury into soil and groundwater, causing irreversible environmental and public health damage.

A core challenge in e-waste management is **accurate device identification at the point of disposal**. Without knowing what a device is, recyclers cannot determine its metal composition, hazard level, or correct processing method. Manual sorting is slow, error-prone, and unscalable.

There is a critical need for an **automated, AI-driven segregation system** that can identify e-waste devices from images, assess their environmental risk, and guide users and recyclers toward responsible disposal.

---

## Project Objective

EcoSort AI addresses this problem by delivering:

- **Automated device classification** from images across 10 e-waste categories using deep learning
- **Environmental intelligence** — hazard level assessment, metal composition breakdown, and environmental impact analysis per device
- **Recycling guidance** — recommended processing methods, reuse potential, and user disposal instructions
- **Prediction reliability tracking** — confidence-tiered responses and confusion trend analytics to monitor and improve model performance over time
- **Persistent prediction history** — MongoDB-backed logging of all predictions to support future active learning and audit trails

---

## System Architecture

The system is built as a **multi-layer microservice architecture** with clear separation of concerns across five layers.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT / USER                        │
│              (Image Upload via HTTP POST)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Node.js Backend API  (Port 5000)               │
│   Express · Multer · Mongoose · Axios                       │
│   Routes: /api/predict  /api/history                        │
│           /api/analytics  /api/confusion                    │
└──────┬──────────────────────────────────────┬───────────────┘
       │ HTTP (multipart/form-data)            │ MongoDB
┌──────▼──────────────────┐     ┌─────────────▼──────────────┐
│  FastAPI ML Microservice │     │   MongoDB  (ewasteDB)      │
│  (Port 8000)             │     │   Collection: predictions  │
│  TensorFlow · PIL        │     │   Stores full prediction   │
│  MobileNetV2 Backbone    │     │   payload + alternatives   │
│  ewaste_knowledge.py     │     └────────────────────────────┘
└─────────────────────────┘
```

### Layer Breakdown

**1. ML Training Pipeline**
Offline training pipeline (`train_pro.py`) using MobileNetV2 with two-phase transfer learning. Produces `ewaste_model_robust_v1.keras`.

**2. FastAPI ML Microservice** (`ml_server.py`)
Loads the trained model and serves predictions over HTTP. Applies confidence thresholds to classify each prediction as `strong`, `moderate`, or `weak`. Enriches predictions with domain knowledge from `ewaste_knowledge.py`.

**3. Node.js Backend API Layer** (`backend/`)
Acts as the orchestration layer. Receives image uploads from clients, forwards them to the ML microservice via `mlService.js`, persists results to MongoDB, and exposes analytics endpoints.

**4. MongoDB Prediction Storage**
Stores the complete prediction payload — device, confidence, hazard, metals, recyclability, alternatives, and image name — with timestamps for every inference request.

**5. Analytics Engine**
Two dedicated controllers compute live model reliability metrics (`analyticsController.js`) and device confusion trends (`confusionController.js`) from the stored prediction history.

**6. Knowledge Intelligence Layer** (`ewaste_knowledge.py`)
A structured domain knowledge base that maps each device class to detailed environmental and recycling metadata, injected into every prediction response.

---

## Dataset Description

The dataset covers **10 e-waste device categories**: Battery, Keyboard, Microwave, Mobile, Mouse, PCB, Player, Printer, Television, and Washing Machine.

### Collection Strategy

| Source | Description |
|--------|-------------|
| Processed base dataset | Curated images per class, manually cleaned and verified |
| Bing image crawler | `bulk_bing_crawler.py` — automated web crawling using 5 domain-specific keyword variations per class (e.g. *"e-waste battery scrap"*, *"damaged mobile phone"*), targeting 60 images per keyword |
| Dataset merging | `prepare_robust_dataset.py` merges both sources, deduplicates, and re-splits |

### Split Ratios

| Split | Ratio |
|-------|-------|
| Train | 75% |
| Validation | 15% |
| Test | 10% |

### Augmentation Strategy

Applied during training to improve generalisation across real-world capture conditions:

| Technique | Value |
|-----------|-------|
| Rotation | ±25° |
| Width / Height shift | 15% |
| Zoom | 25% |
| Shear | 15% |
| Brightness | 0.6× – 1.4× |
| Horizontal flip | Enabled |
| Fill mode | Nearest |

---

## Machine Learning Approach

### Model Architecture

- **Backbone**: MobileNetV2 pretrained on ImageNet (frozen during Phase 1)
- **Input**: 224×224 RGB images, preprocessed with `mobilenet_v2.preprocess_input`
- **Classification Head**:
  - GlobalAveragePooling2D
  - BatchNormalization → Dense(256, ReLU) → Dropout(0.4)
  - Dense(128, ReLU) → BatchNormalization → Dropout(0.3)
  - Dense(10, Softmax)

### Two-Phase Training Strategy

**Phase 1 — Head Training**
The MobileNetV2 backbone is fully frozen. Only the custom classification head is trained.
- Optimizer: Adam (lr = 0.001)
- Loss: Categorical Crossentropy with label smoothing (0.1)
- Callbacks: EarlyStopping (patience=4), ReduceLROnPlateau (factor=0.25)

**Phase 2 — Fine-Tuning**
The last 60 layers of the backbone are unfrozen for domain adaptation.
- Optimizer: Adam (lr = 1e-5)
- Same loss and callbacks as Phase 1

Label smoothing is applied in both phases to reduce overconfidence and improve calibration on unseen images.

### Confidence-Tiered Prediction Intelligence

Every prediction is classified into one of three tiers based on the softmax confidence score:

| Tier | Threshold | Behaviour |
|------|-----------|-----------|
| `strong` | ≥ 0.75 | Full prediction returned, no alternatives |
| `moderate` | 0.45 – 0.74 | Prediction returned with top-3 alternatives and a verification message |
| `weak` | < 0.45 | Prediction returned with top-3 alternatives and a recapture advisory |

This tiered system prevents silent misclassification and gives downstream consumers actionable signal about prediction reliability.

### Model Evaluation

`evaluate_model.py` generates a full classification report and confusion matrix heatmap (`confusion_matrix_robust_v1.png`) using scikit-learn, enabling per-class precision, recall, and F1 analysis.

---

## Backend Intelligence Features

### Prediction Controller (`predictController.js`)
- Accepts image upload via `multipart/form-data`
- Forwards to FastAPI ML microservice using `mlService.js`
- Persists full prediction payload to MongoDB regardless of confidence tier
- Returns the complete ML response to the client

### Analytics API (`analyticsController.js`)
Computes live model reliability metrics from stored prediction history:

```json
{
  "total_predictions": 120,
  "strong_predictions": 89,
  "moderate_predictions": 21,
  "weak_predictions": 10,
  "weak_prediction_rate": "8.33 %",
  "model_reliability_score": "91.67"
}
```

### Confusion Trend Detection (`confusionController.js`)
Analyses all `weak` predictions and maps which device pairs the model most frequently confuses:

```json
{
  "confusion_trends": {
    "Television ↔ Monitor": 4,
    "Mouse ↔ Keyboard": 2
  }
}
```

This data can directly inform future dataset augmentation and retraining priorities.

### Prediction History (`historyController.js`)
Returns the 20 most recent predictions sorted by timestamp, including full device metadata, confidence, and alternatives — suitable for audit, review, or active learning pipelines.

---

## Knowledge Intelligence Layer

`ewaste_knowledge.py` is a structured domain knowledge base covering all 10 device classes. Every prediction response is enriched with the following fields:

| Field | Description |
|-------|-------------|
| `hazard.level` | Low / Medium / High |
| `hazard.reason` | Human-readable explanation of the hazard |
| `metals.dominant` | Primary recoverable metal |
| `metals.composition` | Percentage breakdown of all metals present |
| `recyclability.status` | Recyclability classification |
| `recyclability.method` | Step-by-step recommended processing method |
| `environmental_impact` | Risk to soil, water, or air if improperly disposed |
| `reuse` | Reuse or refurbishment potential |
| `user_guidance` | Actionable disposal instruction for the end user |

Example — PCB:
```json
{
  "hazard": { "level": "High", "reason": "Contains heavy metals and toxic solder materials" },
  "metals": { "dominant": "Copper", "composition": { "Copper": "20-30%", "Gold": "0.1-0.3%", "Silver": "0.3-0.6%", "Tin": "5-10%" } },
  "recyclability": { "status": "Highly recyclable", "method": "Mechanical shredding → smelting → precious metal refining" },
  "environmental_impact": "Toxic fumes may form if burnt improperly.",
  "reuse": "Component harvesting possible for repairs.",
  "user_guidance": "Always send to certified recyclers."
}
```

---

## API Design Overview

### Base URLs
- ML Microservice: `http://localhost:8000`
- Node.js Backend: `http://localhost:5000`

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | ML server health check |
| `POST` | `/predict` | Direct ML inference (FastAPI) — accepts `multipart/form-data` with `file` field |
| `POST` | `/api/predict` | Primary prediction endpoint (Node.js) — accepts `multipart/form-data` with `image` field |
| `GET` | `/api/history` | Returns last 20 predictions from MongoDB |
| `GET` | `/api/analytics` | Returns model reliability score and prediction tier breakdown |
| `GET` | `/api/confusion` | Returns device confusion trend map from weak predictions |

### Sample Prediction Response

```json
{
  "success": true,
  "prediction_type": "strong",
  "prediction": {
    "device": "PCB",
    "confidence": 0.91,
    "hazard": { "level": "High", "reason": "Contains heavy metals and toxic solder materials" },
    "metals": { "dominant": "Copper", "composition": { "Copper": "20-30%", "Gold": "0.1-0.3%" } },
    "recyclability": { "status": "Highly recyclable", "method": "Mechanical shredding → smelting → precious metal refining" },
    "environmental_impact": "Toxic fumes may form if burnt improperly.",
    "reuse": "Component harvesting possible for repairs.",
    "user_guidance": "Always send to certified recyclers."
  }
}
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Deep Learning | TensorFlow 2.x, Keras |
| ML Microservice | FastAPI, Uvicorn, Pillow |
| Backend API | Node.js, Express.js 5 |
| File Upload | Multer |
| HTTP Client | Axios |
| Database | MongoDB (local), Mongoose ODM |
| Data Pipeline | Python, icrawler (Bing), scikit-learn |
| Evaluation | scikit-learn, Matplotlib, Seaborn |
| Frontend (Planned) | React.js |

---

## How to Run the Project

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB running locally on port `27017`

### Step 1 — Install Python Dependencies

```bash
pip install tensorflow fastapi uvicorn pillow numpy scikit-learn matplotlib seaborn icrawler
```

### Step 2 — Train the Model

```bash
cd modified-dataset/workspace
python train_pro.py
```

This produces `ewaste_model_robust_v1.keras` in the workspace directory.

### Step 3 — Start the FastAPI ML Microservice

```bash
cd modified-dataset/workspace
uvicorn ml_server:app --host 127.0.0.1 --port 8000
```

Verify at: `http://localhost:8000/`

### Step 4 — Install Node.js Dependencies

```bash
cd modified-dataset/backend
npm install
```

### Step 5 — Start the Node.js Backend

```bash
node server.js
```

Backend runs on: `http://localhost:5000`

### Step 6 — Test the Prediction API

```bash
curl -X POST http://localhost:5000/api/predict \
  -F "image=@/path/to/your/image.jpg"
```

### Step 7 — Test Analytics Endpoints

```bash
curl http://localhost:5000/api/analytics
curl http://localhost:5000/api/confusion
curl http://localhost:5000/api/history
```

---

## Project Structure

```
modified-dataset/
├── workspace/
│   ├── robust_pipeline/
│   │   ├── bulk_bing_crawler.py       # Bing image crawler for dataset expansion
│   │   └── prepare_robust_dataset.py  # Merges and re-splits datasets
│   ├── final_dataset/                 # train / val / test splits
│   ├── train_pro.py                   # Two-phase transfer learning pipeline
│   ├── evaluate_model.py              # Confusion matrix + classification report
│   ├── ml_server.py                   # FastAPI inference server
│   ├── predict.py                     # CLI prediction utility
│   ├── ewaste_knowledge.py            # Domain knowledge base
│   └── ewaste_model_robust_v1.keras   # Trained model weights
│
├── backend/
│   ├── config/db.js                   # MongoDB connection
│   ├── models/Prediction.js           # Mongoose schema
│   ├── controllers/
│   │   ├── predictController.js       # Prediction + DB persistence
│   │   ├── historyController.js       # Prediction history retrieval
│   │   ├── analyticsController.js     # Model reliability analytics
│   │   └── confusionController.js     # Confusion trend detection
│   ├── routes/                        # Express route definitions
│   ├── services/mlService.js          # FastAPI proxy service
│   └── server.js                      # Express app entry point
│
└── README.md
```

---

## Future Scope

| Enhancement | Description |
|-------------|-------------|
| YOLO Object Detection | Upgrade from classification to real-time object detection, enabling multi-device identification in a single frame |
| Dataset Scaling | Expand to 50+ device categories with larger per-class image counts using automated crawling pipelines |
| Active Learning Loop | Use weak prediction logs from MongoDB to automatically flag uncertain samples for human labelling and retraining |
| React Dashboard | Visualise prediction history, analytics charts, confusion heatmaps, and metal composition breakdowns in a web UI |
| Cloud Deployment | Containerise ML microservice and backend with Docker; deploy on AWS ECS or EC2 with S3 for image storage |
| Mobile Integration | Expose prediction API to a mobile app for field-level e-waste scanning at collection centres |

---

## License

This project is developed for academic and research purposes.
