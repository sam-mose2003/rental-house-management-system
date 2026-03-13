import MySQLdb

def update_schema():
    try:
        connection = MySQLdb.connect(
            host='localhost',
            user='root',
            password='',
            db='rhms'
        )
        
        cursor = connection.cursor()
        
        print("Adding status column to tenants table...")
        try:
            cursor.execute("""
                ALTER TABLE tenants 
                ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved' 
                AFTER move_in_date
            """)
            print("Status column added successfully")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Status column already exists")
            else:
                print(f"Error adding status column: {e}")
        
        print("Adding created_at column to maintenance table...")
        try:
            cursor.execute("""
                ALTER TABLE maintenance 
                ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
                AFTER status
            """)
            print("Created_at column added successfully")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Created_at column already exists")
            else:
                print(f"Error adding created_at column: {e}")
        
        # Update existing tenants to have 'approved' status
        cursor.execute("UPDATE tenants SET status = 'approved' WHERE status IS NULL")
        
        connection.commit()
        
        # Verify the changes
        print("\n=== VERIFICATION ===")
        cursor.execute("DESCRIBE tenants")
        columns = cursor.fetchall()
        for col in columns:
            if col[0] == 'status':
                print(f"Status column found: {col[0]} | {col[1]}")
        
        cursor.execute("DESCRIBE maintenance")
        columns = cursor.fetchall()
        for col in columns:
            if col[0] == 'created_at':
                print(f"Created_at column found: {col[0]} | {col[1]}")
        
        cursor.close()
        connection.close()
        print("\nSchema update completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_schema()
