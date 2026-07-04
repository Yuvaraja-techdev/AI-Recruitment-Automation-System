import os
import json
import logging
import urllib.request
import urllib.error
import random
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Retrieve n8n webhook URL from environment variables
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "")

class N8NService:
    @classmethod
    def call_webhook(
        cls, 
        name: str, 
        email: str, 
        role: str, 
        resume: str,
        application_id: Optional[int] = None,
        candidate_id: Optional[str] = None,
        job_id: Optional[int] = None,
        resume_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends candidate application data to the n8n webhook, validates the response schema,
        and returns the structured candidate object. Falls back to a mock flow if the webhook is not configured or fails.
        """
        payload = {
            "name": name,
            "email": email,
            "role": role,
            "resume": resume,
            "application_id": application_id,
            "candidate_id": candidate_id,
            "job_id": job_id,
            "resume_path": resume_path
        }
        
        # Fallback to local mock if no webhook is specified
        if not N8N_WEBHOOK_URL:
            logger.warning("N8N_WEBHOOK_URL not configured. Using local mock generator.")
            return cls._generate_mock_response(name, email, role, resume)
            
        logger.info(f"Triggering n8n webhook: {N8N_WEBHOOK_URL}")
        
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            N8N_WEBHOOK_URL,
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            method="POST"
        )
        
        try:
            # Set a 15-second timeout for the network call
            with urllib.request.urlopen(req, timeout=15) as response:
                status = response.status
                response_body = response.read().decode("utf-8")
                
                if status not in (200, 201):
                    logger.error(f"n8n webhook returned non-success code {status}: {response_body}")
                    raise ValueError(f"Webhook execution failed with status {status}")
                
                try:
                    data = json.loads(response_body)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response from n8n webhook: {e}")
                    raise ValueError("Invalid JSON response from webhook")
                
                # Normalize wrapped list structures from n8n output
                if isinstance(data, list):
                    if len(data) > 0:
                        data = data[0]
                    else:
                        raise ValueError("Empty array returned from webhook")
                
                # Validate schema of response
                cls._validate_response(data)
                return data
                
        except urllib.error.URLError as e:
            logger.error(f"Network error calling n8n webhook: {e}")
            logger.info("Falling back to local mock generator due to connection failure.")
            return cls._generate_mock_response(name, email, role, resume)
            
        except Exception as e:
            logger.error(f"Error processing n8n webhook response: {e}")
            logger.info("Falling back to local mock generator.")
            return cls._generate_mock_response(name, email, role, resume)

    @classmethod
    def _validate_response(cls, data: Any):
        """Validates that all required fields from the n8n recruitment workflow exist."""
        if not isinstance(data, dict):
            raise ValueError("Response is not a valid JSON object")
            
        required_fields = ["candidate_id", "name", "email", "role", "resume", "skills"]
        missing = [field for field in required_fields if field not in data]
        if missing:
            raise ValueError(f"Webhook response is missing required fields: {', '.join(missing)}")
            
        if not isinstance(data["skills"], list):
            raise ValueError("Skills field must be an array of strings")

    @classmethod
    def _generate_mock_response(cls, name: str, email: str, role: str, resume: str) -> Dict[str, Any]:
        """Generates a realistic candidate JSON response for testing or offline fallback."""
        # Clean email representation (handles mailto: formatting)
        cleaned_email = email.replace("mailto:", "").strip()
        
        # Basic rule-based skill extraction from resume content
        skill_keywords = [
            "Python", "FastAPI", "Machine Learning", "ML", "NLP", "AI", "Flask", 
            "Django", "SQL", "SQLite", "PostgreSQL", "React", "HTML", "CSS", 
            "JavaScript", "TypeScript", "Vite", "Tailwind", "Git", "Docker", "AWS"
        ]
        
        matched_skills = []
        resume_lower = resume.lower()
        for skill in skill_keywords:
            if skill.lower() in resume_lower:
                matched_skills.append(skill)
                
        # Fallback default skills if none matched
        if not matched_skills:
            matched_skills = ["Python", "FastAPI"]
            
        # Ensure role-specific key skills are included
        role_lower = role.lower()
        if "ml" in role_lower or "machine learning" in role_lower or "ai" in role_lower:
            for s in ["Python", "Machine Learning", "NLP", "AI"]:
                if s not in matched_skills:
                    matched_skills.append(s)
        elif "backend" in role_lower or "api" in role_lower:
            for s in ["Python", "FastAPI", "SQL"]:
                if s not in matched_skills:
                    matched_skills.append(s)

        candidate_num = random.randint(100, 999)
        return {
            "candidate_id": f"CAND-{candidate_num}",
            "name": name,
            "email": cleaned_email,
            "role": role,
            "resume": resume,
            "skills": matched_skills
        }
