from sqlalchemy import Column, String, Text, JSON, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    name = Column(String, index=True)
    email = Column(String, index=True)
    applied_role = Column(String, index=True)
    resume = Column(String)
    matched_skills = Column(JSON)
    phone_number = Column(String)
    status = Column(String)
    notes = Column(Text)
    recruiter_notes = Column(Text, nullable=True)
    recruiter_verdict = Column(String, nullable=True)
    recruiter_verdict_reason = Column(Text, nullable=True)
    missing_skills = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    ai_recommendation = Column(String, nullable=True)
    ats_score = Column(Integer, default=80)
    overall_score = Column(Float, nullable=True)
    interview_summary = Column(Text, nullable=True)
    interview_recommendation = Column(String, nullable=True)
    interview_logs = Column(JSON, nullable=True)
    
    # Profile Expansion (Module 3)
    profile_photo = Column(String, nullable=True)
    education = Column(JSON, nullable=True)
    skills = Column(JSON, nullable=True)
    experience = Column(JSON, nullable=True)
    projects = Column(JSON, nullable=True)
    certifications = Column(JSON, nullable=True)
    github = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    portfolio = Column(String, nullable=True)
    resume_filename = Column(String, nullable=True)
    location = Column(String, nullable=True)
    preferred_roles = Column(JSON, nullable=True)
    preferred_locations = Column(JSON, nullable=True)
    expected_salary = Column(String, nullable=True)
    work_preference = Column(String, nullable=True)
    created_at = Column(String, nullable=True)
    updated_at = Column(String, nullable=True)
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")




class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)  # "CANDIDATE", "RECRUITER", "ADMIN"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    location = Column(String, index=True)
    experience = Column(String)  # "Entry", "Mid", "Senior"
    salary = Column(String)
    description = Column(Text)
    requirements = Column(Text)
    skills = Column(JSON)  # List of skill tags
    is_active = Column(Boolean, default=True)
    employment_type = Column(String, nullable=True)
    work_mode = Column(String, nullable=True)
    status = Column(String, default="Published")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_id = Column(String, ForeignKey("candidates.candidate_id", ondelete="CASCADE"), index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    applied_at = Column(String)  # ISO string representation
    status = Column(String, default="PENDING")
    created_at = Column(String, nullable=True)
    updated_at = Column(String, nullable=True)

    candidate = relationship("Candidate", back_populates="applications")
    job = relationship("Job", back_populates="applications")



class InterviewSlot(Base):
    __tablename__ = "interview_slots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slot_time = Column(String, index=True)  # e.g. "Monday, Jun 29 at 10:00 AM"
    is_booked = Column(Boolean, default=False)
    booked_by_candidate_id = Column(String, nullable=True)


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Identity
    name = Column(String, index=True, default="My Company")
    industry = Column(String, nullable=True)
    size = Column(String, nullable=True)          # e.g. "11-50", "51-200"
    headquarters = Column(String, nullable=True)
    founded_year = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

    # Contact
    website = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    # Branding
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    brand_color = Column(String, nullable=True, default="#6366f1")

    # Social Links
    linkedin = Column(String, nullable=True)
    twitter = Column(String, nullable=True)
    github = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    facebook = Column(String, nullable=True)

    # Settings
    timezone = Column(String, nullable=True, default="UTC")
    interview_duration = Column(Integer, nullable=True, default=30)  # minutes
    working_days = Column(JSON, nullable=True)  # e.g. ["Mon","Tue","Wed","Thu","Fri"]
    recruiter_signature = Column(Text, nullable=True)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    doc_type = Column(String, index=True)  # "POLICY" | "OFFER" | "NDA" | "GUIDELINE" | "GENERAL"
    uploaded_at = Column(String)
    file_size = Column(Integer)


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_id = Column(String, index=True)
    job_id = Column(Integer, index=True)
    saved_at = Column(String)


class ResumeHistory(Base):
    __tablename__ = "resume_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_id = Column(String, index=True)
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    uploaded_at = Column(String)  # ISO string representation
    status = Column(String)        # "ACTIVE" | "ARCHIVED"










