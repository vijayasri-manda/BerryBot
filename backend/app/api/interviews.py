import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.interview import InterviewSession, InterviewQuestion
from app.models.audit import RubricConfig
from app.schemas.interview import (
    InterviewCreate, InterviewSessionOut, QuestionAnswerSubmit, QuestionEvaluationOut,
    SessionStatusOut, QuestionOut, InterviewPolicy
)
from app.schemas.report import FullInterviewReportOut
from app.services.auth_service import get_current_user
from app.services.ai_service import AIService
from app.services.pdf_generator import PDFReportGenerator

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.get("/policy", response_model=InterviewPolicy)
def get_interview_policy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    policy = db.query(RubricConfig).filter(RubricConfig.role_key == "default").first()
    return InterviewPolicy(question_count=policy.question_count if policy else 5)

@router.post("", response_model=InterviewSessionOut)
async def create_interview(
    config: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can start interviews")
    policy = db.query(RubricConfig).filter(RubricConfig.role_key == "default").first()
    question_count = policy.question_count if policy else 5
    # 1. Fetch resume data if provided
    parsed_resume = None
    if config.resume_id:
        resume = db.query(Resume).filter(Resume.id == config.resume_id).first()
        if resume:
            parsed_resume = {
                "candidate_name": resume.candidate_name,
                "summary": resume.summary,
                "skills": json.loads(resume.skills_json) if resume.skills_json else {},
                "projects": json.loads(resume.projects_json) if resume.projects_json else [],
                "experience": json.loads(resume.experience_json) if resume.experience_json else [],
                "education": json.loads(resume.education_json) if resume.education_json else [],
                "topics_to_explore": json.loads(resume.topics_json) if resume.topics_json else []
            }

    # 2. Generate dynamic interview questions plan
    plan = await AIService.generate_interview_plan(
        job_role=config.job_role,
        experience_level=config.experience_level,
        interview_type=config.interview_type,
        language=config.language,
        total_questions=question_count,
        parsed_resume=parsed_resume,
        job_description=config.job_description
    )

    # 3. Create Session Record
    session = InterviewSession(
        user_id=current_user.id,
        resume_id=config.resume_id,
        job_role=config.job_role,
        experience_level=config.experience_level,
        interview_type=config.interview_type,
        language=config.language,
        duration_minutes=config.duration_minutes,
        total_questions=len(plan),
        current_question_index=0,
        status="configured",
        job_description=config.job_description
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 4. Create Question Records
    for q_item in plan:
        question = InterviewQuestion(
            session_id=session.id,
            order_index=q_item.get("order_index", 1),
            category=q_item.get("category", "Technical"),
            question_text=q_item.get("question_text", ""),
            question_text_en=q_item.get("question_text_en"),
            audio_caption=q_item.get("audio_caption", q_item.get("question_text", "")),
            expected_topics_json=json.dumps(q_item.get("expected_topics", []))
        )
        db.add(question)
    
    db.commit()
    db.refresh(session)

    return session

@router.get("/history", response_model=List[InterviewSessionOut])
def get_interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).order_by(InterviewSession.created_at.desc()).all()
    return sessions

@router.get("/{interview_id}", response_model=InterviewSessionOut)
def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session.user_id != current_user.id and current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this interview")
    return session

@router.post("/{interview_id}/start")
def start_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    session.status = "in_progress"
    if not session.started_at:
        session.started_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return {"message": "Interview started", "status": session.status, "current_question_index": session.current_question_index}

@router.post("/{interview_id}/answer", response_model=QuestionEvaluationOut)
async def submit_answer(
    interview_id: int,
    answer_in: QuestionAnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Locate current question
    questions = session.questions
    if session.current_question_index >= len(questions):
        raise HTTPException(status_code=400, detail="All questions have already been answered")

    current_q = questions[session.current_question_index]
    current_q.candidate_answer = answer_in.answer_text
    current_q.answer_input_type = answer_in.input_type
    current_q.audio_duration_seconds = answer_in.audio_duration_seconds
    current_q.answered_at = datetime.utcnow()

    # Get rubric weights
    rubric_cfg = db.query(RubricConfig).filter(RubricConfig.role_key == "default").first()
    rubric_weights = {
        "technical_correctness": rubric_cfg.technical_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["technical_correctness"],
        "relevance": rubric_cfg.relevance_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["relevance"],
        "depth_of_understanding": rubric_cfg.depth_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["depth_of_understanding"],
        "problem_solving": rubric_cfg.problem_solving_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["problem_solving"],
        "clarity_of_explanation": rubric_cfg.clarity_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["clarity_of_explanation"],
    }

    expected_topics = json.loads(current_q.expected_topics_json) if current_q.expected_topics_json else []

    # Evaluate using AI Engine
    evaluation = await AIService.evaluate_answer(
        question_text=current_q.question_text,
        candidate_answer=answer_in.answer_text,
        category=current_q.category,
        job_role=session.job_role,
        experience_level=session.experience_level,
        language=session.language,
        expected_topics=expected_topics,
        rubric_weights=rubric_weights
    )

    current_q.score_overall = evaluation.get("score_overall", 0.0)
    current_q.score_technical = evaluation.get("score_technical", 0.0)
    current_q.score_relevance = evaluation.get("score_relevance", 0.0)
    current_q.score_depth = evaluation.get("score_depth", 0.0)
    current_q.score_problem_solving = evaluation.get("score_problem_solving", 0.0)
    current_q.score_clarity = evaluation.get("score_clarity", 0.0)
    current_q.feedback_justification = evaluation.get("feedback_justification", "")
    current_q.strengths = evaluation.get("strengths", "")
    current_q.missing_concepts = evaluation.get("missing_concepts", "")
    current_q.ideal_answer_summary = evaluation.get("ideal_answer_summary", "")

    db.commit()
    db.refresh(current_q)

    return QuestionEvaluationOut(
        question_id=current_q.id,
        score_overall=current_q.score_overall,
        score_technical=current_q.score_technical,
        score_relevance=current_q.score_relevance,
        score_depth=current_q.score_depth,
        score_problem_solving=current_q.score_problem_solving,
        score_clarity=current_q.score_clarity,
        feedback_justification=current_q.feedback_justification or "",
        strengths=current_q.strengths or "",
        missing_concepts=current_q.missing_concepts or "",
        ideal_answer_summary=current_q.ideal_answer_summary or ""
    )

@router.post("/{interview_id}/next-question")
async def next_question(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    next_idx = session.current_question_index + 1
    session.current_question_index = next_idx

    # If all questions reached, finalize interview
    if next_idx >= len(session.questions):
        _finalize_interview_session(session, db)
        return {
            "is_completed": True,
            "status": "completed",
            "current_question_index": next_idx,
            "overall_score": session.overall_score,
            "recommendation": session.recommendation
        }

    db.commit()
    db.refresh(session)
    next_q = session.questions[next_idx]

    return {
        "is_completed": False,
        "status": session.status,
        "current_question_index": next_idx,
        "next_question": QuestionOut.from_orm(next_q)
    }

@router.post("/{interview_id}/pause")
def pause_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    session.status = "paused"
    db.commit()
    return {"message": "Interview paused", "status": session.status}

@router.post("/{interview_id}/resume")
def resume_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    session.status = "in_progress"
    db.commit()
    return {"message": "Interview resumed", "status": session.status}

@router.post("/{interview_id}/end")
def end_interview_early(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    _finalize_interview_session(session, db)
    return {"message": "Interview concluded", "overall_score": session.overall_score, "recommendation": session.recommendation}

@router.get("/{interview_id}/report", response_model=FullInterviewReportOut)
def get_interview_report(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")
    if session.user_id != current_user.id and current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to access report")

    candidate = session.user
    rubric_cfg = db.query(RubricConfig).filter(RubricConfig.role_key == "default").first()
    rubric_weights = {
        "technical_correctness": rubric_cfg.technical_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["technical_correctness"],
        "relevance": rubric_cfg.relevance_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["relevance"],
        "depth_of_understanding": rubric_cfg.depth_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["depth_of_understanding"],
        "problem_solving": rubric_cfg.problem_solving_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["problem_solving"],
        "clarity_of_explanation": rubric_cfg.clarity_weight if rubric_cfg else settings.DEFAULT_RUBRIC_WEIGHTS["clarity_of_explanation"],
    }

    learning_recs = json.loads(session.learning_recommendations_json) if session.learning_recommendations_json else []

    return FullInterviewReportOut(
        session_id=session.id,
        candidate_id=candidate.id,
        candidate_name=candidate.full_name,
        candidate_email=candidate.email,
        job_role=session.job_role,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        language=session.language,
        created_at=session.created_at,
        completed_at=session.completed_at,
        duration_minutes=session.duration_minutes,
        overall_score=session.overall_score,
        technical_score=session.technical_score,
        relevance_score=session.relevance_score,
        depth_score=session.depth_score,
        problem_solving_score=session.problem_solving_score,
        clarity_score=session.clarity_score,
        resume_match_score=session.resume_match_score,
        rubric_weights=rubric_weights,
        recommendation=session.recommendation or "Assessment in Progress",
        recommendation_justification=session.recommendation_justification or "Assessment in Progress",
        strengths_summary=session.strengths_summary or "In evaluation",
        knowledge_gaps_summary=session.knowledge_gaps_summary or "In evaluation",
        learning_recommendations=learning_recs,
        recruiter_override_score=session.recruiter_override_score,
        recruiter_override_recommendation=session.recruiter_override_recommendation,
        recruiter_notes=session.recruiter_notes,
        reviewed_at=session.reviewed_at,
        questions=[QuestionOut.from_orm(q) for q in session.questions],
        audit_history=[]
    )

@router.get("/{interview_id}/report/pdf")
def download_interview_pdf(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")
    if session.user_id != current_user.id and current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    report_data = {
        "candidate_name": session.user.full_name,
        "candidate_email": session.user.email,
        "job_role": session.job_role,
        "experience_level": session.experience_level,
        "interview_type": session.interview_type,
        "language": session.language,
        "overall_score": session.overall_score,
        "recommendation": session.recommendation,
        "recommendation_justification": session.recommendation_justification,
        "technical_score": session.technical_score,
        "relevance_score": session.relevance_score,
        "depth_score": session.depth_score,
        "problem_solving_score": session.problem_solving_score,
        "clarity_score": session.clarity_score,
        "recruiter_override_score": session.recruiter_override_score,
        "recruiter_override_recommendation": session.recruiter_override_recommendation,
        "recruiter_notes": session.recruiter_notes,
        "questions": [
            {
                "order_index": q.order_index,
                "category": q.category,
                "question_text": q.question_text,
                "candidate_answer": q.candidate_answer,
                "score_overall": q.score_overall,
                "feedback_justification": q.feedback_justification,
                "strengths": q.strengths,
                "missing_concepts": q.missing_concepts
            }
            for q in session.questions
        ]
    }

    pdf_bytes = PDFReportGenerator.generate_interview_pdf(report_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=BerriBot_Report_Session_{session.id}.pdf"
        }
    )

def _finalize_interview_session(session: InterviewSession, db: Session):
    answered = [q for q in session.questions if q.candidate_answer]
    if answered:
        avg_overall = sum(q.score_overall for q in answered) / len(answered)
        avg_tech = sum(q.score_technical for q in answered) / len(answered)
        avg_rel = sum(q.score_relevance for q in answered) / len(answered)
        avg_depth = sum(q.score_depth for q in answered) / len(answered)
        avg_prob = sum(q.score_problem_solving for q in answered) / len(answered)
        avg_clarity = sum(q.score_clarity for q in answered) / len(answered)
    else:
        avg_overall = avg_tech = avg_rel = avg_depth = avg_prob = avg_clarity = 0.0

    session.overall_score = round(avg_overall, 1)
    session.technical_score = round(avg_tech, 1)
    session.relevance_score = round(avg_rel, 1)
    session.depth_score = round(avg_depth, 1)
    session.problem_solving_score = round(avg_prob, 1)
    session.clarity_score = round(avg_clarity, 1)
    session.resume_match_score = round(min(98.0, max(60.0, avg_overall * 1.05)), 1)
    session.status = "completed"
    session.completed_at = datetime.utcnow()

    # Generate final recommendation
    final_analysis = AIService.generate_final_recommendation(
        overall_score=session.overall_score,
        scores_by_cat={},
        job_role=session.job_role,
        experience_level=session.experience_level,
        questions=answered
    )

    session.recommendation = final_analysis["recommendation"]
    session.recommendation_justification = final_analysis["recommendation_justification"]
    session.strengths_summary = final_analysis["strengths_summary"]
    session.knowledge_gaps_summary = final_analysis["knowledge_gaps_summary"]
    session.learning_recommendations_json = json.dumps(final_analysis["learning_recommendations"])

    db.commit()
    db.refresh(session)
