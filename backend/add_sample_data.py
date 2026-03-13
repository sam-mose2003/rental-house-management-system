import mysql.connector
from mysql.connector import Error

def add_sample_houses():
    try:
        # Database connection
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='rhms'
        )

        if connection.is_connected():
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
            
            # Insert houses
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
                
    except Error as e:
        print(f"Error: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    add_sample_houses()
