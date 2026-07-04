import sys
import os
import uuid

# Add backend to path so we can import auth_service
sys.path.append(os.path.abspath("./backend"))

try:
    from services.auth_service import hash_password
    import sqlite3
    
    print("Hashing password 'password' using auth_service...")
    hashed_password = hash_password("password")
    
    print("Connecting to candidates.db...")
    conn = sqlite3.connect("./backend/candidates.db")
    cursor = conn.cursor()
    
    # List of users to seed
    users_data = [
        # Candidates
        ("Candidate One", "candidate01@gmail.com", "CANDIDATE"),
        ("Candidate Two", "candidate02@gmail.com", "CANDIDATE"),
        ("Candidate Three", "candidate03@gmail.com", "CANDIDATE"),
        ("Candidate Four", "candidate04@gmail.com", "CANDIDATE"),
        
        # Recruiters
        ("Recruiter One", "recruiter01@gmail.com", "RECRUITER"),
        ("Recruiter Two", "recruiter02@gmail.com", "RECRUITER"),
        ("Recruiter Three", "recruiter03@gmail.com", "RECRUITER"),
        ("Recruiter Four", "recruiter04@gmail.com", "RECRUITER"),
        
        # Admins
        ("Admin One", "admin01@gmail.com", "ADMIN"),
        ("Admin Two", "admin02@gmail.com", "ADMIN"),
        ("Admin Three", "admin03@gmail.com", "ADMIN"),
        ("Admin Four", "admin04@gmail.com", "ADMIN"),
    ]
    
    print("\n--- Seeding Users ---")
    for name, email, role in users_data:
        # Check if email exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email.lower(),))
        existing = cursor.fetchone()
        if existing:
            print(f"Skipping {email} (Already exists)")
            continue
            
        # Insert credentials
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (name, email.lower(), hashed_password, role)
        )
        user_id = cursor.lastrowid
        print(f"Created user: {email} | Role: {role} | User ID: {user_id}")
        
        # If CANDIDATE, also create profile in candidates table
        if role == "CANDIDATE":
            cand_id = f"CAND_{uuid.uuid4().hex[:6].upper()}"
            cursor.execute(
                "INSERT INTO candidates (candidate_id, user_id, name, email, status, ats_score) VALUES (?, ?, ?, ?, ?, ?)",
                (cand_id, user_id, name, email.lower(), "PENDING", 0)
            )
            print(f"  -> Mapped Candidate profile: {cand_id}")
            
    conn.commit()
    print("\nSeeding complete! Database successfully populated.")
    
except Exception as e:
    import traceback
    print(f"Failed to seed users: {e}")
    traceback.print_exc()
finally:
    if 'conn' in locals():
        conn.close()
