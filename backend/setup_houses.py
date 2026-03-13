import MySQLdb

def setup_houses():
    try:
        # Connect to MySQL using same configuration as Flask app
        connection = MySQLdb.connect(
            host='localhost',
            user='root',
            password='',
            db='rhms'
        )
        
        cursor = connection.cursor()
        
        # Sample houses data
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
        
        # Insert houses (IGNORE prevents duplicates)
        insert_query = """
        INSERT IGNORE INTO houses (house_number, status) 
        VALUES (%s, %s)
        """
        
        cursor.executemany(insert_query, houses)
        connection.commit()
        
        print(f"Successfully inserted {cursor.rowcount} houses")
        
        # Display current houses
        cursor.execute("SELECT * FROM houses")
        houses_data = cursor.fetchall()
        
        print("\nCurrent houses in database:")
        for house in houses_data:
            print(f"ID: {house[0]}, Number: {house[1]}, Status: {house[2]}")
            
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure MySQL is running and the database exists.")
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    setup_houses()
