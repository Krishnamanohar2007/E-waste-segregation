FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ml_server.py .
COPY ewaste_knowledge.py .
COPY class_mapping.json .
COPY ewaste_model_robust_v2.keras .

EXPOSE 8000

CMD ["uvicorn", "ml_server:app", "--host", "0.0.0.0", "--port", "8000"]
