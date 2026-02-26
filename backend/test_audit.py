"""End-to-end audit: login, check status, upload CSV, check status again."""
import requests
import os

BASE = "http://127.0.0.1:8001"

# 1. Login
print("=" * 60)
print("STEP 1: Login")
r = requests.post(f"{BASE}/auth/login", json={"email": "demo@business.ai", "password": "demo123"})
print(f"  Status: {r.status_code}")
if r.status_code != 200:
    print(f"  ERROR: {r.text}")
    exit(1)
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"  Token: {token[:20]}...")

# 2. Check all status endpoints BEFORE upload
print("\n" + "=" * 60)
print("STEP 2: Status endpoints BEFORE upload")
for mod in ["inventory", "expense", "fraud", "green-grid"]:
    r = requests.get(f"{BASE}/{mod}/status", headers=headers)
    print(f"  /{mod}/status -> {r.status_code}: {r.json()}")

# 3. Upload CSVs and test
CSV_DIR = os.path.join(os.path.dirname(__file__), "..", "demo_csv_data")

print("\n" + "=" * 60)
print("STEP 3: Upload CSVs")

# Inventory
print("\n  --- Inventory ---")
csv_path = os.path.join(CSV_DIR, "inventory_test.csv")
with open(csv_path, "rb") as f:
    r = requests.post(f"{BASE}/inventory/upload-csv", headers=headers, files={"file": ("inventory_test.csv", f, "text/csv")})
print(f"  Upload: {r.status_code}: {r.json()}")

# Expense
print("\n  --- Expense ---")
csv_path = os.path.join(CSV_DIR, "expense_test.csv")
with open(csv_path, "rb") as f:
    r = requests.post(f"{BASE}/expense/upload-csv", headers=headers, files={"file": ("expense_test.csv", f, "text/csv")})
print(f"  Upload: {r.status_code}: {r.json()}")

# Fraud
print("\n  --- Fraud ---")
csv_path = os.path.join(CSV_DIR, "fraud_test.csv")
with open(csv_path, "rb") as f:
    r = requests.post(f"{BASE}/fraud/upload-csv", headers=headers, files={"file": ("fraud_test.csv", f, "text/csv")})
print(f"  Upload: {r.status_code}: {r.json()}")

# Green Grid
print("\n  --- Green Grid ---")
csv_path = os.path.join(CSV_DIR, "green_test.csv")
with open(csv_path, "rb") as f:
    r = requests.post(f"{BASE}/green-grid/upload-csv", headers=headers, files={"file": ("green_test.csv", f, "text/csv")})
print(f"  Upload: {r.status_code}: {r.json()}")

# 4. Check all status endpoints AFTER upload
print("\n" + "=" * 60)
print("STEP 4: Status endpoints AFTER upload")
for mod in ["inventory", "expense", "fraud", "green-grid"]:
    r = requests.get(f"{BASE}/{mod}/status", headers=headers)
    print(f"  /{mod}/status -> {r.status_code}: {r.json()}")

print("\n" + "=" * 60)
print("AUDIT COMPLETE")
