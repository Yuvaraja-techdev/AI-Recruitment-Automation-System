import os
import json
import uuid
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from models_interview.interview_models import (
    StartInterviewRequest, StartInterviewResponse,
    GenerateQuestionRequest, GenerateQuestionResponse,
    EvaluateAnswerRequest, EvaluateAnswerResponse,
    NextQuestionRequest, NextQuestionResponse,
    EndInterviewRequest, EndInterviewResponse
)
from services.gemini_service import GeminiService
from services.whisper_service import WhisperService
from services.evaluation_service import EvaluationService
from database import (
    db_create_session,
    db_get_session,
    db_update_current_question,
    db_save_question_turn,
    db_end_session
)

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/start-interview", response_model=StartInterviewResponse)
def start_interview(request: StartInterviewRequest):
    """Starts a new interview session and generates the first question."""
    session_id = str(uuid.uuid4())
    logger.info(f"Starting interview session: {session_id} for candidate {request.candidate_name}")
    
    first_question = GeminiService.generate_first_question(
        name=request.candidate_name,
        role=request.role,
        resume=request.resume
    )
    
    db_create_session(
        session_id=session_id,
        candidate_name=request.candidate_name,
        role=request.role,
        resume=request.resume,
        first_question=first_question,
        candidate_id=request.candidate_id
    )
    
    return StartInterviewResponse(session_id=session_id, first_question=first_question)


@router.post("/generate-question", response_model=GenerateQuestionResponse)
def generate_question(request: GenerateQuestionRequest):
    """Utility endpoint to generate a question based on current session history."""
    session = db_get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    
    q_num = len(session["questions"]) + 1
    
    # Generate question
    question = GeminiService.generate_next_question(
        role=session["role"],
        resume=session["resume"],
        history=session["questions"]
    )
    
    db_update_current_question(request.session_id, question)
    
    return GenerateQuestionResponse(question_number=q_num, question=question)

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """Transcribes an uploaded audio file (.webm or other) using local Faster Whisper."""
    logger.info(f"Received audio transcription request for file: {file.filename}")
    try:
        content = await file.read()
        transcript = WhisperService.transcribe(content)
        return {"transcript": transcript}
    except Exception as e:
        logger.error(f"Transcription route error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
def evaluate_answer(request: EvaluateAnswerRequest):
    """Evaluates the candidate's transcribed response and optionally persists it."""
    logger.info("Evaluating candidate answer...")
    
    eval_res = EvaluationService.evaluate_answer(
        question=request.question,
        answer=request.answer,
        role=request.role,
        resume=request.resume
    )
    
    # If session ID is provided, save this turn into the persistent database
    if request.session_id:
        session = db_get_session(request.session_id)
        if session:
            db_save_question_turn(
                session_id=request.session_id,
                question_text=request.question,
                answer_text=request.answer,
                technical_score=eval_res["technical_score"],
                communication_score=eval_res["communication_score"],
                confidence_score=eval_res["confidence_score"],
                problem_solving_score=eval_res["problem_solving_score"],
                relevance_score=eval_res["relevance_score"],
                completeness_score=eval_res["completeness_score"],
                feedback=eval_res["feedback"]
            )
            logger.info(f"Saved evaluated turn for session {request.session_id}")
        else:
            logger.warning(f"Session ID {request.session_id} provided but not found in data store.")
            
    return EvaluateAnswerResponse(
        technical_score=eval_res["technical_score"],
        communication_score=eval_res["communication_score"],
        confidence_score=eval_res["confidence_score"],
        problem_solving_score=eval_res["problem_solving_score"],
        relevance_score=eval_res["relevance_score"],
        completeness_score=eval_res["completeness_score"],
        feedback=eval_res["feedback"]
    )


@router.post("/next-question", response_model=NextQuestionResponse)
def next_question(request: NextQuestionRequest):
    """Returns or generates the next question. Handles the 5-question limit."""
    session = db_get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    
    q_count = len(session["questions"])
    
    # 5 question limit check
    if q_count >= 5:
        return NextQuestionResponse(
            question_number=q_count,
            next_question="",
            is_finished=True
        )
        
    next_q = GeminiService.generate_next_question(
        role=session["role"],
        resume=session["resume"],
        history=session["questions"]
    )
    
    db_update_current_question(request.session_id, next_q)
    
    return NextQuestionResponse(
        question_number=q_count + 1,
        next_question=next_q,
        is_finished=False
    )

@router.post("/end-interview", response_model=EndInterviewResponse)
def end_interview(request: EndInterviewRequest):
    """Concludes the interview and generates overall scores and recommendation."""
    session = db_get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
        
    logger.info(f"Concluding interview session: {request.session_id}")
    
    summary_res = EvaluationService.evaluate_interview_end(
        role=session["role"],
        resume=session["resume"],
        history=session["questions"]
    )
    
    db_end_session(
        session_id=request.session_id,
        overall_score=summary_res["overall_score"],
        summary=summary_res["summary"],
        recommendation=summary_res["recommendation"]
    )

    # Save the report to candidate profile in SQLite database if candidate_id exists
    candidate_id = session.get("candidate_id")
    if candidate_id:
        try:
            from database import SessionLocal
            import models
            db = SessionLocal()
            try:
                candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()
                if candidate:
                    candidate.overall_score = summary_res["overall_score"]
                    candidate.interview_summary = summary_res["summary"]
                    candidate.interview_recommendation = summary_res["recommendation"]
                    # Store session questions as logs
                    candidate.interview_logs = session.get("questions", [])
                    
                    # Map final recommendation to recruiter recruitment status
                    rec_rec = summary_res["recommendation"].lower()
                    if rec_rec == "selected":
                        candidate.status = "SELECTED"
                    elif rec_rec == "rejected":
                        candidate.status = "REJECTED"
                        
                    db.commit()
                    logger.info(f"Successfully saved interview report back to Candidate profile in SQLite: {candidate_id}")
            except Exception as inner_e:
                logger.error(f"Failed to update candidate record in SQLite: {inner_e}")
                db.rollback()
            finally:
                db.close()
        except Exception as outer_e:
            logger.error(f"Failed to initialize SQLite session for candidate mapping: {outer_e}")
    
    return EndInterviewResponse(
        overall_score=summary_res["overall_score"],
        summary=summary_res["summary"],
        recommendation=summary_res["recommendation"]
    )


