# EcoSort AI — E-Waste Segregation and Recycling Management System

> A complete AI-driven system for automatic electronic waste classification, hazard analysis, and recycling intelligence.

## Table of Contents

- [Project Summary](#project-summary)
- [Architecture](#architecture)
- [Implementation Details](#implementation-details)
  - [ML Microservice](#ml-microservice)
  - [Backend API](#backend-api)
  - [Frontend](#frontend)
- [Datasets & Training](#datasets--training)
- [Analytics & History](#analytics--history)
- [API Endpoints](#api-endpoints)
- [Setup and Run](#setup-and-run)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Project Summary

EcoSort AI is an e-waste classification and recycling assistant. It takes an uploaded image of a discarded device, uses a TensorFlow MobileNetV2 model to classify into one of 10 e-waste categories, enriches the response with domain knowledge, and stores the prediction history with reliability analytics.

Supported classes: `Battery`, `Keyboard`, `Microwave`, `Mobile`, `Mouse`, `PCB`, `Player`, `Printer`, `Television`, `Washing Machine`.

## Architecture

- **ML microservice** (FastAPI + TensorFlow), port `8000`
- **Backend API** (Node.js + Express), port `5000`
- **Frontend** (React + TypeScript + Vite), default Vite port `5173`
- **Database** MongoDB local `27017`

## Implementation Details

### ML Microservice

Path: `workspace/ml_server.py`

- Loads `workspace/ewaste_model_robust_v1.keras`
- Uses `workspace/ewaste_knowledge.py` for hazard, metals, recyclability, environmental impact, and user guidance.
- Endpoint: `POST /predict` (field: `file`)
- Confidence tiers: `strong` (>=0.75), `moderate` (0.45-0.74), `weak` (<0.45)
- Returns predicted class, confidence, top alternatives, knowledge metadata, and advisory text.

### Backend API

Path: `backend/`

- `server.js`: app setup, CORS, routes
- `backend/routes/*`: Express routes for predict/history/analytics/confusion
- `backend/controllers/*`: controllers for business logic
- `backend/services/mlService.js`: proxy to `http://localhost:8000/predict`
- `backend/models/Prediction.js`: Mongoose schema
- `backend/config/db.js`: MongoDB connection

Behavior:
- `POST /api/predict` handles `multipart/form-data` field `image`, forwards to FastAPI, saves payload to MongoDB, returns full payload.
- `GET /api/history` returns 20 latest predictions sorted by createdAt.
- `GET /api/analytics` returns model reliability numbers and tier breakdown.
- `GET /api/confusion` returns weak prediction confusion-trend mapping.

### Frontend

Path: `frontend/`

- React + TypeScript + Vite app.
- Main service file: `frontend/src/services/api.ts`.
- Pages: `PredictPage.tsx`, `HistoryPage.tsx`, `AnalyticsPage.tsx`, `ConfusionInsightsPage.tsx`.
- Sends image to `POST /api/predict` and reads analytics/history/confusion endpoints.

## Datasets & Training

Workspace structure:

- `workspace/final_dataset/{train,val,test}/{class}`
- `workspace/robust_pipeline/bulk_bing_crawler.py` collects web images
- `workspace/robust_pipeline/prepare_robust_dataset.py` merges, dedups, split
- `workspace/train_pro.py` two-phase MobileNetV2 transfer learning
- `workspace/evaluate_model.py` classification report + confusion matrix

## Analytics & History

- Analytics endpoint computes:
  - total predictions
  - strong/moderate/weak counts and weak rate
  - reliability score
- Confusion endpoint: frequent misclassifications among weak predictions
- History persistence supports active learning and audit.

## API Endpoints

- ML service: `POST http://localhost:8000/predict`
- Backend:
  - `POST http://localhost:5000/api/predict` (image upload)
  - `GET http://localhost:5000/api/history`
  - `GET http://localhost:5000/api/analytics`
  - `GET http://localhost:5000/api/confusion`

## Setup and Run

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB running on `localhost:27017`

### 1) ML service setup

```powershell
cd workspace
pip install tensorflow fastapi uvicorn pillow numpy scikit-learn matplotlib seaborn icrawler pymongo
python train_pro.py  # optional if model already present
uvicorn ml_server:app --reload --host 127.0.0.1 --port 8000
```

### 2) Backend setup

```powershell
cd backend
npm install
node server.js
```

### 3) Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

### 4) Quick API test

```bash
curl -X POST http://localhost:5000/api/predict -F "image=@/path/to/image.jpg"
curl http://localhost:5000/api/history
curl http://localhost:5000/api/analytics
curl http://localhost:5000/api/confusion
```

## Testing and Validation

- Run inference tests via frontend UI or `curl`.
- Use `workspace/evaluate_model.py` for offline metrics.
- Confirm MongoDB entries in `predictions` collection.

## Future Enhancements

- Add object detection for multi-device frames (e.g., YOLO)
- Add active learning from weak predictions
- Dashboard charts and flood maps
- Docker Compose with separate `ml-service`, `api`, `frontend`, and `mongo`
- Add unit/integration tests for backend and frontend

## License

Academic/research use.
