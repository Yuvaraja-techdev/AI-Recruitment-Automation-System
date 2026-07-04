import os
import json
import logging
import google.generativeai as genai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

MODEL_NAME = "gemini-1.5-flash"

class ResumeIntelService:
    @classmethod
    def get_model(cls):
        if not api_key:
            return None
        try:
            return genai.GenerativeModel(MODEL_NAME)
        except Exception as e:
            logger.error(f"Error initializing Gemini Model in ResumeIntelService: {e}")
            return None

    @classmethod
    def generate_interview_context(cls, resume: str, skills: list, role: str, ats_score: int) -> dict:
        """
        Analyzes a candidate's resume, role, skills list, and ATS score using Gemini.
        Returns a structured dictionary with:
        - interview_context: paragraph summarizing the candidate background & interview focus area
        - technical_topics: list of technical topics to check in the interview
        - skill_priorities: dict of skill priorities (High/Medium/Low)
        - difficulty_level: "Easy" | "Medium" | "Hard"
        """
        model = cls.get_model()
        
        # Calculate dynamic fallback values in case LLM key is missing
        # This keeps the application fully functional out-of-the-box
        skills_list = skills if isinstance(skills, list) else []
        tech_topics = [f"{s} Architecture" for s in skills_list[:3]] or ["Software Engineering Core", "System Design", "APIs & Databases"]
        
        skill_priorities = {}
        for idx, s in enumerate(skills_list):
            if idx < 2:
                skill_priorities[s] = "High"
            elif idx < 5:
                skill_priorities[s] = "Medium"
            else:
                skill_priorities[s] = "Low"
                
        diff = "Medium"
        if ats_score >= 85:
            diff = "Hard"
        elif ats_score < 60:
            diff = "Easy"

        mock_context = {
            "interview_context": f"Candidate is applying for the {role} role with an ATS score of {ats_score}. Focus the interview on evaluating Core Software Architecture, engineering processes, and the primary skills: {', '.join(skills_list[:3])}.",
            "technical_topics": tech_topics,
            "skill_priorities": skill_priorities,
            "difficulty_level": diff
        }

        if not model:
            logger.info("Using mock resume intelligence summary (No Gemini API Key).")
            return mock_context

        skills_str = ", ".join(skills_list)
        prompt = f"""
        You are an expert recruitment and HR assessment engine. Analyze the candidate's details below:
        
        Applied Role: {role}
        ATS Score: {ats_score}
        Core Matched Skills: {skills_str}
        Full Resume Text:
        {resume}
        
        Generate the structured pre-interview intelligence context:
        1. "interview_context": A concise 2-3 sentence paragraph outlining the candidate's depth of experience, their primary strengths, and the targeted tone/focus of the upcoming interview.
        2. "technical_topics": A list of 3 to 5 specific technical domains/topics (e.g. "React Hooks Lifecycle", "Database Indexing", "CI/CD Deployment") customized to their resume and the target role.
        3. "skill_priorities": A dictionary mapping each of their matched skills to an interview priority ("High", "Medium", or "Low") depending on how critical it is for a {role} role.
        4. "difficulty_level": A single string classification of either "Easy", "Medium", or "Hard", determined by the candidate's years of experience and ATS score.
        
        Return the response as a valid JSON object matching this schema:
        {{
            "interview_context": "The paragraph text...",
            "technical_topics": ["Topic 1", "Topic 2", "Topic 3"],
            "skill_priorities": {{
                "Skill A": "High",
                "Skill B": "Medium"
            }},
            "difficulty_level": "Medium"
        }}
        
        Do not include any extra text, code blocks, or markdown formatting outside the JSON object.
        """

        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            return {
                "interview_context": data.get("interview_context", mock_context["interview_context"]),
                "technical_topics": data.get("technical_topics", mock_context["technical_topics"]),
                "skill_priorities": data.get("skill_priorities", mock_context["skill_priorities"]),
                "difficulty_level": data.get("difficulty_level", mock_context["difficulty_level"])
            }
        except Exception as e:
            logger.error(f"Gemini resume intelligence evaluation failed: {e}")
            return mock_context

    @classmethod
    def analyze_resume_for_intel(cls, resume: str) -> dict:
        """
        Extracts contact details, skills, target roles, and optimization feedback from raw resume text using Gemini.
        """
        model = cls.get_model()

        mock_analysis = {
            "email": "candidate@example.com",
            "phone": "+1-555-0199",
            "location": "San Francisco, CA",
            "extracted_skills": ["Python", "JavaScript", "React", "FastAPI"],
            "recommended_skills": ["Docker", "Kubernetes", "AWS", "CI/CD"],
            "target_roles": ["Full Stack Engineer", "Backend Developer", "Software Engineer"],
            "feedback": [
                "Add 'Docker' to match 90% of DevOps roles.",
                "Structure your work experience with quantitative business outcomes (e.g. 'Reduced latency by 20%').",
                "Highlight your experience with cloud deployments or AWS services."
            ]
        }

        if not model:
            logger.info("Using mock resume parsing intelligence (No Gemini API Key).")
            return mock_analysis

        prompt = f"""
        You are an advanced ATS parser and resume optimization analyst. Analyze the raw resume text below:

        Resume Text:
        {resume}

        Extract and evaluate:
        1. Contact details: email, phone, location. If not found, output mock or empty.
        2. Extracted skills: Core technical skills found in the text.
        3. Recommended skills: Technical skills that are commonly paired with their skillset but are missing or weak in their resume.
        4. Target roles: Potential job titles they are suited for.
        5. Optimization feedback: Bulleted suggestions to improve their ATS score (e.g. "Add 'Docker' to match 90% of DevOps roles.")

        Return response as a valid JSON object matching this schema:
        {{
            "email": "candidate_email",
            "phone": "candidate_phone",
            "location": "candidate_location",
            "extracted_skills": ["Skill A", "Skill B"],
            "recommended_skills": ["Skill C", "Skill D"],
            "target_roles": ["Role 1", "Role 2"],
            "feedback": ["Tip 1", "Tip 2"]
        }}

        Do not include any extra text, code blocks, or markdown formatting outside the JSON object.
        """

        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            return {
                "email": data.get("email", mock_analysis["email"]),
                "phone": data.get("phone", mock_analysis["phone"]),
                "location": data.get("location", mock_analysis["location"]),
                "extracted_skills": data.get("extracted_skills", mock_analysis["extracted_skills"]),
                "recommended_skills": data.get("recommended_skills", mock_analysis["recommended_skills"]),
                "target_roles": data.get("target_roles", mock_analysis["target_roles"]),
                "feedback": data.get("feedback", mock_analysis["feedback"])
            }
        except Exception as e:
            logger.error(f"Gemini resume analysis failed: {e}")
            return mock_analysis
