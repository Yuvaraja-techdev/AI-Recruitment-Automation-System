from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from routers.auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/saved-jobs", tags=["Saved Jobs"])

@router.post("/{job_id}", response_model=schemas.SavedJobResponse)
def save_job(
    job_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bookmark a job for the logged-in candidate."""
    if current_user.role != "CANDIDATE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates are permitted to bookmark jobs"
        )
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
        
    # Verify the target job listing exists
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target job listing not found"
        )
        
    # Check if this job has already been bookmarked
    existing = db.query(models.SavedJob).filter(
        models.SavedJob.candidate_id == candidate.candidate_id,
        models.SavedJob.job_id == job_id
    ).first()
    if existing:
        return existing
        
    new_saved = models.SavedJob(
        candidate_id=candidate.candidate_id,
        job_id=job_id,
        saved_at=datetime.utcnow().isoformat()
    )
    db.add(new_saved)
    db.commit()
    db.refresh(new_saved)
    return new_saved


@router.delete("/{job_id}")
def unsave_job(
    job_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a job bookmark for the logged-in candidate."""
    if current_user.role != "CANDIDATE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates are permitted to manage bookmarks"
        )
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
        
    record = db.query(models.SavedJob).filter(
        models.SavedJob.candidate_id == candidate.candidate_id,
        models.SavedJob.job_id == job_id
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark record not found for this job"
        )
        
    db.delete(record)
    db.commit()
    return {"message": "Job removed from bookmarks successfully"}


@router.get("/", response_model=List[schemas.JobResponse])
def get_saved_jobs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full details of all bookmarked jobs for the logged-in candidate."""
    if current_user.role != "CANDIDATE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates are permitted to access saved jobs"
        )
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
        
    saved_records = db.query(models.SavedJob).filter(
        models.SavedJob.candidate_id == candidate.candidate_id
    ).all()
    
    job_ids = [r.job_id for r in saved_records]
    if not job_ids:
        return []
        
    # Return the full job descriptions/details for all bookmarked jobs
    return db.query(models.Job).filter(models.Job.id.in_(job_ids)).all()
