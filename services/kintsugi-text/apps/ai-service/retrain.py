import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from train import train_and_save_models

def retrain_model_from_feedback():
    print("🔄 Connecting to KintsugiText Backend to fetch Moderator Feedback Dataset...")
    url = "http://localhost:4000/api/v1/moderation/dataset/export"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Python-Retrain-Pipeline'})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                records = data.get("data", [])
                print(f"📊 Downloaded {len(records)} moderator-validated feedback records.")
                train_and_save_models()
                print("🧠 Model re-fitted and saved to disk with updated dataset!")
                return True
            else:
                print(f"❌ Failed to fetch dataset: Status {response.status}")
                train_and_save_models()
                return False
    except Exception as e:
        print(f"⚠️ Could not reach backend: {e}")
        print("💡 Training from local dataset and saving fresh artifacts...")
        train_and_save_models()
        return True

if __name__ == "__main__":
    retrain_model_from_feedback()
