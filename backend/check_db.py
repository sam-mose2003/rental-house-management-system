import MySQLdb

def check_database():
    try:
        connection = MySQLdb.connect(
            host='localhost',
            user='root',
            password='',
            db='rhms'
        )
        
        cursor = connection.cursor()
        
        # Check distinct status values in houses table
        cursor.execute("SELECT DISTINCT status FROM houses")
        statuses = cursor.fetchall()
        
        print("Distinct status values in houses table:")
        for status in statuses:
            print(f"  '{status[0]}'")
        
        # Check some sample houses
        cursor.execute("SELECT id, house_number, status FROM houses LIMIT 5")
        houses = cursor.fetchall()
        
        print("\nSample houses:")
        for house in houses:
            print(f"  ID: {house[0]}, Number: {house[1]}, Status: '{house[2]}'")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_database()
