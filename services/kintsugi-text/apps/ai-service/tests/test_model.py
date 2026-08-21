import pytest
import sys
import os

# Ensure apps/ai-service directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from model import TurkishModerationMLModel

@pytest.fixture(scope="module")
def model():
    return TurkishModerationMLModel()

def test_model_initialization(model):
    assert model.is_trained is True
    assert model.vectorizer is not None
    assert model.clf_tox is not None
    assert model.clf_hate is not None
    assert model.clf_spam is not None
    assert model.clf_threat is not None

def test_empty_and_none_prediction(model):
    res_empty = model.predict("")
    assert res_empty == {"toxicity": 0.0, "hate_speech": 0.0, "spam": 0.0, "implicit_threat": 0.0}

    res_none = model.predict(None)
    assert res_none == {"toxicity": 0.0, "hate_speech": 0.0, "spam": 0.0, "implicit_threat": 0.0}

def test_benign_text_prediction(model):
    res = model.predict("Bu harika projeyi hazırlayan herkesin eline sağlık")
    assert res["toxicity"] < 0.5
    assert res["hate_speech"] < 0.5
    assert res["spam"] < 0.5
    assert res["implicit_threat"] < 0.5

def test_false_positive_metaphor_traps_cleared(model):
    # Metaphor / competitive trap texts that must not be flagged
    traps = [
        "Bu maçı kazanmak için son saniyeye kadar savaşacağız",
        "Ateş gibi yandım seni görünce aşık oldum",
        "Aferin sana yine harikalar yaratmışsın gerçekten"
    ]
    for text in traps:
        res = model.predict(text)
        max_score = max(res.values())
        assert max_score < 0.5, f"False positive trap triggered on '{text}' with scores: {res}"

def test_implicit_threat_detection(model):
    threat_texts = [
        "Seni bulduğum yerde yapacağımı bilirim hesabını vereceksin",
        "Akşam evinin önüne geleceğim seni rahat bırakmam",
        "Seninle sonra görüşeceğiz bu iş burada bitmedi"
    ]
    for text in threat_texts:
        res = model.predict(text)
        assert res["implicit_threat"] >= 0.5, f"Failed to detect threat in '{text}': {res}"

def test_hate_speech_detection(model):
    hate_texts = [
        "Senin gibilerin bu ülkede yaşamaya hakkı yok",
        "Bu gruptaki insanlardan nefret ediyorum hepsi aşağılık"
    ]
    for text in hate_texts:
        res = model.predict(text)
        assert res["hate_speech"] >= 0.5, f"Failed to detect hate speech in '{text}': {res}"

def test_spam_detection(model):
    spam_texts = [
        "Günde 5000 TL kazanmak için hemen tıkla http://spam-link.com",
        "Azo k4zin0 bonusu için hemen üye ol Whatsapp 05551112233"
    ]
    for text in spam_texts:
        res = model.predict(text)
        assert res["spam"] >= 0.5, f"Failed to detect spam in '{text}': {res}"
