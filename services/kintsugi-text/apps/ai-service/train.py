import os
import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
CSV_PATH = os.path.join(DATA_DIR, "turkish_toxic_language.csv")

DOMAIN_SAMPLES = [
    # Metin, is_toxic, is_hate, is_spam, is_threat
    # Temiz & Mecaz / Masum Tuzak Cümleler
    ("Bu harika projeyi hazırlayan herkesin eline sağlık", 0, 0, 0, 0),
    ("Bu maçı kazanmak için son saniyeye kadar savaşacağız", 0, 0, 0, 0),
    ("Hava bugün gerçekten çok güzel parçalı bulutlu", 0, 0, 0, 0),
    ("Ateş gibi yandım seni görünce aşık oldum", 0, 0, 0, 0),
    ("Aferin sana yine harikalar yaratmışsın gerçekten", 0, 0, 0, 0),
    ("Teşekkürler sağolun harika iş çıkarmışsınız", 0, 0, 0, 0),
    ("Malatya kayısısı gerçekten çok lezzetli ve meşhurdur", 0, 0, 0, 0),
    ("Mustafa Kemal Atatürk ülkemizin kurucusudur", 0, 0, 0, 0),
    ("Bugün hava durumu çok normal görünüyor", 0, 0, 0, 0),
    ("Bu raporda bazı belgeler ve faturalar eksik", 0, 0, 0, 0),
    ("Hafta sonu sahilde bisiklet sürdük", 0, 0, 0, 0),
    ("Bu dosyaları lütfen müdüre götür", 0, 0, 0, 0),
    ("Maliyet muhasebesi ve malzeme tedariği yapıldı", 0, 0, 0, 0),
    ("Koç Üniversitesi öğrencileri harika projeler yapıyor", 0, 0, 0, 0),

    # Örtük Tehdit & Şiddet
    ("Seninle sonra görüşeceğiz bu iş burada bitmedi", 1, 0, 0, 1),
    ("Seni bulduğum yerde yapacağımı bilirim hesabını vereceksin", 1, 0, 0, 1),
    ("Seni ortadan kaldırmak çok zor olmasa gerek", 1, 0, 0, 1),
    ("Akşam evinin önüne geleceğim seni rahat bırakmam", 1, 0, 0, 1),
    ("Seni geberteceğim bekle sen sokakta", 1, 0, 0, 1),
    ("Nerede oturduğunu biliyorum hesabını soracağım", 1, 0, 0, 1),
    ("Seni bulduğum yerde gününü göreceksin", 1, 0, 0, 1),
    ("Hayatını karartacağım senin bekle", 1, 0, 0, 1),

    # Spam & Yasadışı Bahis
    ("Günde 5000 TL kazanmak için hemen tıkla http://spam-link.com", 0, 0, 1, 0),
    ("Azo k4zin0 bonusu için hemen üye ol Whatsapp 05551112233", 0, 0, 1, 0),
    ("Anında 1000 TL deneme bonusu kazanmak için t.me/bahissitesi adresine tıkla", 0, 0, 1, 0),
    ("Yatırımsız şartsız 500 TL bonus hemen üye ol bet365 casino", 0, 0, 1, 0),
    ("Bedava kupon ve garanti kazanç için whatsapp grubumuza katılın", 0, 0, 1, 0),
    ("Canlı rulet ve slot oyunlarında %100 hoşgeldin bonusu kazan", 0, 0, 1, 0),
    ("Kolay yoldan günlük para kazanmak için linke tıkla", 0, 0, 1, 0),
    ("Deneme bonusu veren bahis siteleri için profildeki linke girin", 0, 0, 1, 0),

    # Nefret Söylemi & Ayrımcılık
    ("Senin gibilerin bu ülkede yaşamaya hakkı yok defolun gidin", 1, 1, 0, 0),
    ("Bu gruptaki insanlardan nefret ediyorum hepsi aşağılık pislik", 1, 1, 0, 0),
    ("Bütün mülteciler defolsun gitsin pislikler", 1, 1, 0, 0)
]

def train_and_save_models():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("=" * 60)
    print("🚀 [KintsugiText] Training AI Moderation Models on 77K+ Dataset")
    print("=" * 60)

    texts = []
    y_tox = []
    y_hate = []
    y_spam = []
    y_threat = []

    # 1. Load HuggingFace Turkish Toxic Dataset if available
    if os.path.exists(CSV_PATH):
        print(f"📖 Loading Turkish Toxic Dataset from {CSV_PATH}...")
        t0 = time.time()
        df = pd.read_csv(CSV_PATH).dropna(subset=['text', 'target', 'is_toxic'])
        print(f"✅ Loaded {len(df):,} rows in {time.time() - t0:.2f}s.")

        # Map targets to our 4 categories
        csv_texts = df['text'].astype(str).tolist()
        csv_tox = df['is_toxic'].astype(int).tolist()
        csv_hate = df['target'].isin(['RACIST', 'SEXIST']).astype(int).tolist()
        csv_spam = [0] * len(df)
        csv_threat = [0] * len(df)

        texts.extend(csv_texts)
        y_tox.extend(csv_tox)
        y_hate.extend(csv_hate)
        y_spam.extend(csv_spam)
        y_threat.extend(csv_threat)
    else:
        print(f"⚠️ {CSV_PATH} not found. Training on domain samples only.")

    # 2. Add Domain Specific Samples (multiplied to balance weight)
    for _ in range(50):
        for sample in DOMAIN_SAMPLES:
            texts.append(sample[0])
            y_tox.append(sample[1])
            y_hate.append(sample[2])
            y_spam.append(sample[3])
            y_threat.append(sample[4])

    print(f"\n📊 Total Training Corpus: {len(texts):,} sentences.")

    # 3. Vectorization with TF-IDF (1-3 N-Grams)
    print("⚙️ Vectorizing with TF-IDF (n-gram 1-3, max_features=30,000)...")
    t1 = time.time()
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=30000,
        sublinear_tf=True
    )
    X = vectorizer.fit_transform(texts)
    print(f"✅ Vectorized feature matrix: {X.shape} in {time.time() - t1:.2f}s.")

    # 4. Train Classifiers
    print("🧠 Training Logistic Regression Classifiers...")
    t2 = time.time()
    clf_tox = LogisticRegression(C=2.5, max_iter=200).fit(X, np.array(y_tox))
    clf_hate = LogisticRegression(C=2.5, max_iter=200).fit(X, np.array(y_hate))
    clf_spam = LogisticRegression(C=3.0, max_iter=200).fit(X, np.array(y_spam))
    clf_threat = LogisticRegression(C=3.0, max_iter=200).fit(X, np.array(y_threat))
    print(f"✅ All 4 classifiers trained in {time.time() - t2:.2f}s.")

    # 5. Save Model Artifacts
    print("💾 Saving model artifacts to disk...")
    joblib.dump(vectorizer, os.path.join(MODELS_DIR, "vectorizer.joblib"), compress=3)
    joblib.dump(clf_tox, os.path.join(MODELS_DIR, "clf_tox.joblib"), compress=3)
    joblib.dump(clf_hate, os.path.join(MODELS_DIR, "clf_hate.joblib"), compress=3)
    joblib.dump(clf_spam, os.path.join(MODELS_DIR, "clf_spam.joblib"), compress=3)
    joblib.dump(clf_threat, os.path.join(MODELS_DIR, "clf_threat.joblib"), compress=3)

    print(f"🎉 Model artifacts successfully saved to: {MODELS_DIR}")
    return True

if __name__ == "__main__":
    train_and_save_models()
