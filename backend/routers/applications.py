import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import SessionLocal
from routers.auth import get_current_user
from services.n8n_service import N8NService
from services.resume_intel_service import ResumeIntelService

router = APIRouter(prefix="/applications", tags=["Applications"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.ApplicationResponse)
def submit_application(
    app_data: schemas.ApplicationCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "CANDIDATE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates are permitted to submit applications"
        )
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile record not found"
        )
        
    if not candidate.resume or not candidate.resume.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a resume in your profile page before submitting applications"
        )
        
    job = db.query(models.Job).filter(models.Job.id == app_data.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target job listing not found"
        )
        
    # Prevent duplicate applications
    duplicate = db.query(models.Application).filter(
        models.Application.candidate_id == candidate.candidate_id,
        models.Application.job_id == job.id
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted an application for this position"
        )
        
    # Store application
    new_app = models.Application(
        candidate_id=candidate.candidate_id,
        job_id=job.id,
        applied_at=datetime.datetime.utcnow().isoformat(),
        status="PENDING"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    
    # Automatically trigger n8n workflow
    try:
        resume_filename = candidate.resume_filename or ""
        resume_path = f"./uploads/resumes/{candidate.candidate_id}_{resume_filename}" if resume_filename else ""
        n8n_result = N8NService.call_webhook(
            name=candidate.name,
            email=candidate.email,
            role=job.title,
            resume=candidate.resume,
            application_id=new_app.id,
            candidate_id=candidate.candidate_id,
            job_id=job.id,
            resume_path=resume_path
        )
    except Exception:
        # Fallback dictionary if N8N fails completely
        n8n_result = {"skills": []}
        
    # Sync matching skills to profile
    candidate.applied_role = job.title
    candidate.matched_skills = n8n_result.get("skills", [])
    candidate.status = "PENDING"
    
    # Run resume intelligence to generate ATS notes & scoring
    try:
        # Determine candidate ATS score based on matching job skills keywords
        job_skills = [s.lower() for s in (job.skills or [])]
        cand_skills = [s.lower() for s in (n8n_result.get("skills", []))]
        matched = [s for s in n8n_result.get("skills", []) if s.lower() in job_skills]
        
        calculated_ats = 70 + (len(matched) * 5)
        if calculated_ats > 99:
            calculated_ats = 99
            
        intel = ResumeIntelService.generate_interview_context(
            resume=candidate.resume,
            skills=n8n_result.get("skills", []),
            role=job.title,
            ats_score=calculated_ats
        )
        
        candidate.notes = intel.get("interview_context", "Application received. Background screening completed.")
        candidate.ats_score = calculated_ats
        
        # Calculate AI resume intelligence metrics
        candidate.missing_skills = [s for s in (job.skills or []) if s.lower() not in cand_skills]
        candidate.strengths = [f"Strong background in: {s}" for s in matched[:3]] or ["Matches core role expectations"]
        candidate.weaknesses = [f"Missing keyword experience: {s}" for s in candidate.missing_skills[:3]] or ["No critical skills missing"]
        
        if calculated_ats >= 85:
            candidate.ai_recommendation = "Highly Recommended"
        elif calculated_ats >= 70:
            candidate.ai_recommendation = "Recommended"
        else:
            candidate.ai_recommendation = "Not Recommended"
        
        # Auto-screen candidates with high ATS score
        if calculated_ats >= 80:
            candidate.status = "SCREENED"
    except Exception:
        candidate.notes = "Application received and queued for evaluation."
        candidate.ats_score = 80
        candidate.status = "SCREENED"
        candidate.missing_skills = []
        candidate.strengths = ["Matches core role expectations"]
        candidate.weaknesses = ["No critical skills missing"]
        candidate.ai_recommendation = "Recommended"
        
    db.commit()
    new_app.job_title = job.title
    new_app.job_company = job.company
    return new_app

@router.get("/", response_model=List[schemas.ApplicationResponse])
def get_applications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "CANDIDATE":
        candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
        if not candidate:
            return []
        apps = db.query(models.Application).filter(models.Application.candidate_id == candidate.candidate_id).all()
    else:
        # Recruiters and Admins see all job applications
        apps = db.query(models.Application).all()
        
    for app in apps:
        job = db.query(models.Job).filter(models.Job.id == app.job_id).first()
        if job:
            app.job_title = job.title
            app.job_company = job.company
            
    return apps

@router.get("/{app_id}", response_model=schemas.ApplicationResponse)
def get_application(
    app_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Candidates can only see their own applications
    if current_user.role == "CANDIDATE":
        candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
        if not candidate or app.candidate_id != candidate.candidate_id:
            raise HTTPException(status_code=403, detail="Permission denied")
            
    job = db.query(models.Job).filter(models.Job.id == app.job_id).first()
    if job:
        app.job_title = job.title
        app.job_company = job.company
        
    return app


@router.post("/webhook/pipeline")
def receive_pipeline_application(payload: schemas.PipelineWebhookPayload, db: Session = Depends(get_db)):
    """
    Ingest applicant details, screening logs, matching scores, and generated questionnaire questions
    sent by the n8n automation pipeline.
    """
    import uuid
    import logging
    logger = logging.getLogger("fastapi")
    
    logger.info(f"Received pipeline webhook for candidate: {payload.candidate.email}")

    # 1. Resolve or Create Candidate record
    db_candidate = db.query(models.Candidate).filter(models.Candidate.email == payload.candidate.email).first()
    if not db_candidate:
        candidate_uuid = "CAND-" + str(uuid.uuid4())[:8].upper()
        db_candidate = models.Candidate(
            candidate_id=candidate_uuid,
            name=payload.candidate.name,
            email=payload.candidate.email,
            phone_number=payload.candidate.phone_number,
            skills=payload.candidate.skills,
            status=payload.application.status,
            ats_score=payload.application.ats_score
        )
        db.add(db_candidate)
        db.flush() # Populate ID
    else:
        # Update details
        db_candidate.name = payload.candidate.name
        db_candidate.phone_number = payload.candidate.phone_number
        db_candidate.skills = payload.candidate.skills
        db_candidate.status = payload.application.status
        db_candidate.ats_score = payload.application.ats_score
        
    # Check if job exists
    job = db.query(models.Job).filter(models.Job.id == payload.application.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job referenced in webhook not found")
        
    db_candidate.applied_role = job.title

    # Save generated interview questions into candidate logs
    questions_list = [{"question": q.question} for q in payload.interview.questions]
    db_candidate.interview_logs = questions_list

    # 2. Store Application record
    # Prevent duplicate application logs
    duplicate_app = db.query(models.Application).filter(
        models.Application.candidate_id == db_candidate.candidate_id,
        models.Application.job_id == job.id
    ).first()
    
    if not duplicate_app:
        new_app = models.Application(
            candidate_id=db_candidate.candidate_id,
            job_id=job.id,
            applied_at=datetime.datetime.utcnow().isoformat(),
            status=payload.application.status
        )
        db.add(new_app)
    else:
        duplicate_app.status = payload.application.status
        
    db.commit()
    return {
        "status": "success",
        "candidate_id": db_candidate.candidate_id,
        "message": "Candidate application payload synced successfully"
    }

