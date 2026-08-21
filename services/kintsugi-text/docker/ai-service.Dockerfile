# Production Dockerfile for Python FastAPI AI Service
FROM python:3.11-slim AS base
WORKDIR /app

COPY apps/ai-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/ai-service/ .

EXPOSE 8000
CMD ["python", "main.py"]
