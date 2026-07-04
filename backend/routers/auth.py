import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from typing import Optional

import models
from database import SessionLocal
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(..., description="CANDIDATE, RECRUITER, or ADMIN")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class AuthUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    candidate_id: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse

# Current user getter dependency
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication header"
        )
    
    token = authorization.split(" ")[1]
    payload = auth_service.verify_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token"
        )
    
    user_id = payload["sub"]
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.post("/signup", response_model=LoginResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == request.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
    
    # Create user credentials
    new_user = models.User(
        name=request.name,
        email=request.email.lower(),
        password_hash=auth_service.hash_password(request.password),
        role="CANDIDATE"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Sync and create empty Candidate profile for this registered user
    cand_id = f"CAND_{uuid.uuid4().hex[:6].upper()}"
    new_cand = models.Candidate(
        candidate_id=cand_id,
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        status="PENDING",
        ats_score=0
    )
    db.add(new_cand)
    db.commit()
    
    token = auth_service.create_access_token({"sub": new_user.id, "role": new_user.role})
    
    return LoginResponse(
        access_token=token,
        user=AuthUserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            role=new_user.role,
            candidate_id=cand_id
        )
    )

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Auto-seed default Recruiter or Admin if matching specific credentials
    req_email = request.email.lower()
    
    if req_email == "recruiter@hireflow.com" and request.password == "password" and request.role == "RECRUITER":
        user = db.query(models.User).filter(models.User.email == req_email).first()
        if not user:
            user = models.User(
                name="Recruiter Admin",
                email=req_email,
                password_hash=auth_service.hash_password("password"),
                role="RECRUITER"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
    elif req_email == "admin@hireflow.com" and request.password == "password" and request.role == "ADMIN":
        user = db.query(models.User).filter(models.User.email == req_email).first()
        if not user:
            user = models.User(
                name="Super Admin",
                email=req_email,
                password_hash=auth_service.hash_password("password"),
                role="ADMIN"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        user = db.query(models.User).filter(models.User.email == req_email).first()
        
    # Standard credentials checking
    if not user or not auth_service.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    if user.role != request.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User is not registered under the role: {request.role}"
        )
        
    # Get associated candidate_id if user is a Candidate
    candidate_id = None
    if user.role == "CANDIDATE":
        cand = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
        if cand:
            candidate_id = cand.candidate_id
            
    token = auth_service.create_access_token({"sub": user.id, "role": user.role})
    
    return LoginResponse(
        access_token=token,
        user=AuthUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            candidate_id=candidate_id
        )
    )

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    return {"message": "If this email is registered, a password reset link has been sent."}

@router.get("/me", response_model=AuthUserResponse)
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    candidate_id = None
    if current_user.role == "CANDIDATE":
        cand = db.query(models.Candidate).filter(models.Candidate.user_id == current_user.id).first()
        if cand:
            candidate_id = cand.candidate_id
            
    return AuthUserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        candidate_id=candidate_id
    )
