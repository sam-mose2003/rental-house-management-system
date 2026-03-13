import urllib.request
import json
import time

def diagnose_issue():
    print("=== RHMS Frontend Issue Diagnosis ===")
    
    # Test 1: Direct API call
    print("\n1. Testing direct API connection...")
    try:
        with urllib.request.urlopen("http://localhost:5000/api/houses?vacant=1") as response:
            if response.getcode() == 200:
                data = json.loads(response.read().decode())
                print(f"   Backend API working: Found {len(data)} vacant houses")
            else:
                print(f"   Backend API error: {response.getcode()}")
    except Exception as e:
        print(f"   Connection error: {e}")
    
    # Test 2: Check frontend server
    print("\n2. Testing frontend server...")
    try:
        with urllib.request.urlopen("http://localhost:5173") as response:
            if response.getcode() == 200:
                print("   Frontend server running")
                print("   ✅ Frontend server running")
            else:
                print(f"   ❌ Frontend server error: {response.getcode()}")
    except Exception as e:
        print(f"   ❌ Frontend connection error: {e}")
    
    # Test 3: Simulate frontend API call
    print("\n3. Simulating frontend fetch...")
    try:
        # This simulates what the frontend should be doing
        import urllib.request
        req = urllib.request.Request(
            "http://localhost:5000/api/houses?vacant=1",
            headers={
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173'
            }
        )
        
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 200:
                data = json.loads(response.read().decode())
                print("   ✅ Simulated frontend call successful: {len(data)} houses")
                
                # Check CORS headers
                headers = dict(response.headers.items())
                cors_header = headers.get('Access-Control-Allow-Origin', '')
                print(f"   CORS Header: {cors_header}")
                
            else:
                print(f"   ❌ Simulated frontend call failed: {response.getcode()}")
    except Exception as e:
        print(f"   ❌ Simulated frontend call error: {e}")
    
    print("\n=== Diagnosis Complete ===")
    print("If tests 1-3 pass, the issue is likely in:")
    print("- Frontend JavaScript code")
    print("- Browser console errors")
    print("- Network connectivity issues")
    print("\nNext steps:")
    print("1. Open http://localhost:5173 in browser")
    print("2. Open Developer Tools (F12)")
    print("3. Check Console tab for errors")
    print("4. Try to register a tenant")
    print("5. Look for 'Could not load houses' error")

if __name__ == "__main__":
    diagnose_issue()
