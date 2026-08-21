import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "KintsugiText" in data["service"]

def test_predict_benign_text():
    response = client.post("/predict", json={"text": "Bu harika projeyi hazırlayan herkesin eline sağlık"})
    assert response.status_code == 200
    data = response.json()
    assert data["provider"].startswith("Python ML Engine")
    assert "scores" in data
    assert len(data["violations"]) == 0

def test_predict_threat_text():
    response = client.post("/predict", json={"text": "Seni bulduğum yerde yapacağımı bilirim hesabını vereceksin"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["violations"]) > 0
    assert any(v["category"] == "IMPLICIT_THREAT" for v in data["violations"])

def test_predict_empty_text():
    response = client.post("/predict", json={"text": ""})
    assert response.status_code == 400
