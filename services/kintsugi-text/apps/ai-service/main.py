from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import TurkishModerationMLModel
from cache import AICacheService

app = FastAPI(
    title="KintsugiText Python AI Moderation Service",
    description="Scikit-Learn & NLP Tabanlı Türkçe İçerik Güvenlik ve Moderasyon Servisi",
    version="1.0.0"
)

# Python ML Model & Cache Service Initializations
ml_model = TurkishModerationMLModel()
ai_cache = AICacheService()

class AnalyzeRequest(BaseModel):
    text: str
    entity_type: str = "comment"

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "KintsugiText Python AI Microservice",
        "model": "Scikit-Learn TF-IDF + Multi-Output Logistic Regression",
        "redis_cluster_enabled": ai_cache.is_cluster
    }

@app.post("/predict")
def predict_text(req: AnalyzeRequest):
    if not req.text or len(req.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Metin boş olamaz")

    # Check Cache
    cached_response = ai_cache.get(req.text)
    if cached_response:
        cached_response["cached"] = True
        return cached_response

    scores = ml_model.predict(req.text)
    
    violations = []
    if scores["implicit_threat"] >= 0.5:
        violations.append({
            "category": "IMPLICIT_THREAT",
            "score": scores["implicit_threat"],
            "reason": "Python ML Modeli Tespiti: Örtük tehdit / şiddet söylemi"
        })
    if scores["hate_speech"] >= 0.5:
        violations.append({
            "category": "HATE_SPEECH",
            "score": scores["hate_speech"],
            "reason": "Python ML Modeli Tespiti: Nefret söylemi"
        })
    if scores["spam"] >= 0.6:
        violations.append({
            "category": "SPAM",
            "score": scores["spam"],
            "reason": "Python ML Modeli Tespiti: Yüksek spam / reklam tespiti"
        })

    response_payload = {
        "provider": "Python ML Engine (Scikit-Learn TF-IDF)",
        "scores": scores,
        "violations": violations,
        "cached": False
    }

    # Store in Cache
    ai_cache.set(req.text, response_payload)

    return response_payload

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
