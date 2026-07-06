import sqlite3

try:
    print("Connecting to local SQLite database candidates.db to count jobs...")
    conn = sqlite3.connect("./backend/candidates.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM jobs")
    count = cursor.fetchone()[0]
    print(f"Total jobs in database: {count}")
    
    cursor.execute("SELECT id, title, company, experience, status FROM jobs LIMIT 10")
    jobs = cursor.fetchall()
    
    print("\n--- SAMPLE JOBS ---")
    for j in jobs:
        print(f"ID: {j[0]} | Title: {j[1]} | Company: {j[2]} | Experience: {j[3]} | Status: {j[4]}")
    print("-------------------\n")
    
except Exception as e:
    print(f"Failed to query jobs: {e}")
finally:
    if 'conn' in locals():
        conn.close()
