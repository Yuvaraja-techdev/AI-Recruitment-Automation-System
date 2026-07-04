import sqlite3

try:
    print("Connecting to local SQLite database candidates.db to reset candidates...")
    conn = sqlite3.connect("./backend/candidates.db")
    cursor = conn.cursor()
    
    # 1. Delete all candidate accounts from users table
    cursor.execute("DELETE FROM users WHERE role = 'CANDIDATE'")
    users_deleted = cursor.rowcount
    print(f"Deleted {users_deleted} candidate accounts from users table.")
    
    # 2. Clear candidates table
    cursor.execute("DELETE FROM candidates")
    candidates_deleted = cursor.rowcount
    print(f"Cleared {candidates_deleted} profiles from candidates table.")
    
    # 3. Clear applications table
    cursor.execute("DELETE FROM applications")
    apps_deleted = cursor.rowcount
    print(f"Cleared {apps_deleted} applications from applications table.")
    
    # 4. Clear resume history logs
    cursor.execute("DELETE FROM resume_history")
    history_deleted = cursor.rowcount
    print(f"Cleared {history_deleted} logs from resume_history table.")
    
    conn.commit()
    print("\nDatabase reset completed successfully! Candidates state is now clean.")
    
except Exception as e:
    print(f"Failed to reset database: {e}")
finally:
    if 'conn' in locals():
        conn.close()
