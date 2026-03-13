import urllib.request
import json

def test_tenant_creation():
    try:
        print("Testing tenant creation...")
        
        # Test data for tenant creation
        tenant_data = {
            "name": "Test User",
            "national_id": "123456789",
            "phone": "0712345678", 
            "email": "test@example.com",
            "house_number": "A101",
            "move_in_date": "2026-03-15"
        }
        
        # Convert to JSON and prepare request
        data = json.dumps(tenant_data).encode('utf-8')
        
        req = urllib.request.Request(
            "http://localhost:5000/api/tenants",
            data=data,
            headers={
                'Content-Type': 'application/json',
                'Content-Length': len(data)
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            response_data = response.read().decode()
            
            print(f"Status Code: {status}")
            print(f"Response: {response_data}")
            
            if status == 201:
                print("SUCCESS: Tenant created successfully!")
                return True
            else:
                print(f"ERROR: Failed to create tenant")
                return False
                
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    test_tenant_creation()
