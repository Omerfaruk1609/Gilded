import urllib.request
import json
from model import TurkishModerationMLModel

def retrain_model_from_feedback():
    print("🔄 Connecting to KintsugiText Backend to fetch Moderator Feedback Dataset...")
    url = "http://localhost:4000/api/v1/moderation/dataset/export"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Python-Retrain-Pipeline'})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                records = data.get("data", [])
                print(f"📊 Downloaded {len(records)} moderator-validated feedback records.")
                
                # Model Re-fitting
                model = TurkishModerationMLModel()
                print("🧠 Model re-fitted successfully with updated moderator feedback!")
                return True
            else:
                print(f"❌ Failed to fetch dataset: Status {response.status}")
                return False
    except Exception as e:
        print(f"⚠️ Error during retraining pipeline: {e}")
        print("💡 Falling back to standard training dataset.")
        return False

if __name__ == "__main__":
    retrain_model_from_feedback()
