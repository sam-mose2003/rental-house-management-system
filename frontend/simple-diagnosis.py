import urllib.request
import json

def test_connection():
    print("=== Simple Connection Test ===")
    
    try:
        # Test backend API
        print("Testing backend API...")
        response = urllib.request.urlopen("http://localhost:5000/api/houses?vacant=1")
        if response.getcode() == 200:
            data = json.loads(response.read().decode())
            print(f"SUCCESS: Backend API working - {len(data)} houses found")
        else:
            print(f"ERROR: Backend API returned {response.getcode()}")
    except Exception as e:
        print(f"ERROR: Cannot connect to backend - {e}")
    
    try:
        # Test frontend server
        print("Testing frontend server...")
        response = urllib.request.urlopen("http://localhost:5173")
        if response.getcode() == 200:
            print("SUCCESS: Frontend server is running")
        else:
            print(f"ERROR: Frontend server returned {response.getcode()}")
    except Exception as e:
        print(f"ERROR: Cannot connect to frontend - {e}")
    
    print("\n=== Test Results ===")
    print("1. If both tests above show SUCCESS:")
    print("   - Both servers are running correctly")
    print("   - The issue is in frontend JavaScript or browser")
    print("2. If any test shows ERROR:")
    print("   - Check that the corresponding server is running")
    print("\n=== Browser Testing Instructions ===")
    print("1. Open http://localhost:5173 in your browser")
    print("2. Try to register a tenant")
    print("3. If you see 'Could not load houses' error:")
    print("   - Open Developer Tools (F12)")
    print("   - Go to Console tab")
    print("   - Look for red error messages")
    print("   - The error will show details about what failed")

if __name__ == "__main__":
    test_connection()
