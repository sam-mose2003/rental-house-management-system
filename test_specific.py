import urllib.request
import json

def test_specific_endpoint(url, name):
    try:
        print(f"\nTesting {name}...")
        with urllib.request.urlopen(url) as response:
            print(f"Status: {response.getcode()}")
            if response.getcode() != 200:
                error_content = response.read().decode()
                print(f"Error content: {error_content}")
            else:
                data = json.loads(response.read().decode())
                print(f"Success: {data}")
    except Exception as e:
        print(f"Error: {e}")

test_specific_endpoint("http://localhost:5000/api/dashboard-stats", "Dashboard Stats")
test_specific_endpoint("http://localhost:5000/api/tenants", "Tenants")
test_specific_endpoint("http://localhost:5000/api/pending-tenants", "Pending Tenants")
