import urllib.request, json, urllib.parse

try:
    data = urllib.parse.urlencode({'username': 'john@test.com', 'password': 'password123'}).encode()
    req = urllib.request.Request('http://localhost:8001/api/auth/login', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())['access_token']
    print(f"Login successful, token: {token[:20]}...")
except Exception as e:
    print(f"Login failed: {e}")
    exit(1)

try:
    proj_data = json.dumps({'name': 'healthcare', 'description': 'monitoring system', 'target_platforms': 'web', 'target_audience': 'healthcare', 'expected_timeline': '3', 'budget_range': '$10k-$20k', 'key_features': 'Auth, payment', 'existing_systems': 'no'}).encode()
    req2 = urllib.request.Request('http://localhost:8001/api/projects/', data=proj_data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
    res2 = urllib.request.urlopen(req2)
    print("Project created:", res2.read().decode())
except Exception as e:
    import traceback
    print("Project creation failed:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
