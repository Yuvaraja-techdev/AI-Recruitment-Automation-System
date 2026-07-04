from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import SessionLocal
from routers.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.JobResponse])
def get_jobs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    experience: Optional[str] = None,
    skills: Optional[str] = None,
    status: Optional[str] = "Published",
    db: Session = Depends(get_db)
):
    query = db.query(models.Job).filter(models.Job.is_active == True)
    
    if status and status.upper() != "ALL":
        query = query.filter(models.Job.status == status)
        
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
        
    if experience:
        query = query.filter(models.Job.experience == experience)
        
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",")]
        all_jobs = query.all()
        filtered_jobs = []
        for job in all_jobs:
            job_skills = [s.lower() for s in (job.skills or [])]
            if any(s in job_skills for s in skill_list):
                filtered_jobs.append(job)
        if search:
            search_lower = search.lower()
            filtered_jobs = [
                job for job in filtered_jobs
                if (search_lower in (job.title or "").lower() or
                    search_lower in (job.company or "").lower() or
                    search_lower in (job.description or "").lower() or
                    search_lower in (job.location or "").lower() or
                    search_lower in (job.salary or "").lower() or
                    search_lower in (job.experience or "").lower() or
                    any(search_lower in s.lower() for s in (job.skills or [])))
            ]
        return filtered_jobs
        
    if search:
        search_lower = search.lower()
        all_jobs = query.all()
        filtered_jobs = []
        for job in all_jobs:
            if (search_lower in (job.title or "").lower() or
                search_lower in (job.company or "").lower() or
                search_lower in (job.description or "").lower() or
                search_lower in (job.location or "").lower() or
                search_lower in (job.salary or "").lower() or
                search_lower in (job.experience or "").lower() or
                any(search_lower in s.lower() for s in (job.skills or []))):
                filtered_jobs.append(job)
        return filtered_jobs
        
    return query.all()

@router.get("/recommendations", response_model=List[schemas.JobRecommendationResponse])
def get_job_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dynamically evaluate job recommendations based on candidate preferences and skills overlap."""
    if current_user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can fetch job recommendations")
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    # Get all active published jobs
    jobs = db.query(models.Job).filter(models.Job.is_active == True, models.Job.status == "Published").all()
    if not jobs:
        return []
        
    candidate_skills = [s.lower() for s in (candidate.skills or [])]
    pref_roles = [r.lower() for r in (candidate.preferred_roles or [])]
    pref_locations = [l.lower() for l in (candidate.preferred_locations or [])]
    
    recommendations = []
    for job in jobs:
        job_skills = [s.lower() for s in (job.skills or [])]
        matched_skills = [s for s in job_skills if s in candidate_skills]
        
        skills_overlap_pct = 0
        if job_skills:
            skills_overlap_pct = int((len(matched_skills) / len(job_skills)) * 100)
            
        role_match = False
        if job.title:
            job_title_lower = job.title.lower()
            role_match = any(role in job_title_lower for role in pref_roles)
            if not role_match and candidate.applied_role:
                role_match = candidate.applied_role.lower() in job_title_lower
                
        loc_match = False
        if job.location:
            job_loc_lower = job.location.lower()
            loc_match = any(loc in job_loc_lower for loc in pref_locations)
            if not loc_match and candidate.work_preference:
                if candidate.work_preference.lower() in job_loc_lower:
                    loc_match = True
                    
        # Score calculation weights: 60% skills alignment, 25% target role, 15% location target
        score = (skills_overlap_pct * 0.6) + (25 if role_match else 0) + (15 if loc_match else 0)
        
        # Formulate contextual advice reasons
        reason = f"Matches {skills_overlap_pct}% of required skills on your resume."
        if role_match and skills_overlap_pct >= 75:
            reason = f"Excellent fit! Matches target role ({job.title}) and has {skills_overlap_pct}% skill matches."
        elif loc_match and skills_overlap_pct >= 75:
            reason = f"Great match! Aligns with your work mode preference and has {skills_overlap_pct}% skill matches."
        elif role_match:
            reason = f"Matches your target job role preferences."
            
        recommendations.append({
            "job": job,
            "score": score,
            "reason": reason,
            "match_pct": min(max(skills_overlap_pct, 55), 99)
        })
        
    # Sort recommendations by matching score in descending order
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations[:6]


@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    new_job = models.Job(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.put("/{job_id}", response_model=schemas.JobResponse)
def update_job(job_id: int, job_update: schemas.JobUpdate, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = job_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_job, key, value)
        
    db.commit()
    db.refresh(db_job)
    return db_job

@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    db.delete(db_job)
    db.commit()
    return {"message": f"Successfully deleted job {job_id}"}
