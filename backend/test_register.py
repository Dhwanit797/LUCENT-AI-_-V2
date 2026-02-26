import urllib.request, json
req = urllib.request.Request(
    'http://localhost:8000/auth/register',
    data=json.dumps({'full_name': 'Test User', 'email': 'newuser@test.com', 'password': 'password123'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
try:
    resp = urllib.request.urlopen(req)
    print('SUCCESS:', resp.read().decode())
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print('ERROR', e.code, body)
except Exception as ex:
    print('EXCEPTION:', ex)
