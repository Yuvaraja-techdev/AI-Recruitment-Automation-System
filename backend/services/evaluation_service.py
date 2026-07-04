import os
import json
import logging
from .gemini_service import GeminiService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EvaluationService:
    @classmethod
    def evaluate_answer(cls, question: str, answer: str, role: str, resume: str) -> dict:
        """
        Evaluates a candidate's answer to a question using Google Gemini.
        Returns:
            dict: {
                "technical_score": int,
                "communication_score": int,
                "confidence_score": int,
                "problem_solving_score": int,
                "relevance_score": int,
                "completeness_score": int,
                "feedback": str
            }
        """
        model = GeminiService.get_model()
        
        # Guard for silent/empty transcription or system transcription error
        answer_clean = answer.strip()
        is_silent = (
            answer_clean == "[Silent / No Speech Detected]" or
            answer_clean == "[Silent]" or
            answer_clean == "[No Speech Detected]" or
            answer_clean.startswith("[Transcription Error:") or
            len(answer_clean) < 3
        )
        if is_silent:
            return {
                "technical_score": 0,
                "communication_score": 0,
                "confidence_score": 0,
                "problem_solving_score": 0,
                "relevance_score": 0,
                "completeness_score": 0,
                "feedback": "No audible response was detected. Please make sure your microphone is working and speak clearly."
            }

        # Calculate base fallback mock parameters for offline development
        word_count = len(answer.split())
        tech = min(4 + (word_count // 10), 9)
        comm = min(5 + (word_count // 12), 9)
        conf = min(5 + (word_count // 15), 9)
        prob = min(4 + (word_count // 11), 9)
        rel = min(6 + (word_count // 18), 10)
        comp = min(3 + (word_count // 9), 9)

        if not model:
            logger.info("Using mock evaluation (No Gemini API Key).")
            return {
                "technical_score": tech,
                "communication_score": comm,
                "confidence_score": conf,
                "problem_solving_score": prob,
                "relevance_score": rel,
                "completeness_score": comp,
                "feedback": "This is mock feedback because GEMINI_API_KEY is not set. The candidate answered the question and explained the basics, but could detail system design choices or framework trade-offs more clearly."
            }

        prompt = f"""
        You are an expert technical interviewer. Evaluate the candidate's response to the interview question below:
        
        Role applied for: {role}
        Resume: {resume}
        
        Question Asked: {question}
        Candidate's Answer: {answer}
        
        Analyze the answer on six precise criteria:
        1. Technical Knowledge: Are the technical concepts, explanations, and terms accurate?
        2. Communication: Was the answer clear, articulate, structured, and easy to follow?
        3. Confidence: Did the candidate speak with assurance, avoiding excessive hesitation?
        4. Problem Solving: Did they exhibit logical, analytical, or structured reasoning?
        5. Relevance: Did the answer directly address the question without wandering off-topic?
        6. Completeness: Did they cover all parts of the question thoroughly?
        
        Generate a score from 0 to 10 for each of the six criteria.
        Also, write constructive qualitative feedback highlighting key positive points and areas for improvement.
        
        Return the response as a valid JSON object matching this schema:
        {{
            "technical_score": 8,
            "communication_score": 7,
            "confidence_score": 7,
            "problem_solving_score": 8,
            "relevance_score": 9,
            "completeness_score": 6,
            "feedback": "Your description of virtual DOM was accurate. To improve, you could have mentioned reconciliation algorithms."
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
                "technical_score": int(data.get("technical_score", tech)),
                "communication_score": int(data.get("communication_score", comm)),
                "confidence_score": int(data.get("confidence_score", conf)),
                "problem_solving_score": int(data.get("problem_solving_score", prob)),
                "relevance_score": int(data.get("relevance_score", rel)),
                "completeness_score": int(data.get("completeness_score", comp)),
                "feedback": data.get("feedback", "Candidate provided an adequate response.")
            }
        except Exception as e:
            logger.error(f"Gemini evaluation failed: {e}")
            return {
                "technical_score": tech,
                "communication_score": comm,
                "confidence_score": conf,
                "problem_solving_score": prob,
                "relevance_score": rel,
                "completeness_score": comp,
                "feedback": f"Evaluation fallback completed. (Error parsing Gemini response: {str(e)})"
            }

    @classmethod
    def evaluate_interview_end(cls, role: str, resume: str, history: list) -> dict:
        """
        Evaluates the full interview session at the end.
        Returns:
            dict: { "overall_score": float, "summary": str, "recommendation": str }
        """
        model = GeminiService.get_model()

        # Compute numerical averages across all 6 scores
        tech_scores = [turn.get("scores", {}).get("technical_score", 0) for turn in history if turn.get("scores")]
        comm_scores = [turn.get("scores", {}).get("communication_score", 0) for turn in history if turn.get("scores")]
        conf_scores = [turn.get("scores", {}).get("confidence_score", 0) for turn in history if turn.get("scores")]
        prob_scores = [turn.get("scores", {}).get("problem_solving_score", 0) for turn in history if turn.get("scores")]
        rel_scores = [turn.get("scores", {}).get("relevance_score", 0) for turn in history if turn.get("scores")]
        comp_scores = [turn.get("scores", {}).get("completeness_score", 0) for turn in history if turn.get("scores")]
        
        scores_lists = [tech_scores, comm_scores, conf_scores, prob_scores, rel_scores, comp_scores]
        avg_scores = []
        for s_list in scores_lists:
            if s_list:
                avg_scores.append(sum(s_list) / len(s_list))
        
        overall_score = round(sum(avg_scores) / len(avg_scores), 1) if avg_scores else 0.0

        if not model:
            logger.info("Using mock interview summary (No Gemini API Key).")
            rec = "Hold"
            if overall_score >= 8.0:
                rec = "Selected"
            elif overall_score < 5.0:
                rec = "Rejected"
            return {
                "overall_score": overall_score,
                "summary": f"Mock summary for the interview. The candidate completed all questions. The overall multi-criteria average rating concluded at {overall_score}/10.",
                "recommendation": rec
            }

        history_formatted = ""
        for i, turn in enumerate(history):
            scores = turn.get("scores", {})
            history_formatted += (
                f"Q{i+1}: {turn.get('question')}\n"
                f"Answer: {turn.get('answer')}\n"
                f"Scores: Tech={scores.get('technical_score')}, Comm={scores.get('communication_score')}, "
                f"Conf={scores.get('confidence_score')}, Prob={scores.get('problem_solving_score')}, "
                f"Rel={scores.get('relevance_score')}, Comp={scores.get('completeness_score')}\n"
                f"Feedback: {scores.get('feedback')}\n\n"
            )

        prompt = f"""
        You are the Head of Engineering. You are reviewing the candidate's complete interview log to make a hiring decision.
        
        Role applied for: {role}
        Resume: {resume}
        
        Interview Log:
        {history_formatted}
        
        Calculated Overall Score: {overall_score} / 10
        
        Please provide:
        1. A comprehensive summary summarizing the candidate's performance, technical depth, communication skills, and fit.
        2. A recommendation of either 'Selected', 'Hold', or 'Rejected'.
        
        Return the response as a valid JSON object matching this schema:
        {{
            "summary": "The summary paragraph here...",
            "recommendation": "Selected"
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
                "overall_score": overall_score,
                "summary": data.get("summary", "Interview session successfully completed."),
                "recommendation": data.get("recommendation", "Hold")
            }
        except Exception as e:
            logger.error(f"Gemini final review failed: {e}")
            rec = "Hold"
            if overall_score >= 7.5:
                rec = "Selected"
            elif overall_score < 5.0:
                rec = "Rejected"
            return {
                "overall_score": overall_score,
                "summary": "Completed interview review. Fallback summary generated.",
                "recommendation": rec
            }
