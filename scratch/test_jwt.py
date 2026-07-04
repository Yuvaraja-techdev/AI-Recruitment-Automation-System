import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("./backend"))

try:
    print("Testing JWT import...")
    import jwt
    print("Import successful. Module location:", jwt.__file__)
    
    # Test encode
    payload = {"sub": 123, "role": "CANDIDATE"}
    secret = "test-secret"
    algo = "HS256"
    
    print("\nAttempting jwt.encode...")
    token = jwt.encode(payload, secret, algorithm=algo)
    print("jwt.encode successful!")
    print("Token type:", type(token))
    print("Token value:", token)
    
except Exception as e:
    import traceback
    print("\nCRITICAL: JWT encode failed with exception:")
    traceback.print_exc()
