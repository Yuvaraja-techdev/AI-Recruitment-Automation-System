from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import os
from fastapi.responses import FileResponse

from database import get_db
import models
import schemas
from services.resume_intel_service import ResumeIntelService
from services.question_generator_service import QuestionGeneratorService

router = APIRouter(
    prefix="/candidates",
    tags=["candidates"],
)

@router.post("/", response_model=schemas.Candidate)
def create_candidate(candidate: schemas.CandidateCreate, db: Session = Depends(get_db)):
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate.candidate_id).first()
    if db_candidate:
        raise HTTPException(status_code=400, detail="Candidate ID already registered")
    
    new_candidate = models.Candidate(**candidate.model_dump())
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    return new_candidate

@router.get("/", response_model=List[schemas.Candidate])
def read_candidates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate).offset(skip).limit(limit).all()
    return candidates

@router.get("/{candidate_id}", response_model=schemas.Candidate)
def read_candidate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@router.put("/{candidate_id}/status", response_model=schemas.Candidate)
def update_candidate_status(candidate_id: str, status_update: schemas.CandidateStatusUpdate, db: Session = Depends(get_db)):
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if db_candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    allowed_statuses = ["PENDING", "SCREENED", "INTERVIEWING", "SELECTED", "REJECTED"]
    new_status = status_update.status.upper()
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {allowed_statuses}")
        
    db_candidate.status = new_status
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

@router.get("/{candidate_id}/resume-context")
def get_candidate_resume_context(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    context = ResumeIntelService.generate_interview_context(
        resume=candidate.resume,
        skills=candidate.matched_skills,
        role=candidate.applied_role,
        ats_score=candidate.ats_score or 80
    )
    return context

@router.post("/{candidate_id}/generate-questions")
def generate_questions(candidate_id: str, request: schemas.QuestionGenerationRequest, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    questions = QuestionGeneratorService.generate_personalized_questions(
        resume=candidate.resume,
        skills=candidate.matched_skills,
        role=candidate.applied_role,
        ats_score=candidate.ats_score or 80,
        job_description=request.job_description
    )
    return questions


@router.delete("/{candidate_id}")

def delete_candidate(candidate_id: str, db: Session = Depends(get_db)):
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if db_candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    db.delete(db_candidate)
    db.commit()
    return {"message": "Candidate successfully deleted", "candidate_id": candidate_id}


@router.put("/{candidate_id}/profile", response_model=schemas.Candidate)
def update_candidate_profile(candidate_id: str, profile: schemas.CandidateProfileUpdate, db: Session = Depends(get_db)):
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if db_candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    update_data = profile.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_candidate, key, value)
        
    # Sync candidate's name to user credentials name if linked
    if "name" in update_data and db_candidate.user_id:
        user = db.query(models.User).filter(models.User.id == db_candidate.user_id).first()
        if user:
            user.name = update_data["name"]
            
    db.commit()
    db.refresh(db_candidate)
    return db_candidate


@router.post("/{candidate_id}/resume")
async def upload_candidate_resume(candidate_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if db_candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Save file physically to folder
    os.makedirs("./uploads/resumes", exist_ok=True)
    file_path = f"./uploads/resumes/{candidate_id}_{file.filename}"
    try:
        contents = await file.read()
        file_size = len(contents)
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file: {e}")
        
    # Mock text extraction from PDF/Docx or read text from plain files
    resume_text = ""
    if file.filename.endswith(".txt"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                resume_text = f.read()
        except Exception:
            resume_text = "Standard resume text content extracted from plain text upload."
    else:
        resume_text = f"Simulated parsed text content of candidate resume ({file.filename}). Professional Developer with experience in React and Python backend services."
        
    db_candidate.resume = resume_text
    db_candidate.resume_filename = file.filename
    
    # Track inside Resume History
    from datetime import datetime
    db.query(models.ResumeHistory).filter(
        models.ResumeHistory.candidate_id == candidate_id,
        models.ResumeHistory.status == "ACTIVE"
    ).update({"status": "ARCHIVED"})
    
    new_history = models.ResumeHistory(
        candidate_id=candidate_id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        uploaded_at=datetime.utcnow().isoformat(),
        status="ACTIVE"
    )
    db.add(new_history)

    # Populate candidate fields from parsing
    from services.resume_intel_service import ResumeIntelService
    try:
        intel = ResumeIntelService.analyze_resume_for_intel(resume_text)
        if intel.get("phone") and (not db_candidate.phone_number or db_candidate.phone_number == "123-456-7890"):
            db_candidate.phone_number = intel["phone"]
        if intel.get("location") and not db_candidate.location:
            db_candidate.location = intel["location"]
        if intel.get("extracted_skills") and (not db_candidate.skills or len(db_candidate.skills) == 0):
            db_candidate.skills = intel["extracted_skills"]
    except Exception as parse_err:
        print(f"Auto population from parsed resume failed: {parse_err}")

    db.commit()
    db.refresh(db_candidate)
    
    return {
        "message": "Resume uploaded successfully",
        "filename": file.filename,
        "resume_preview": resume_text[:200] + "..." if len(resume_text) > 200 else resume_text
    }


@router.get("/{candidate_id}/resume/download")
def download_candidate_resume(candidate_id: str, db: Session = Depends(get_db)):
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if db_candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    if not db_candidate.resume_filename:
        raise HTTPException(status_code=400, detail="No resume uploaded for this candidate")
        
    file_path = f"./uploads/resumes/{candidate_id}_{db_candidate.resume_filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on disk")
        
    return FileResponse(
        path=file_path,
        filename=db_candidate.resume_filename,
        media_type="application/octet-stream"
    )


@router.delete("/{candidate_id}/resume")
def delete_candidate_resume(candidate_id: str, db: Session = Depends(get_db)):
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if db_candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Remove physical file from disk
    if db_candidate.resume_filename:
        file_path = f"./uploads/resumes/{candidate_id}_{db_candidate.resume_filename}"
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error removing physical resume file: {e}")
            
    db_candidate.resume = ""
    db_candidate.resume_filename = None
    
    # Mark in Resume History
    db.query(models.ResumeHistory).filter(
        models.ResumeHistory.candidate_id == candidate_id,
        models.ResumeHistory.status == "ACTIVE"
    ).update({"status": "ARCHIVED"})
    
    db.commit()
    return {"message": "Resume successfully deleted"}


@router.get("/{candidate_id}/resume-history", response_model=List[schemas.ResumeHistoryResponse])
def get_resume_history(candidate_id: str, db: Session = Depends(get_db)):
    """Fetch the chronological history of all resume uploads for this candidate."""
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if db_candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    history = db.query(models.ResumeHistory).filter(
        models.ResumeHistory.candidate_id == candidate_id
    ).order_by(models.ResumeHistory.id.desc()).all()
    
    return history


@router.get("/{candidate_id}/resume-intelligence", response_model=schemas.ResumeIntelligenceResponse)
def get_candidate_resume_intelligence(candidate_id: str, db: Session = Depends(get_db)):
    """Extract contact data, skills overlap suggestions, and ATS feedback comments from candidate resume."""
    db_candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if db_candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    if not db_candidate.resume or not db_candidate.resume.strip():
        return {
            "email": "",
            "phone": "",
            "location": "",
            "extracted_skills": [],
            "recommended_skills": [],
            "target_roles": [],
            "feedback": ["Please upload a resume first to run ATS intelligence recommendations."]
        }
        
    from services.resume_intel_service import ResumeIntelService
    analysis = ResumeIntelService.analyze_resume_for_intel(db_candidate.resume)
    return analysis




