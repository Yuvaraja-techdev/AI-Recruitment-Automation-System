import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    # SQLAlchemy requires postgresql:// instead of postgres:// from Railway
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./candidates.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import os
import json

SESSION_FILE = "./data/interview_session.json"

def _load_sessions():
    os.makedirs(os.path.dirname(SESSION_FILE), exist_ok=True)
    if not os.path.exists(SESSION_FILE):
        with open(SESSION_FILE, 'w') as f:
            json.dump({}, f)
        return {}
    try:
        with open(SESSION_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return {}

def _save_sessions(sessions):
    try:
        with open(SESSION_FILE, 'w') as f:
            json.dump(sessions, f, indent=2)
    except Exception as e:
        print(f"Error saving session: {e}")

def db_create_session(session_id, candidate_name, role, resume, first_question, candidate_id=None):
    sessions = _load_sessions()
    sessions[session_id] = {
        "session_id": session_id,
        "candidate_id": candidate_id,
        "candidate_name": candidate_name,
        "role": role,
        "resume": resume,
        "current_question": first_question,
        "questions": [],
        "overall_score": 0.0,
        "summary": "",
        "recommendation": "",
        "is_finished": False
    }
    _save_sessions(sessions)

def db_get_session(session_id):
    sessions = _load_sessions()
    return sessions.get(session_id)

def db_update_current_question(session_id, question):
    sessions = _load_sessions()
    if session_id in sessions:
        sessions[session_id]["current_question"] = question
        _save_sessions(sessions)

def db_save_question_turn(session_id, question_text, answer_text, technical_score, communication_score, confidence_score, problem_solving_score, relevance_score, completeness_score, feedback):
    sessions = _load_sessions()
    if session_id in sessions:
        sessions[session_id]["questions"].append({
            "question": question_text,
            "answer": answer_text,
            "scores": {
                "technical_score": technical_score,
                "communication_score": communication_score,
                "confidence_score": confidence_score,
                "problem_solving_score": problem_solving_score,
                "relevance_score": relevance_score,
                "completeness_score": completeness_score,
                "feedback": feedback
            }
        })
        _save_sessions(sessions)

def db_end_session(session_id, overall_score, summary, recommendation):
    sessions = _load_sessions()
    if session_id in sessions:
        sessions[session_id]["overall_score"] = overall_score
        sessions[session_id]["summary"] = summary
        sessions[session_id]["recommendation"] = recommendation
        sessions[session_id]["is_finished"] = True
        _save_sessions(sessions)

