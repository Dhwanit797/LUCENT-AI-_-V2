import requests

url = "http://localhost:8000/inventory/upload-csv"
files = {'file': open('test_inventory.csv', 'rb')}

try:
    response = requests.post(url, files=files)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Connection failed:", e)
