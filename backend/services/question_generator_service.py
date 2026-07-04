import os
import json
import logging
# pyrefly: ignore [missing-import]
import google.generativeai as genai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

MODEL_NAME = "gemini-1.5-flash"

class QuestionGeneratorService:
    @classmethod
    def get_model(cls):
        if not api_key:
            return None
        try:
            return genai.GenerativeModel(MODEL_NAME)
        except Exception as e:
            logger.error(f"Error initializing Gemini Model in QuestionGeneratorService: {e}")
            return None

    @classmethod
    def generate_personalized_questions(cls, resume: str, skills: list, role: str, ats_score: int, job_description: str = None) -> dict:
        """
        Generates structured, personalized interview questions based on the candidate's resume, skills, role,
        ATS score, and optional job description.
        Returns:
            dict: {
                "technical_questions": List[str],
                "behavioral_questions": List[str],
                "project_questions": List[str],
                "follow_up_questions": List[str]
            }
        """
        model = cls.get_model()
        
        # 1. Prep standard mock fallbacks for local/offline testing
        skills_list = skills if isinstance(skills, list) else []
        skills_str = ", ".join(skills_list)
        
        mock_questions = {
            "technical_questions": [
                f"How do you implement core architecture patterns and manage state in a application utilizing {skills_list[0] if skills_list else 'modern frameworks'}?",
                f"Can you explain the trade-offs of using {skills_list[1] if len(skills_list) > 1 else 'REST APIs'} versus alternative protocols in high-concurrency systems?",
                f"How do you optimize performance and perform profiling in codebases that extensively use {skills_list[2] if len(skills_list) > 2 else 'databases'}?"
            ],
            "behavioral_questions": [
                f"Describe a situation in your role as a {role} where you faced sudden requirements changes. How did you adapt your workflow?",
                "Tell me about a time you had to defend an architectural decision to stakeholders. What was the outcome?"
            ],
            "project_questions": [
                f"Based on your resume, you have built applications matching the requirements of {role}. Tell me about the most complex technical challenge you solved in those projects.",
                "Explain the data modeling choices you made in your recent projects. How did you structure tables or documents for scaling?"
            ],
            "follow_up_questions": [
                "How would you measure the success or failure of the scaling strategies you just described?",
                "What changes would you make to your solution if the volume of concurrent operations scaled by a factor of 100?"
            ]
        }

        if not model:
            logger.info("Using mock question generator (No Gemini API Key).")
            return mock_questions

        # 2. Build details prompt
        jd_context = job_description if job_description else f"A professional engineering position looking for expert capability in {role} and skills including {skills_str}."
        
        prompt = f"""
        You are a principal technical interviewer at an elite software company.
        You are interviewing a candidate for the following role:
        
        Applied Role: {role}
        ATS Score: {ats_score}
        Core Matched Skills: {skills_str}
        Target Job Description / Requirements:
        {jd_context}
        
        Candidate Resume:
        {resume}
        
        Generate a highly tailored and personalized set of interview questions for this candidate.
        The questions must target their specific resume background, their experience level (inferred from resume/score), and the skills listed.
        
        Please produce:
        1. "technical_questions": 3 challenging questions examining the core technical concepts, frameworks, and architecture patterns from their skills and resume.
        2. "behavioral_questions": 2 questions targeting leadership, adaptation to deadlines, resolving design disagreements, or soft skills suitable for a {role}.
        3. "project_questions": 2 specific questions about projects or systems they have built according to their resume, checking their design choices.
        4. "follow_up_questions": 2 follow-up/probing questions designed to challenge their initial answers or test constraints (e.g. scaling, security, data consistency).
        
        Return the response as a valid JSON object matching this schema:
        {{
            "technical_questions": ["q1", "q2", "q3"],
            "behavioral_questions": ["q1", "q2"],
            "project_questions": ["q1", "q2"],
            "follow_up_questions": ["q1", "q2"]
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
                "technical_questions": data.get("technical_questions", mock_questions["technical_questions"]),
                "behavioral_questions": data.get("behavioral_questions", mock_questions["behavioral_questions"]),
                "project_questions": data.get("project_questions", mock_questions["project_questions"]),
                "follow_up_questions": data.get("follow_up_questions", mock_questions["follow_up_questions"])
            }
        except Exception as e:
            logger.error(f"Gemini question generation failed: {e}")
            return mock_questions
