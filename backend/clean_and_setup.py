import MySQLdb

def clean_and_setup():
    try:
        connection = MySQLdb.connect(
            host='localhost',
            user='root',
            password='',
            db='rhms'
        )
        
        cursor = connection.cursor()
        
        # Clear all existing houses and start fresh
        cursor.execute("DELETE FROM houses")
        connection.commit()
        print("Cleared all existing houses")
        
        # Insert clean sample houses
        houses = [
            ('A101', 'Vacant'),
            ('A102', 'Vacant'),
            ('A103', 'Vacant'),
            ('B101', 'Vacant'),
            ('B102', 'Vacant'),
            ('B103', 'Vacant'),
            ('C101', 'Occupied'),
            ('C102', 'Occupied'),
            ('D101', 'Vacant'),
            ('D102', 'Vacant')
        ]
        
        insert_query = """
        INSERT INTO houses (house_number, status) 
        VALUES (%s, %s)
        """
        
        cursor.executemany(insert_query, houses)
        connection.commit()
        
        print(f"Inserted {cursor.rowcount} new houses")
        
        # Show the results
        cursor.execute("SELECT id, house_number, status FROM houses ORDER BY house_number")
        houses_data = cursor.fetchall()
        
        print("\nHouses ready for testing:")
        for house in houses_data:
            status_icon = "🏠" if house[2] == 'Vacant' else "🔒"
            print(f"  {status_icon} {house[1]} - {house[2]}")
            
        # Count vacant houses
        cursor.execute("SELECT COUNT(*) FROM houses WHERE status = 'Vacant'")
        vacant_count = cursor.fetchone()[0]
        
        print(f"\n✅ {vacant_count} vacant houses available for registration")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    clean_and_setup()
