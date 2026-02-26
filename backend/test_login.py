import urllib.request, json

payload = json.dumps({'email': 'demo@business.ai', 'password': 'demo123'}).encode()
req = urllib.request.Request(
    'http://localhost:8000/auth/login',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
try:
    resp = urllib.request.urlopen(req)
    print('LOGIN SUCCESS:', resp.read().decode()[:120])
except urllib.error.HTTPError as e:
    print(f'LOGIN ERROR {e.code}:', e.read().decode())
