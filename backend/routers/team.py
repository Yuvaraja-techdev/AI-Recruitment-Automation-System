from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from database import get_db
import models
from services import auth_service
import uuid

router = APIRouter(prefix="/team", tags=["team"])


# ─── Schemas ───────────────────────────────────────────────────────────────────

class TeamMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str = "ACTIVE"

    class Config:
        from_attributes = True


class InviteMemberRequest(BaseModel):
    name: str
    email: EmailStr
    role: str = "RECRUITER"  # RECRUITER | ADMIN


class UpdateRoleRequest(BaseModel):
    role: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[TeamMemberResponse])
def get_team_members(db: Session = Depends(get_db)):
    """Return all users with RECRUITER or ADMIN roles."""
    members = (
        db.query(models.User)
        .filter(models.User.role.in_(["RECRUITER", "ADMIN"]))
        .all()
    )
    return [
        TeamMemberResponse(
            id=m.id,
            name=m.name,
            email=m.email,
            role=m.role,
            status="ACTIVE",
        )
        for m in members
    ]


@router.post("/invite", response_model=TeamMemberResponse)
def invite_member(payload: InviteMemberRequest, db: Session = Depends(get_db)):
    """Create a new recruiter/admin account (simulate invite by creating user)."""
    existing = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    valid_roles = ["RECRUITER", "ADMIN"]
    if payload.role.upper() not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {valid_roles}")

    # Generate a secure temporary password
    temp_password = f"HireFlow@{uuid.uuid4().hex[:8]}"
    new_user = models.User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=auth_service.hash_password(temp_password),
        role=payload.role.upper(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return TeamMemberResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        status="ACTIVE",
    )


@router.put("/{user_id}/role", response_model=TeamMemberResponse)
def update_member_role(user_id: int, payload: UpdateRoleRequest, db: Session = Depends(get_db)):
    """Update the role of a team member."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Team member not found.")
    if payload.role.upper() not in ["RECRUITER", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role.")
    user.role = payload.role.upper()
    db.commit()
    db.refresh(user)
    return TeamMemberResponse(id=user.id, name=user.name, email=user.email, role=user.role, status="ACTIVE")


@router.delete("/{user_id}")
def remove_member(user_id: int, db: Session = Depends(get_db)):
    """Remove a team member (delete user record)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Team member not found.")
    if user.role == "CANDIDATE":
        raise HTTPException(status_code=400, detail="Cannot remove candidate accounts via team endpoint.")
    db.delete(user)
    db.commit()
    return {"message": f"Team member {user.name} removed successfully."}
