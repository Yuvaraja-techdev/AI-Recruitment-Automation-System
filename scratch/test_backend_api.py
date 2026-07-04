import requests

url = "http://localhost:8000/auth/login"
payload = {
    "email": "candidate01@gmail.com",
    "password": "password",
    "role": "CANDIDATE"
}

try:
    print(f"Sending POST request to {url}...")
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
    
    print(f"\nResponse Status Code: {response.status_code}")
    print("Response JSON:")
    try:
        print(response.json())
    except:
        print(response.text)
        
except Exception as e:
    print(f"\nFailed to connect to backend server: {e}")
