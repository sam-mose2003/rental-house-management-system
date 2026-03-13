import MySQLdb

def check_schema():
    try:
        connection = MySQLdb.connect(
            host='localhost',
            user='root',
            password='',
            db='rhms'
        )
        
        cursor = connection.cursor()
        
        print("=== TENANTS TABLE SCHEMA ===")
        cursor.execute("DESCRIBE tenants")
        columns = cursor.fetchall()
        for col in columns:
            print(f"Column: {col[0]} | Type: {col[1]} | Null: {col[2]} | Key: {col[3]}")
        
        print("\n=== SAMPLE TENANT DATA ===")
        cursor.execute("SELECT * FROM tenants LIMIT 2")
        rows = cursor.fetchall()
        for row in rows:
            print(f"Row: {row}")
            print(f"Row length: {len(row)}")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
