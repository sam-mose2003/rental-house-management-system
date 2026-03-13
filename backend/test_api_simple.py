import urllib.request
import urllib.parse
import json

def test_api():
    try:
        # Test the houses API
        url = "http://localhost:5000/api/houses?vacant=1"
        
        print(f"Testing API: {url}")
        
        with urllib.request.urlopen(url) as response:
            status_code = response.getcode()
            print(f"Status Code: {status_code}")
            
            if status_code == 200:
                data = json.loads(response.read().decode())
                print(f"Success! Found {len(data)} vacant houses:")
                for house in data[:5]:  # Show first 5
                    print(f"  - {house['house_number']}: {house['status']}")
            else:
                print(f"Error response: {response.read().decode()}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api()
