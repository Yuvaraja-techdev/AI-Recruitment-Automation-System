import sys
import os

# Add backend to path
sys.path.append(os.path.abspath("./backend"))

try:
    from services.auth_service import verify_password
    import sqlite3
    
    conn = sqlite3.connect("./backend/candidates.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, email, password_hash, role FROM users WHERE email = 'candidate01@gmail.com'")
    user = cursor.fetchone()
    
    if not user:
        print("User candidate01@gmail.com NOT found in database.")
    else:
        print(f"User ID: {user[0]}")
        print(f"Name: {user[1]}")
        print(f"Email: {user[2]}")
        print(f"Role: {user[4]}")
        print(f"Hash in DB: {user[3]}")
        
        # Test verification
        match = verify_password("password", user[3])
        print(f"\nPassword 'password' matches hash? {match}")
        
except Exception as e:
    print(f"Error testing login: {e}")
finally:
    if 'conn' in locals():
        conn.close()
