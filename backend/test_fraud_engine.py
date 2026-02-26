"""
End-to-end test for the upgraded FraudLens engine.
"""
import sys, io, json
sys.path.insert(0, r"C:\odooooo\ai-business-dashboard-main\ai-business-dashboard-main\backend")

# ── 1. Unit test: fraud_engine ────────────────────────────────────────────
from services.fraud_engine import compute_fraud_score, normalize_columns

# Column alias normalisation
cols = normalize_columns(["txn_id", "amt", "date", "category", "age_days"])
assert cols.get("txn_id") == "transaction_id", f"alias fail: {cols}"
assert cols.get("amt") == "amount", f"alias fail: {cols}"
assert cols.get("date") == "timestamp", f"alias fail: {cols}"
print("✓ Column alias normalisation OK")

# High-risk transaction (gambling + night + new account + high amount)
tx_high = {
    "transaction_id": "TX001",
    "amount": 25000,
    "timestamp": "2024-01-15 02:30:00",
    "merchant_category": "gambling",
    "account_age_days": 5,
}
res = compute_fraud_score(tx_high, [])
# gambling(15) + night(10) + new_account_age(15) + high_amount_no_history(15) = 55 (Suspicious)
# With no history, amount check gives +15 (>10k). Score = 55 = Suspicious.
assert res["risk_label"] in ("High Risk", "Suspicious"), f"expected flagged, got {res}"
assert res["risk_score"] >= 30, f"score too low: {res}"
assert res["breakdown"]["merchant_risk"] == 15
assert res["breakdown"]["time_anomaly"] == 10
assert res["breakdown"]["account_age"] == 15
print(f"✓ High-risk tx score={res['risk_score']} label={res['risk_label']}")

# Safe transaction
tx_safe = {
    "transaction_id": "TX002",
    "amount": 50,
    "timestamp": "2024-01-15 10:00:00",
    "merchant_category": "grocery",
    "account_age_days": 365,
}
history = [{"amount": 60, "timestamp": "2024-01-14 10:00:00"} for _ in range(10)]
res_safe = compute_fraud_score(tx_safe, history)
assert res_safe["risk_label"] == "Safe", f"expected Safe, got {res_safe}"
print(f"✓ Safe tx score={res_safe['risk_score']} label={res_safe['risk_label']}")

# Amount anomaly: 3x average
history_avg = [{"amount": 100, "timestamp": "2024-01-14 10:00:00"} for _ in range(5)]
tx_anomaly = {"transaction_id": "TX003", "amount": 400, "timestamp": "2024-01-15 11:00:00",
              "merchant_category": "retail", "account_age_days": 180}
res_a = compute_fraud_score(tx_anomaly, history_avg)
assert res_a["breakdown"]["amount_anomaly"] == 25, f"expected 25, got {res_a['breakdown']}"
print(f"✓ Amount anomaly 3x → score component=25")

# Velocity check: 5+ txns in 10min window
from datetime import datetime, timedelta
base = datetime(2024, 1, 15, 14, 0, 0)
velocity_history = [
    {"amount": 100, "timestamp": (base + timedelta(minutes=i)).strftime("%Y-%m-%d %H:%M:%S")}
    for i in range(6)
]
tx_vel = {"transaction_id": "TX004", "amount": 100,
          "timestamp": (base + timedelta(minutes=3)).strftime("%Y-%m-%d %H:%M:%S"),
          "merchant_category": "retail", "account_age_days": 200}
res_v = compute_fraud_score(tx_vel, velocity_history)
assert res_v["breakdown"]["velocity"] == 20, f"expected 20, got {res_v['breakdown']}"
print(f"✓ Velocity check 5+ txns → score component=20")

# Structuring detection
struct_history = [{"amount": 9950}, {"amount": 9980}, {"amount": 10010}]
tx_struct = {"transaction_id": "TX005", "amount": 9950, "timestamp": None,
             "merchant_category": "retail", "account_age_days": 200}
res_s = compute_fraud_score(tx_struct, struct_history)
assert res_s["breakdown"]["structuring"] == 15, f"expected 15, got {res_s['breakdown']}"
print(f"✓ Structuring detection → score component=15")

# ── 2. Integration test: upload endpoint via HTTP ─────────────────────────
import urllib.request, urllib.error, urllib.parse

BASE = "http://127.0.0.1:8000"

def http(method, path, data=None, headers=None, token=None):
    req = urllib.request.Request(
        BASE + path,
        data=data,
        headers={**(headers or {}), **({"Authorization": f"Bearer {token}"} if token else {})},
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

# Register + login
import random, string
suffix = "".join(random.choices(string.ascii_lowercase, k=6))
_, reg = http("POST", "/auth/register",
    data=json.dumps({"email": f"test_{suffix}@x.com", "password": "pass123", "name": "T"}).encode(),
    headers={"Content-Type": "application/json"})
token = reg.get("access_token")
assert token, f"No token: {reg}"
print("✓ Auth OK")

# Upload a realistic CSV
csv_content = (
    "transaction_id,amount,timestamp,merchant_category,account_age_days\n"
    "TX001,25000,2024-01-15 02:30:00,gambling,3\n"
    "TX002,50,2024-01-15 10:00:00,grocery,730\n"
    "TX003,9950,2024-01-15 11:00:00,retail,200\n"
    "TX004,9980,2024-01-15 11:02:00,retail,200\n"
    "TX005,15000,2024-01-15 14:00:00,wire_transfer,25\n"
    "TX006,80,2024-01-16 09:00:00,grocery,400\n"
    "TX007,100,2024-01-16 10:00:00,retail,600\n"
)

boundary = "------FormBoundary" + suffix
body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="test_fraud.csv"\r\n'
    f"Content-Type: text/csv\r\n\r\n"
    + csv_content +
    f"\r\n--{boundary}--\r\n"
).encode()

req = urllib.request.Request(
    BASE + "/fraud/upload-csv",
    data=body,
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    },
    method="POST",
)
with urllib.request.urlopen(req) as r:
    result = json.loads(r.read())

print(f"✓ Upload OK: {result['summary']}")
assert "transactions" in result, "missing transactions"
assert "summary" in result, "missing summary"
assert "chart_data" in result, "missing chart_data"
assert result["summary"]["total_transactions"] == 7
assert result["summary"]["high_risk_count"] >= 1, "TX001 should be high risk"
assert len(result["chart_data"]["risk_distribution"]) > 0
print(f"✓ Response structure correct")

# Verify TX001 is flagged (Suspicious or High Risk)
tx001 = next(t for t in result["transactions"] if t["transaction_id"] == "TX001")
assert tx001["risk_label"] in ("High Risk", "Suspicious"), f"TX001 should be flagged: {tx001}"
print(f"OK TX001 classified as {tx001['risk_label']} (score={tx001['risk_score']})")

# Verify TX002 is Safe
tx002 = next(t for t in result["transactions"] if t["transaction_id"] == "TX002")
assert tx002["risk_label"] == "Safe", f"TX002 should be Safe: {tx002}"
print(f"✓ TX002 correctly classified as Safe (score={tx002['risk_score']})")

# Test recommendations endpoint
status, recs = http("GET", "/fraud/recommendations", token=token)
assert status == 200, f"recommendations failed: {recs}"
assert isinstance(recs, list), "recs should be a list"
print(f"✓ /fraud/recommendations OK: {len(recs)} recommendation(s)")

# Test existing insights endpoint still works
status, insights = http("GET", "/fraud/insights", token=token)
assert status == 200
assert insights["total_transactions"] == 7
print(f"✓ /fraud/insights still works: {insights['total_transactions']} total")

# Test explain endpoint still works
status, explain = http("GET", f"/fraud/explain/TX001", token=token)
assert status == 200
print(f"✓ /fraud/explain/TX001 still works: {len(explain['points'])} points")

print("\n ALL TESTS PASSED")
