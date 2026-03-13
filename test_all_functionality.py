import urllib.request
import urllib.parse
import json

def test_api_endpoint(url, description):
    """Test a single API endpoint"""
    try:
        print(f"\nTesting: {description}")
        print(f"   URL: {url}")
        
        with urllib.request.urlopen(url) as response:
            status = response.getcode()
            if status == 200:
                data = json.loads(response.read().decode())
                if isinstance(data, list):
                    print(f"   SUCCESS: Found {len(data)} items")
                    if data and len(data) > 0:
                        print(f"   Sample: {data[0]}")
                else:
                    print(f"   SUCCESS: {data}")
                return True
            else:
                print(f"   ERROR: HTTP {status}")
                return False
                
    except Exception as e:
        print(f"   ERROR: {e}")
        return False

def main():
    print("RHMS Project - Complete Functionality Test")
    print("=" * 50)
    
    # Test all API endpoints
    tests = [
        ("http://localhost:5000/api/houses", "Get all houses"),
        ("http://localhost:5000/api/houses?vacant=1", "Get vacant houses"),
        ("http://localhost:5000/api/dashboard-stats", "Get dashboard stats"),
        ("http://localhost:5000/api/tenants", "Get all tenants"),
        ("http://localhost:5000/api/pending-tenants", "Get pending tenants"),
        ("http://localhost:5000/api/payments", "Get all payments"),
        ("http://localhost:5000/api/maintenance-requests", "Get maintenance requests"),
    ]
    
    passed = 0
    total = len(tests)
    
    for url, description in tests:
        if test_api_endpoint(url, description):
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"TEST RESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("ALL TESTS PASSED! Backend is working correctly.")
    else:
        print("Some tests failed. Check the errors above.")
    
    print("\nAccess Points:")
    print("   Tenant Portal: http://localhost:5173")
    print("   Admin Dashboard: http://localhost:5173/admin.html")
    print("   API Test: http://localhost:5173/test-api.html")

if __name__ == "__main__":
    main()
