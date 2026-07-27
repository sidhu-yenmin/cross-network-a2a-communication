import sys, json
sys.path.append('company-network/backend')
from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from main import app
# pyrefly: ignore [missing-import]
import auth

client = TestClient(app)
res = client.post('/api/auth/signin', json={'email': 'madhusudha.yenmin@gmail.com', 'password': 'password123'})
token = res.json()['access_token']
print(f"Token: {token[:10]}...")

try:
    res2 = client.get('/api/gateway/incoming-requests', headers={'Authorization': f'Bearer {token}'})
    print(res2.status_code)
    print(res2.json())
except Exception as e:
    import traceback
    traceback.print_exc()
