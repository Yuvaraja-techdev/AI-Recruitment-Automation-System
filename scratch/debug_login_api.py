import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("./backend"))

try:
    from database import SessionLocal
    import models
    from services import auth_service
    import schemas
    from routers.auth import AuthUserResponse, LoginResponse
    
    db = SessionLocal()
    
    req_email = "candidate01@gmail.com"
    req_password = "password"
    req_role = "CANDIDATE"
    
    print("1. Fetching user from db...")
    user = db.query(models.User).filter(models.User.email == req_email).first()
    print(f"   User found: {user is not None}")
    if user:
        print(f"   User email: {user.email}")
        print(f"   User role: {user.role}")
        print(f"   User password_hash: {user.password_hash}")
        
    print("\n2. Verifying password...")
    pwd_verified = auth_service.verify_password(req_password, user.password_hash)
    print(f"   Password verified: {pwd_verified}")
    
    print("\n3. Checking role mapping...")
    role_ok = user.role == req_role
    print(f"   Role matches request? {role_ok}")
    
    print("\n4. Fetching candidate profile...")
    cand = db.query(models.Candidate).filter(models.Candidate.user_id == user.id).first()
    print(f"   Candidate profile found: {cand is not None}")
    if cand:
        print(f"   Candidate ID: {cand.candidate_id}")
        
    print("\n5. Generating JWT token...")
    token = auth_service.create_access_token({"sub": user.id, "role": user.role})
    print(f"   Token created successfully: {token is not None}")
    
    print("\n6. Constructing response model...")
    resp = LoginResponse(
        access_token=token,
        user=AuthUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            candidate_id=cand.candidate_id if cand else None
        )
    )
    print("   Response model constructed successfully!")
    print(resp.model_dump())
    
except Exception as e:
    import traceback
    print("\nCRITICAL: Error during login API simulation:")
    traceback.print_exc()
finally:
    if 'db' in locals():
        db.close()
