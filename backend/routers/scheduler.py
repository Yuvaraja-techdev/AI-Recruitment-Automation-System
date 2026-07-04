from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import SessionLocal
from routers.auth import get_current_user

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/slots", response_model=List[schemas.InterviewSlotResponse])
def get_slots(db: Session = Depends(get_db)):
    return db.query(models.InterviewSlot).all()

@router.post("/slots/{slot_id}/book", response_model=schemas.InterviewSlotResponse)
def book_slot(
    slot_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "CANDIDATE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can schedule interviews"
        )
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile record not found"
        )
        
    # Gating check: only SCREENED or INTERVIEWING candidates can book slots
    if not candidate.status or candidate.status.upper() not in ["SCREENED", "INTERVIEWING"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not eligible to schedule an interview at this stage."
        )
        
    # Check if target slot exists
    slot = db.query(models.InterviewSlot).filter(models.InterviewSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview slot not found"
        )
        
    if slot.is_booked and slot.booked_by_candidate_id != candidate.candidate_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This slot has already been booked by another candidate"
        )
        
    # Release any previous bookings by this candidate
    prev_bookings = db.query(models.InterviewSlot).filter(
        models.InterviewSlot.booked_by_candidate_id == candidate.candidate_id
    ).all()
    for prev in prev_bookings:
        prev.is_booked = False
        prev.booked_by_candidate_id = None
        
    # Reserve the new slot
    slot.is_booked = True
    slot.booked_by_candidate_id = candidate.candidate_id
    
    db.commit()
    db.refresh(slot)
    
    return slot

@router.post("/slots/cancel")
def cancel_slot(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "CANDIDATE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can cancel scheduled interviews"
        )
        
    candidate = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile record not found"
        )
        
    # Release bookings by this candidate
    bookings = db.query(models.InterviewSlot).filter(
        models.InterviewSlot.booked_by_candidate_id == candidate.candidate_id
    ).all()
    
    if not bookings:
        return {"message": "No active booking found to cancel"}
        
    for slot in bookings:
        slot.is_booked = False
        slot.booked_by_candidate_id = None
        
    db.commit()
    
    return {"message": "Successfully cancelled interview booking"}


@router.post("/slots/{slot_id}/assign/{candidate_id}")
def assign_slot_manually(slot_id: int, candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    slot = db.query(models.InterviewSlot).filter(models.InterviewSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    # Release any existing slots for candidate
    prev_slots = db.query(models.InterviewSlot).filter(models.InterviewSlot.booked_by_candidate_id == candidate_id).all()
    for ps in prev_slots:
        ps.is_booked = False
        ps.booked_by_candidate_id = None
        
    slot.is_booked = True
    slot.booked_by_candidate_id = candidate_id
    
    # Set candidate status to INTERVIEWING to schedule
    candidate.status = "INTERVIEWING"
    db.commit()
    return {"message": "Slot assigned successfully", "slot_time": slot.slot_time}


@router.post("/slots/release/{candidate_id}")
def release_slot_manually(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    prev_slots = db.query(models.InterviewSlot).filter(models.InterviewSlot.booked_by_candidate_id == candidate_id).all()
    for ps in prev_slots:
        ps.is_booked = False
        ps.booked_by_candidate_id = None
        
    db.commit()
    return {"message": "Slots released successfully"}
