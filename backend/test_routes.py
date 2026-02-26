import urllib.request
data = urllib.request.urlopen('http://localhost:8000/openapi.json').read().decode()
import json
schema = json.loads(data)
print('Routes:', list(schema['paths'].keys()))
