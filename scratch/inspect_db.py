import sqlite3

try:
    print("Connecting to local SQLite database candidates.db...")
    conn = sqlite3.connect("./backend/candidates.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, email, role FROM users")
    users = cursor.fetchall()
    
    print("\n--- REGISTERED USERS IN DATABASE ---")
    if not users:
        print("No users found in database.")
    else:
        for u in users:
            print(f"ID: {u[0]} | Name: {u[1]} | Email: {u[2]} | Role: {u[3]}")
    print("------------------------------------\n")
    
except Exception as e:
    print(f"Failed to query database: {e}")
finally:
    if 'conn' in locals():
        conn.close()
