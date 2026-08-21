import json
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from model import TurkishModerationMLModel

def run_benchmark():
    print("=========================================================")
    print("[+] KINTSUGI-TEXT ACCURACY & MODEL BENCHMARK SUITE")
    print("=========================================================")

    # Load Golden Dataset relative to script path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, "golden_dataset.json")

    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    model = TurkishModerationMLModel()

    tp = 0
    fp = 0
    tn = 0
    fn = 0

    false_positive_traps_tested = 0
    false_positive_traps_passed = 0

    print(f"\n[*] Testing {len(dataset)} Golden Dataset Samples...\n")

    for sample in dataset:
        text = sample["text"]
        expected = sample["expected_verdict"]
        is_trap = sample.get("is_false_positive_trap", False)

        preds = model.predict(text)
        max_score = max(preds.values())
        predicted_verdict = "REJECTED" if max_score >= 0.5 else "APPROVED"

        is_correct = (predicted_verdict == expected)

        if is_trap:
            false_positive_traps_tested += 1
            if predicted_verdict == "APPROVED":
                false_positive_traps_passed += 1

        if expected == "REJECTED" and predicted_verdict == "REJECTED":
            tp += 1
        elif expected == "APPROVED" and predicted_verdict == "REJECTED":
            fp += 1
        elif expected == "APPROVED" and predicted_verdict == "APPROVED":
            tn += 1
        elif expected == "REJECTED" and predicted_verdict == "APPROVED":
            fn += 1

        status_icon = "[PASS]" if is_correct else "[FAIL]"
        trap_label = " [TRAP TEST]" if is_trap else ""
        print(f"{status_icon}{trap_label} | Text: \"{text[:45]}...\" | Expected: {expected} | Pred: {predicted_verdict} (Risk: {int(max_score*100)}%)")

    # Metrics Calculation
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    accuracy = (tp + tn) / len(dataset)
    false_positive_rate = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    trap_success_rate = (false_positive_traps_passed / false_positive_traps_tested * 100) if false_positive_traps_tested > 0 else 100.0

    print("\n=========================================================")
    print("[*] BENCHMARK REPORT METRICS")
    print("=========================================================")
    print(f"Total Samples Tested     : {len(dataset)}")
    print(f"Accuracy (Genel Doğruluk): {accuracy * 100:.1f}%")
    print(f"Precision (Kesinlik)    : {precision * 100:.1f}%")
    print(f"Recall (Duyarlılık)      : {recall * 100:.1f}%")
    print(f"F1-Score                : {f1_score * 100:.1f}%")
    print(f"False Positive Rate (FPR): {false_positive_rate * 100:.1f}% (Yanlış Engelleme)")
    print(f"Masum Mecaz Başarısı    : {trap_success_rate:.1f}% ({false_positive_traps_passed}/{false_positive_traps_tested} Masum Cümle Geçti)")
    print("=========================================================\n")

if __name__ == "__main__":
    run_benchmark()
