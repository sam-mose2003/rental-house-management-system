import urllib.request
import json

def test_api():
    try:
        url = "http://localhost:5000/api/houses?vacant=1"
        print(f"Testing: {url}")
        
        with urllib.request.urlopen(url) as response:
            if response.getcode() == 200:
                data = json.loads(response.read().decode())
                print(f"✅ SUCCESS: Found {len(data)} vacant houses")
                if data:
                    print("Sample houses:")
                    for house in data[:3]:
                        print(f"  - {house['house_number']}: {house['status']}")
                return True
            else:
                print(f"❌ ERROR: Status {response.getcode()}")
                return False
                
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    test_api()
