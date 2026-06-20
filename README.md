# EcoSort AI — E-Waste Segregation and Recycling Management System

> An end-to-end AI system for electronic waste recognition, hazard insights, and recycling intelligence.

## Table of Contents

- [Project Summary](#project-summary)
- [Project Structure](#project-structure)
- [Component Overview](#component-overview)
  - [ML Microservice](#ml-microservice)
  - [Backend API](#backend-api)
  - [Frontend](#frontend)
- [Data & Training Pipeline](#data--training-pipeline)
- [API Endpoints](#api-endpoints)
- [Setup and Run](#setup-and-run)
- [Notes](#notes)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Project Summary

EcoSort AI performs automatic e-waste classification from images, enriches predictions with material and recycling guidance, and stores results for audit, analytics, and confusion tracking.

Supported device classes:
- `Battery`
- `Keyboard`
- `Microwave`
- `Mobile`
- `Mouse`
- `PCB`
- `Player`
- `Printer`
- `Television`
- `Washing Machine`
- `Others`

## Features

- Image-based e-waste recognition with a robust deep learning model
- Multi-tier prediction feedback: strong, moderate, uncertain, non-e-waste
- Domain knowledge output for hazards, reusable materials, and recycling method
- History tracking with saved image metadata and prediction timeline
- Reliability analytics for model confidence and weak-case rate
- Confusion insights showing likely misclassification pairs
- Weekly activity reporting for operational monitoring

## Project Structure

Root layout:

- `README.md`
- `archive_old/`
  - legacy scripts and previous models
- `backend/`
  - `server.js`
  - `config/db.js`
  - `controllers/`
  - `models/Prediction.js`
  - `routes/`
  - `services/mlService.js`
  - `package.json`
- `frontend/`
  - `src/`
    - `App.tsx`
    - `main.tsx`
    - `components/`
    - `pages/`
    - `services/api.ts`
  - `package.json`
  - `vite.config.ts`
- `workspace/`
  - `ml_server.py`
  - `train_pro.py`
  - `evaluate_model.py`
  - `predict.py`
  - `ewaste_knowledge.py`
  - `class_mapping.json`
  - `ewaste_model_robust_v1.keras`
  - `ewaste_model_robust_v2.keras`
  - `final_dataset/`
  - `robust_pipeline/`

## Component Overview

### ML Microservice

Path: `workspace/ml_server.py`

Functionality:
- Loads `ewaste_model_robust_v2.keras`
- Uses `class_mapping.json` to resolve output indices to class names
- Preprocesses uploads to `224x224 RGB` and applies MobileNetV2 normalization
- Computes top-3 predictions, entropy, confidence gap, and prediction confidence
- Classifies images into:
  - `non_ewaste`
  - `uncertain`
  - `unknown_ewaste`
  - `moderate`
  - `strong`
- Returns prediction metadata including hazard, metals, recyclability, environmental impact, reuse guidance, and user advice

Endpoint:
- `POST /predict` with `file` field

### Backend API

Path: `backend/`

Key files:
- `server.js`: Express app and route registration
- `config/db.js`: MongoDB connection logic
- `controllers/predictController.js`: forwards image data to ML service, saves history
- `controllers/historyController.js`: returns recent prediction records
- `controllers/analyticsController.js`: computes tier distribution and reliability score
- `controllers/confusionController.js`: analyzes weak predictions for likely misclassification pairs
- `controllers/reportsController.js`: weekly usage report
- `models/Prediction.js`: MongoDB schema for prediction history
- `services/mlService.js`: sends multipart/form-data to the ML server

Routes:
- `POST /api/predict`
- `GET /api/history`
- `GET /api/analytics`
- `GET /api/confusion`
- `GET /api/reports/weekly`

Behavior:
- Saves predictions with `prediction_type`, `prediction`, `top3`, upload metadata, and base64 image content
- Provides analytics on model reliability and weak-case confusion patterns

### Frontend

Path: `frontend/`

Features:
- React + TypeScript + Vite UI
- Prediction upload and result display
- History timeline of recent scans
- Analytics dashboard for prediction quality
- Confusion insights for ambiguous predictions

Primary front-end files:
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/pages/PredictPage.tsx`
- `frontend/src/pages/HistoryPage.tsx`
- `frontend/src/pages/AnalyticsPage.tsx`
- `frontend/src/pages/ConfusionInsightsPage.tsx`
- `frontend/src/components/PredictionCard.tsx`
- `frontend/src/components/Toast.tsx`

## Data & Training Pipeline

Training and dataset files are located in `workspace/` and `workspace/robust_pipeline/`.

Important files:
- `workspace/train_pro.py`: two-phase MobileNetV2 transfer learning with class weights and label smoothing
- `workspace/evaluate_model.py`: offline model evaluation and confusion matrix generation
- `workspace/predict.py`: local inference helper
- `workspace/ewaste_knowledge.py`: domain knowledge for each e-waste class
- `workspace/class_mapping.json`: class index mapping used by the ML service
- `workspace/robust_pipeline/bulk_bing_crawler.py`: collects raw images
- `workspace/robust_pipeline/prepare_robust_dataset.py`: cleans, merges, and splits the dataset
- `workspace/robust_pipeline/dataset_final/`: organized `train`, `val`, `test` dataset folders

## API Endpoints

ML service:
- `POST http://127.0.0.1:8000/predict`

Backend service:
- `POST http://127.0.0.1:5000/api/predict`
- `GET http://127.0.0.1:5000/api/history`
- `GET http://127.0.0.1:5000/api/analytics`
- `GET http://127.0.0.1:5000/api/confusion`
- `GET http://127.0.0.1:5000/api/reports/weekly`

## Setup and Run

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB running on `localhost:27017`

### 1) Start the ML microservice

```powershell
cd workspace
pip install tensorflow fastapi uvicorn pillow numpy scikit-learn matplotlib seaborn icrawler pymongo
python train_pro.py  # optional if model already exists
uvicorn ml_server:app --reload --host 127.0.0.1 --port 8000
```

### 2) Start the backend API

```powershell
cd backend
npm install
node server.js
```

### 3) Start the frontend app

```powershell
cd frontend
npm install
npm run dev
```

### 4) Verify endpoints

```powershell
curl -X POST http://127.0.0.1:5000/api/predict -F "image=@/path/to/image.jpg"
curl http://127.0.0.1:5000/api/history
curl http://127.0.0.1:5000/api/analytics
curl http://127.0.0.1:5000/api/confusion
```

## Notes

- The backend stores prediction history in MongoDB with image base64 and prediction metadata.
- The ML server returns a `prediction_type` that can be one of: `strong`, `moderate`, `uncertain`, `unknown_ewaste`, or `non_ewaste`.
- Confusion analytics are derived from predictions where the top two classes have a small confidence gap.

## Future Enhancements

- Add object detection for multi-device frames
- Enable active learning from weak or uncertain predictions
- Add Docker Compose for the ML service, API, frontend, and MongoDB
- Add backend and frontend unit/integration tests
- Add richer dashboard visualizations and report exports

## License

Academic / research use.
