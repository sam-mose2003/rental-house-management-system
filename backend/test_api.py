import requests
import json

def test_api():
    try:
        # Test the houses API
        url = "http://localhost:5000/api/houses?vacant=1"
        
        print(f"Testing API: {url}")
        response = requests.get(url)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Found {len(data)} vacant houses:")
            for house in data[:5]:  # Show first 5
                print(f"  - {house['house_number']}: {house['status']}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api()
