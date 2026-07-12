from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session
load_dotenv()

import models
import schemas
from database import engine, get_db
from routers import candidates, auth, jobs, applications, scheduler, company, team, documents, saved_jobs
from routes import interview
import sqlite3

def run_migrations():
    from database import engine
    from sqlalchemy import inspect, text
    try:
        inspector = inspect(engine)
        
        # 1. Migrate Candidates columns
        if "candidates" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("candidates")]
            
            with engine.begin() as conn:
                if "ats_score" not in columns:
                    print("Migration: Adding ats_score column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN ats_score INTEGER DEFAULT 80"))
                if "user_id" not in columns:
                    print("Migration: Adding user_id column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN user_id INTEGER"))
                if "overall_score" not in columns:
                    print("Migration: Adding overall_score column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN overall_score FLOAT"))
                if "interview_summary" not in columns:
                    print("Migration: Adding interview_summary column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN interview_summary TEXT"))
                if "interview_recommendation" not in columns:
                    print("Migration: Adding interview_recommendation column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN interview_recommendation TEXT"))
                if "interview_logs" not in columns:
                    print("Migration: Adding interview_logs column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN interview_logs JSON"))
                if "profile_photo" not in columns:
                    print("Migration: Adding profile_photo column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN profile_photo TEXT"))
                if "education" not in columns:
                    print("Migration: Adding education column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN education JSON"))
                if "skills" not in columns:
                    print("Migration: Adding skills column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN skills JSON"))
                if "experience" not in columns:
                    print("Migration: Adding experience column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN experience JSON"))
                if "projects" not in columns:
                    print("Migration: Adding projects column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN projects JSON"))
                if "certifications" not in columns:
                    print("Migration: Adding certifications column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN certifications JSON"))
                if "github" not in columns:
                    print("Migration: Adding github column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN github TEXT"))
                if "linkedin" not in columns:
                    print("Migration: Adding linkedin column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN linkedin TEXT"))
                if "portfolio" not in columns:
                    print("Migration: Adding portfolio column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN portfolio TEXT"))
                if "resume_filename" not in columns:
                    print("Migration: Adding resume_filename column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN resume_filename TEXT"))
                if "location" not in columns:
                    print("Migration: Adding location column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN location TEXT"))
                if "preferred_roles" not in columns:
                    print("Migration: Adding preferred_roles column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN preferred_roles JSON"))
                if "preferred_locations" not in columns:
                    print("Migration: Adding preferred_locations column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN preferred_locations JSON"))
                if "expected_salary" not in columns:
                    print("Migration: Adding expected_salary column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN expected_salary TEXT"))
                if "work_preference" not in columns:
                    print("Migration: Adding work_preference column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN work_preference TEXT"))
                if "created_at" not in columns:
                    print("Migration: Adding created_at column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN created_at TEXT"))
                if "updated_at" not in columns:
                    print("Migration: Adding updated_at column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN updated_at TEXT"))
                if "recruiter_notes" not in columns:
                    print("Migration: Adding recruiter_notes column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN recruiter_notes TEXT"))
                if "recruiter_verdict" not in columns:
                    print("Migration: Adding recruiter_verdict column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN recruiter_verdict TEXT"))
                if "recruiter_verdict_reason" not in columns:
                    print("Migration: Adding recruiter_verdict_reason column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN recruiter_verdict_reason TEXT"))
                if "missing_skills" not in columns:
                    print("Migration: Adding missing_skills column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN missing_skills JSON"))
                if "strengths" not in columns:
                    print("Migration: Adding strengths column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN strengths JSON"))
                if "weaknesses" not in columns:
                    print("Migration: Adding weaknesses column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN weaknesses JSON"))
                if "ai_recommendation" not in columns:
                    print("Migration: Adding ai_recommendation column to candidates table")
                    conn.execute(text("ALTER TABLE candidates ADD COLUMN ai_recommendation TEXT"))
                    
        # 2. Migrate Applications columns
        if "applications" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("applications")]
            with engine.begin() as conn:
                if "created_at" not in columns:
                    print("Migration: Adding created_at column to applications table")
                    conn.execute(text("ALTER TABLE applications ADD COLUMN created_at TEXT"))
                if "updated_at" not in columns:
                    print("Migration: Adding updated_at column to applications table")
                    conn.execute(text("ALTER TABLE applications ADD COLUMN updated_at TEXT"))
                    
        # 3. Migrate Jobs columns
        if "jobs" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("jobs")]
            with engine.begin() as conn:
                if "employment_type" not in columns:
                    print("Migration: Adding employment_type column to jobs table")
                    conn.execute(text("ALTER TABLE jobs ADD COLUMN employment_type TEXT"))
                if "work_mode" not in columns:
                    print("Migration: Adding work_mode column to jobs table")
                    conn.execute(text("ALTER TABLE jobs ADD COLUMN work_mode TEXT"))
                if "status" not in columns:
                    print("Migration: Adding status column to jobs table")
                    conn.execute(text("ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'Published'"))
    except Exception as e:
        print(f"Migration error: {e}")


run_migrations()
models.Base.metadata.create_all(bind=engine)

# Seed default positions if table is empty
def seed_default_jobs():
    try:
        from database import SessionLocal
        from jobs_data import JOBS_DATA
        db = SessionLocal()
        try:
            # 1. Clean up jobs that are NOT in the allowed list of 97/98 jobs, or contain "$" in salary
            allowed_titles = {job["role"] for job in JOBS_DATA}
            jobs_to_delete = db.query(models.Job.id).filter(
                (models.Job.title.notin_(allowed_titles)) | (models.Job.salary.like("%$%"))
            ).all()
            job_ids_to_delete = [j[0] for j in jobs_to_delete]
            
            if job_ids_to_delete:
                db.query(models.Application).filter(models.Application.job_id.in_(job_ids_to_delete)).delete(synchronize_session=False)
                db.query(models.SavedJob).filter(models.SavedJob.job_id.in_(job_ids_to_delete)).delete(synchronize_session=False)
                db.query(models.Job).filter(models.Job.id.in_(job_ids_to_delete)).delete(synchronize_session=False)
                db.commit()
                print(f"Cleaned up {len(job_ids_to_delete)} default/stale jobs and their associations.")

            # 2. Seed additional job roles from jobs_data.py
            existing_jobs = {j[0] for j in db.query(models.Job.title).all()}
            new_jobs = []
            
            indian_locations = [
                "Bengaluru, Karnataka (On-site)",
                "Hyderabad, Telangana (On-site)",
                "Pune, Maharashtra (Hybrid)",
                "Noida, Uttar Pradesh (On-site)",
                "Chennai, Tamil Nadu (Hybrid)",
                "Mumbai, Maharashtra (On-site)",
                "Bengaluru, Karnataka (Hybrid)",
                "Hyderabad, Telangana (Hybrid)",
                "Remote (India)"
            ]

            for idx, job in enumerate(JOBS_DATA):
                title = job["role"]
                if title not in existing_jobs:
                    # Parse skills list
                    skills = [s.strip() for s in job["required_skills"].split(",")]
                    
                    # Deduce experience level based on title
                    title_lower = title.lower()
                    if "intern" in title_lower or "trainee" in title_lower:
                        experience = "Entry"
                        emp_type = "Internship"
                        salary = "₹3 - ₹5 LPA"
                    elif "senior" in title_lower or "lead" in title_lower or "architect" in title_lower:
                        experience = "Senior"
                        emp_type = "Full-time"
                        salary = "₹15 - ₹25 LPA"
                    else:
                        experience = "Mid"
                        emp_type = "Full-time"
                        salary = "₹8 - ₹14 LPA"
                        
                    # Create requirements template
                    skills_str = ", ".join(skills[:3])
                    reqs = f"• Professional experience working with {skills_str}.\n• Strong problem solving skills and software engineering practices.\n• Ability to collaborate effectively in cross-functional team workflows."
                    
                    # Distribute Indian locations
                    location = indian_locations[idx % len(indian_locations)]
                    
                    new_jobs.append(
                        models.Job(
                            title=title,
                            company="HireFlow Solutions",
                            location=location,
                            experience=experience,
                            salary=salary,
                            description=job["job_description"],
                            requirements=reqs,
                            skills=skills,
                            employment_type=emp_type,
                            work_mode="Remote" if "Remote" in location else "Office" if "On-site" in location else "Hybrid",
                            status="Published"
                        )
                    )
            
            if new_jobs:
                db.add_all(new_jobs)
                db.commit()
                print(f"Successfully seeded {len(new_jobs)} additional job roles with Indian locations and INR currency.")
                
        except Exception as e:
            print(f"Error seeding jobs: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        print(f"Seeding connection error: {e}")

seed_default_jobs()

# Seed default interview slots if database table is empty
def seed_default_slots():
    try:
        from database import SessionLocal
        db = SessionLocal()
        try:
            slot_count = db.query(models.InterviewSlot).count()
            if slot_count == 0:
                print("Seeding default interview slots...")
                default_slots = [
                    models.InterviewSlot(slot_time="Monday, Jun 29 at 10:00 AM", is_booked=False),
                    models.InterviewSlot(slot_time="Monday, Jun 29 at 02:00 PM", is_booked=False),
                    models.InterviewSlot(slot_time="Tuesday, Jun 30 at 11:00 AM", is_booked=False),
                    models.InterviewSlot(slot_time="Tuesday, Jun 30 at 04:00 PM", is_booked=False),
                    models.InterviewSlot(slot_time="Wednesday, Jul 01 at 09:00 AM", is_booked=False),
                ]
                db.add_all(default_slots)
                db.commit()
                print("Successfully seeded 5 interview slots.")
        except Exception as e:
            print(f"Error seeding slots: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        print(f"Slots seeding connection error: {e}")

seed_default_slots()

app = FastAPI(

    title="AI Recruitment Automation System",
    description="Backend API for managing candidates",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candidates.router)
app.include_router(interview.router)
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(scheduler.router)
app.include_router(company.router)
app.include_router(team.router)
app.include_router(documents.router)
app.include_router(saved_jobs.router)

@app.post("/api/candidates", response_model=schemas.Candidate, tags=["candidates"])
def create_candidate_api(candidate: schemas.CandidateCreate, db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger("fastapi")
    logger.info(f"Ingesting candidate via API webhook link: {candidate.email}")
    return candidates.create_candidate(candidate, db)


@app.get("/")
def read_root():
    return {"message": "Welcome to AI Recruitment Automation API"}
