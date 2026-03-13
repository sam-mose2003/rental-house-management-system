import MySQLdb

def setup_clean_houses():
    try:
        connection = MySQLdb.connect(
            host='localhost',
            user='root',
            password='',
            db='rhms'
        )
        
        cursor = connection.cursor()
        
        # First, check if there are any tenants
        cursor.execute("SELECT COUNT(*) FROM tenants")
        tenant_count = cursor.fetchone()[0]
        
        if tenant_count > 0:
            print(f"Found {tenant_count} tenant records. To avoid foreign key issues, let's:")
            print("1. Update existing tenants to use new house numbers")
            print("2. Then update houses")
            
            # Get current tenant-house mappings
            cursor.execute("SELECT id, house_number FROM tenants LIMIT 10")
            tenants = cursor.fetchall()
            
            print("\nCurrent tenants:")
            for tenant in tenants:
                print(f"  Tenant ID: {tenant[0]}, House: {tenant[1]}")
        
        # Update existing houses to have correct status values instead of deleting
        cursor.execute("""
            UPDATE houses 
            SET status = 'Vacant' 
            WHERE status NOT IN ('Vacant', 'Occupied')
        """)
        connection.commit()
        
        cursor.execute("""
            UPDATE houses 
            SET status = 'Occupied' 
            WHERE status = 'Occupied'
        """)
        connection.commit()
        
        print(f"\nUpdated house status values")
        
        # Now add some new vacant houses if needed
        new_houses = [
            ('A101', 'Vacant'),
            ('A102', 'Vacant'), 
            ('A103', 'Vacant'),
            ('B101', 'Vacant'),
            ('B102', 'Vacant'),
            ('B103', 'Vacant'),
            ('D101', 'Vacant'),
            ('D102', 'Vacant')
        ]
        
        # Use INSERT IGNORE to avoid conflicts with existing houses
        insert_query = """
        INSERT IGNORE INTO houses (house_number, status) 
        VALUES (%s, %s)
        """
        
        cursor.executemany(insert_query, new_houses)
        connection.commit()
        
        print(f"Added {cursor.rowcount} new houses")
        
        # Show final results
        cursor.execute("""
            SELECT id, house_number, status 
            FROM houses 
            ORDER BY house_number
        """)
        houses_data = cursor.fetchall()
        
        print("\n🏠 All houses in database:")
        vacant_count = 0
        for house in houses_data:
            status_icon = "🏠" if house[2] == 'Vacant' else "🔒"
            if house[2] == 'Vacant':
                vacant_count += 1
            print(f"  {status_icon} {house[1]} - {house[2]}")
            
        print(f"\n✅ Ready! {vacant_count} vacant houses available for tenant registration")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    setup_clean_houses()
