import MySQLdb

# Database connection
mysql = MySQLdb.connect(
    host="localhost",
    user="root",
    password="",
    db="rhms"
)

cur = mysql.cursor()

# Check all tenants
print("=== ALL TENANTS ===")
cur.execute("SELECT id, name, email, status, house_number FROM tenants")
all_tenants = cur.fetchall()
for tenant in all_tenants:
    print(f"ID: {tenant[0]}, Name: {tenant[1]}, Email: {tenant[2]}, Status: {tenant[3]}, House: {tenant[4]}")

print(f"\nTotal tenants: {len(all_tenants)}")

# Check approved tenants only
print("\n=== APPROVED TENANTS ===")
cur.execute("SELECT id, name, house_number FROM tenants WHERE status = 'approved' ORDER BY name")
approved_tenants = cur.fetchall()
for tenant in approved_tenants:
    print(f"ID: {tenant[0]}, Name: {tenant[1]}, House: {tenant[2]}")

print(f"\nApproved tenants: {len(approved_tenants)}")

cur.close()
mysql.close()

print("\n=== HOUSES ===")
cur.execute("SELECT id, house_number, status FROM houses")
houses = cur.fetchall()
for house in houses:
    print(f"ID: {house[0]}, House: {house[1]}, Status: {house[2]}")

print(f"\nTotal houses: {len(houses)}")

cur.close()
mysql.close()

# Test query like in add_payment
print("\n=== TEST PAYMENT QUERY ===")
try:
    cur.execute("SELECT id, name, house_number FROM tenants WHERE status = 'approved' ORDER BY name")
    test_tenants = cur.fetchall()
    print(f"Payment dropdown tenants: {test_tenants}")
except Exception as e:
    print(f"Error: {e}")

cur.close()
mysql.close()
