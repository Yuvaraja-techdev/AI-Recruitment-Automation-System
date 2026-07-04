import sqlite3
import os
import json
from typing import List, Dict, Optional, Any

# Resolve database file path dynamically relative to this file
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "recruitment.db"))

class DatabaseService:
    @staticmethod
    def get_connection():
        """Establishes and returns a connection to the recruitment database."""
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def init_db(cls):
        """Creates the Candidates table if it does not already exist."""
        conn = cls.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT NOT NULL,
                resume TEXT NOT NULL,
                skills TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def insert_candidate(cls, candidate: Dict[str, Any]) -> int:
        """Inserts a new candidate record into the database."""
        conn = cls.get_connection()
        try:
            cursor = conn.cursor()
            # Serialize the skills array to a JSON string for SQLite storage
            skills = candidate.get("skills", [])
            skills_str = json.dumps(skills) if isinstance(skills, list) else str(skills)
            
            cursor.execute(
                """
                INSERT INTO Candidates (candidate_id, name, email, role, resume, skills)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    candidate.get("candidate_id"),
                    candidate.get("name"),
                    candidate.get("email"),
                    candidate.get("role"),
                    candidate.get("resume"),
                    skills_str
                )
            )
            conn.commit()
            return cursor.lastrowid
        finally:
            conn.close()

    @classmethod
    def fetch_candidate(cls, candidate_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a specific candidate record and deserializes the skills array."""
        conn = cls.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM Candidates WHERE candidate_id = ?", (candidate_id,))
            row = cursor.fetchone()
            if not row:
                return None
            
            candidate = dict(row)
            try:
                candidate["skills"] = json.loads(candidate["skills"])
            except Exception:
                if candidate["skills"]:
                    candidate["skills"] = [s.strip() for s in candidate["skills"].split(",") if s.strip()]
                else:
                    candidate["skills"] = []
            return candidate
        finally:
            conn.close()

    @classmethod
    def list_candidates(cls) -> List[Dict[str, Any]]:
        """Retrieves all candidates, ordered by creation time."""
        conn = cls.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM Candidates ORDER BY created_at DESC")
            rows = cursor.fetchall()
            
            candidates = []
            for row in rows:
                candidate = dict(row)
                try:
                    candidate["skills"] = json.loads(candidate["skills"])
                except Exception:
                    if candidate["skills"]:
                        candidate["skills"] = [s.strip() for s in candidate["skills"].split(",") if s.strip()]
                    else:
                        candidate["skills"] = []
                candidates.append(candidate)
            return candidates
        finally:
            conn.close()
