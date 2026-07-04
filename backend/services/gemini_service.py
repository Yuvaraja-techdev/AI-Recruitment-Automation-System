import os
import json
import logging
import google.generativeai as genai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize GenAI client
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    logger.info("Gemini API configured successfully.")
else:
    logger.warning("GEMINI_API_KEY not found in environment. Running in fallback/mock mode.")

# We use gemini-1.5-flash as it is fast and has a free tier
MODEL_NAME = "gemini-1.5-flash"

class GeminiService:
    @staticmethod
    def get_model():
        if not api_key:
            return None
        try:
            return genai.GenerativeModel(MODEL_NAME)
        except Exception as e:
            logger.error(f"Error initializing Gemini Model: {e}")
            return None

    @classmethod
    def generate_first_question(cls, name: str, role: str, resume: str) -> str:
        model = cls.get_model()
        if not model:
            logger.info("Using mock first question (No Gemini API Key).")
            return f"Hi {name}, welcome! Based on your application for {role}, can you explain a project on your resume where you used a modern framework and what challenges you overcame?"

        prompt = f"""
        You are an expert technical interviewer.
        Candidate Name: {name}
        Role applied for: {role}
        Candidate Resume: {resume}

        Generate the first technical or behavioral question for this candidate's interview.
        Tailor the question to the candidate's resume and the role they are applying for. 
        It should be professional, clear, and relevant.

        Return the output as a valid JSON object matching this schema:
        {{
            "question": "The question text here"
        }}
        """

        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            return data.get("question", "Could you tell me about yourself and your experience related to this role?")
        except Exception as e:
            logger.error(f"Gemini API error generating first question: {e}")
            return f"Can you describe your experience with the key technologies mentioned in your resume for the {role} position?"

    @classmethod
    def generate_next_question(cls, role: str, resume: str, history: list) -> str:
        # history is a list of dicts: [{"question": str, "answer": str, "scores": dict}]
        q_count = len(history) + 1
        model = cls.get_model()

        # 1. Calculate average score of the last answer to gauge candidate response performance
        last_score_avg = 7.0  # Default to medium
        if history:
            last_turn = history[-1]
            scores = last_turn.get("scores", {})
            if isinstance(scores, dict):
                available_scores = []
                for k in ["technical_score", "communication_score", "confidence_score", "problem_solving_score", "relevance_score", "completeness_score"]:
                    if k in scores and isinstance(scores[k], (int, float)):
                        available_scores.append(scores[k])
                if available_scores:
                    last_score_avg = sum(available_scores) / len(available_scores)

        # 2. Determine target difficulty instructions
        if last_score_avg < 5.5:
            difficulty_target = "EASY (Foundational concepts and simple explanation tasks)"
            diff_desc = "The candidate answered poorly. Lower the difficulty level to foundational or introductory concepts in their primary framework or programming language."
        elif last_score_avg >= 7.5:
            difficulty_target = "HARD (Advanced system design, performance bottlenecks, concurrency, or scaling)"
            diff_desc = "The candidate answered excellently. Raise the difficulty level to senior or expert architectural concepts, asking them to explain scaling limits, concurrency issues, database locking, or performance bottlenecks."
        else:
            difficulty_target = "MEDIUM (Standard design patterns, software development scenarios, and debugging)"
            diff_desc = "The candidate answered at an average level. Maintain a standard standard developer difficulty target."

        # 3. Dynamic Mock Fallback Database
        if not model:
            logger.info(f"Using mock adaptive next question (No Gemini API Key). Avg Score: {last_score_avg:.1f}")
            easy_mocks = [
                "Can you explain the basic differences between local variables and global variables, and why we avoid globals?",
                "Could you walk me through the lifecycle of a component in React, explaining props and state simply?",
                "What is a primary key in a database, and how does it differ from a foreign key?",
                "Can you explain what an API is and what GET and POST methods do?"
            ]
            medium_mocks = [
                "How do you ensure code quality and write effective unit tests in your applications?",
                "Can you discuss a time you had to deal with a severe performance bottleneck or memory leak?",
                "How do you handle disagreement with senior developers or product managers regarding architectural decisions?",
                "What is your approach to learning new technologies or adapting to sudden shifts in project requirements?"
            ]
            hard_mocks = [
                "Could you walk me through your understanding of scaling web systems to handle millions of requests, including load balancers and cache invalidation?",
                "How would you design a database indexing strategy for a high-write table to prevent locking and query degradation?",
                "Explain how you would implement a distributed transaction mechanism across multiple microservices to guarantee eventual consistency.",
                "How do you optimize Webpack or Vite compilation configurations to minimize initial load time in massive enterprise React codebases?"
            ]

            if last_score_avg < 5.5:
                mock_list = easy_mocks
            elif last_score_avg >= 7.5:
                mock_list = hard_mocks
            else:
                mock_list = medium_mocks

            index = min(max(0, len(history) - 1), len(mock_list) - 1)
            return mock_list[index]

        # 4. Gemini Prompt Construction
        history_formatted = ""
        for i, turn in enumerate(history):
            scores = turn.get("scores", {})
            history_formatted += (
                f"Q{i+1}: {turn.get('question')}\n"
                f"Answer: {turn.get('answer')}\n"
                f"Scores: Tech={scores.get('technical_score')}, Comm={scores.get('communication_score')}\n\n"
            )

        prompt = f"""
        You are an expert technical interviewer.
        Role applied for: {role}
        Resume: {resume}
        
        Below is the history of the interview so far:
        {history_formatted}

        We are now generating question number {q_count} of 5.
        
        ADAPTIVE INTERVIEW ENGINE CONFIGURATION:
        - Candidate's last answer overall rating: {last_score_avg:.1f}/10
        - Target Difficulty Level for next question: {difficulty_target}
        - Instructions: {diff_desc}
        
        Generate the next question matching this target difficulty. Keep it professional, clear, and relevant.

        Return the output as a valid JSON object matching this schema:
        {{
            "question": "The question text here"
        }}
        
        Do not include any extra text, code blocks, or markdown formatting outside the JSON object.
        """

        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            return data.get("question", "How do you stay updated with industry trends and incorporate new tools into your workflow?")
        except Exception as e:
            logger.error(f"Gemini API error generating next question: {e}")
            return "How do you optimize application performance when dealing with high database concurrency?"
