# Docker Preparation Notes — EcoSort AI

## New Structure (Docker-ready)

```
e-waste-segregation-system/
├── frontend/          ← React + Vite (port 5173 dev / 80 prod)
├── backend/           ← Node.js + Express (port 5000)
├── ml-service/        ← Python + FastAPI + TensorFlow (port 8000)
├── training/          ← Offline pipeline (NOT containerized)
├── workspace/         ← Original workspace (preserved, NOT containerized)
└── archive_old/       ← Legacy archive (preserved, NOT containerized)
```

---

## Service Startup Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # development (port 5173)
npm run build        # production build → dist/
npm run preview      # preview production build
```

### Backend
```bash
cd backend
npm install
node server.js       # port 5000
```

### ML Service
```bash
cd ml-service
pip install -r requirements.txt
uvicorn ml_server:app --reload --host 0.0.0.0 --port 8000
```

### MongoDB
```
docker run -d -p 27017:27017 mongo:7
# OR use Docker Compose service name: mongodb
```

---

## Required Environment Variables (to be added before Dockerization)

### Backend
| Variable       | Current hardcoded value              | Docker value              |
|----------------|--------------------------------------|---------------------------|
| MONGO_URI      | mongodb://127.0.0.1:27017/ewasteDB   | mongodb://mongodb:27017/ewasteDB |
| ML_SERVICE_URL | http://127.0.0.1:8000/predict        | http://ml-service:8000/predict   |
| PORT           | 5000 (hardcoded in server.js)        | 5000                      |

### Frontend
| Variable         | Current hardcoded value       | Docker value                    |
|------------------|-------------------------------|---------------------------------|
| VITE_API_BASE_URL | http://localhost:5000/api    | http://backend:5000/api OR via Vite proxy |

---

## Hardcoded URLs That Must Change for Docker

1. `backend/config/db.js` line 5:
   `mongodb://127.0.0.1:27017/ewasteDB`
   → Replace with: `process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ewasteDB"`

2. `backend/services/mlService.js` line 9:
   `http://127.0.0.1:8000/predict`
   → Replace with: `process.env.ML_SERVICE_URL || "http://127.0.0.1:8000/predict"`

3. `frontend/src/services/api.ts` line 4:
   `http://localhost:5000/api`
   → Replace with: `import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"`

---

## Python Dependencies (ml-service/requirements.txt)

```
tensorflow>=2.13.0
fastapi>=0.104.0
uvicorn>=0.24.0
pillow>=10.0.0
numpy>=1.24.0
python-multipart>=0.0.6
```

## Node.js Dependencies

### backend/package.json
- express, cors, mongoose, multer, axios, nodemon

### frontend/package.json
- react, react-dom, react-router-dom, axios, lucide-react, recharts
- devDeps: vite, typescript, @vitejs/plugin-react, eslint

---

## Trained Model Location

- Runtime model: `ml-service/ewaste_model_robust_v2.keras`
- The `.keras` file is gitignored — must be volume-mounted or baked into the Docker image
- Legacy v1 model: `workspace/ewaste_model_robust_v1.keras` (used only by workspace/predict.py)

---

## MongoDB

- Database name: `ewasteDB`
- Collection: `predictions` (Mongoose model name: `Prediction`)
- No authentication configured currently
- Data is NOT persisted across container restarts without a named volume

---

## Services NOT to Containerize

- `training/` — offline pipeline, runs manually on a machine with GPU/dataset access
- `workspace/` — original workspace preserved for reference
- `archive_old/` — legacy scripts, preserved for reference

---

## Recommended Docker Compose Services

```
services:
  frontend    → build: ./frontend,  port 5173:5173 (dev) or 80:80 (prod)
  backend     → build: ./backend,   port 5000:5000
  ml-service  → build: ./ml-service, port 8000:8000
  mongodb     → image: mongo:7,     port 27017:27017, named volume
```

---

## Risks / Notes

- The `.keras` model file is gitignored and large — needs a strategy (Docker COPY in Dockerfile, or volume mount)
- `frontend/src/services/api.ts` uses a hardcoded `localhost:5000` — in production Docker, this must use the container service name or a reverse proxy (nginx)
- Backend stores full base64 images in MongoDB — no separate file storage service needed, but document size may grow large
- `training/robust_pipeline/dataset_final/` is gitignored — datasets are local only
