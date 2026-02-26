import urllib.request, json, traceback

payload = json.dumps({'full_name': 'Test User', 'email': 'brand_new@test.com', 'password': 'password123'}).encode()
req = urllib.request.Request(
    'http://localhost:8000/auth/register',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
try:
    resp = urllib.request.urlopen(req)
    print('SUCCESS:', resp.read().decode())
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f'HTTP {e.code}:', body)
except Exception as ex:
    traceback.print_exc()
