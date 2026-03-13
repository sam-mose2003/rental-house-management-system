import MySQLdb

def fix_houses():
    try:
        connection = MySQLdb.connect(
            host='localhost',
            user='root',
            password='',
            db='rhms'
        )
        
        cursor = connection.cursor()
        
        # Fix all status values to be either 'Vacant' or 'Occupied'
        # First, set any null/empty values to 'Vacant'
        cursor.execute("""
            UPDATE houses 
            SET status = 'Vacant' 
            WHERE status IS NULL OR status = '' OR status NOT IN ('Vacant', 'Occupied')
        """)
        
        # Fix common misspellings
        cursor.execute("""
            UPDATE houses 
            SET status = 'Vacant' 
            WHERE status LIKE '%Vacan%'
        """)
        
        cursor.execute("""
            UPDATE houses 
            SET status = 'Occupied' 
            WHERE status LIKE '%Occupie%'
        """)
        
        connection.commit()
        
        print(f"Updated {cursor.rowcount} houses")
        
        # Show the results
        cursor.execute("SELECT id, house_number, status FROM houses ORDER BY id")
        houses = cursor.fetchall()
        
        print("\nAll houses after fix:")
        for house in houses:
            print(f"  ID: {house[0]}, Number: {house[1]}, Status: '{house[2]}'")
            
        # Count vacant vs occupied
        cursor.execute("SELECT status, COUNT(*) FROM houses GROUP BY status")
        counts = cursor.fetchall()
        
        print("\nSummary:")
        for status, count in counts:
            print(f"  {status}: {count}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    fix_houses()
