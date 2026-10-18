from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.interview import InterviewSession
from app.models.audit import AuditLog, RubricConfig
from app.schemas.report import (
    RecruiterDashboardItem, RecruiterOverrideRequest, RubricConfigSchema, AuditLogOut
)
from app.services.auth_service import get_current_recruiter_or_admin
from app.schemas.interview import InterviewPolicy

router = APIRouter(prefix="/recruiter", tags=["Recruiter / Admin"])

@router.put("/interview-policy", response_model=InterviewPolicy)
def update_interview_policy(
    policy: InterviewPolicy,
    current_user: User = Depends(get_current_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    config = db.query(RubricConfig).filter(RubricConfig.role_key == "default").first()
    if config is None:
        config = RubricConfig(role_key="default")
        db.add(config)
    previous_count = config.question_count if config.question_count is not None else 5
    config.question_count = policy.question_count
    db.add(AuditLog(
        performed_by_id=current_user.id,
        action="INTERVIEW_POLICY_UPDATED",
        previous_value=str(previous_count),
        new_value=str(policy.question_count),
        reason="HR updated the question count for new interviews"
    ))
    db.commit()
    return policy

@router.get("/candidates", response_model=List[RecruiterDashboardItem])
def list_candidates(
    search: Optional[str] = Query(None, description="Search by candidate name, email, or role"),
    role: Optional[str] = Query(None, description="Filter by job role"),
    recommendation: Optional[str] = Query(None, description="Filter by recommendation"),
    current_user: User = Depends(get_current_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(InterviewSession).join(User, InterviewSession.user_id == User.id)

    if search:
        s_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(s_term),
                User.email.ilike(s_term),
                InterviewSession.job_role.ilike(s_term)
            )
        )
    if role:
        query = query.filter(InterviewSession.job_role.ilike(f"%{role}%"))
    if recommendation:
        query = query.filter(
            or_(
                InterviewSession.recommendation == recommendation,
                InterviewSession.recruiter_override_recommendation == recommendation
            )
        )

    sessions = query.order_by(InterviewSession.created_at.desc()).all()

    results = []
    for s in sessions:
        eff_score = s.recruiter_override_score if s.recruiter_override_score is not None else s.overall_score
        eff_rec = s.recruiter_override_recommendation if s.recruiter_override_recommendation else (s.recommendation or "Pending")
        results.append(RecruiterDashboardItem(
            session_id=s.id,
            candidate_id=s.user.id,
            candidate_name=s.user.full_name,
            candidate_email=s.user.email,
            job_role=s.job_role,
            experience_level=s.experience_level,
            language=s.language,
            overall_score=s.overall_score,
            effective_score=eff_score,
            recommendation=s.recommendation or "Pending",
            effective_recommendation=eff_rec,
            status=s.status,
            created_at=s.created_at,
            is_reviewed=s.recruiter_override_score is not None or s.recruiter_notes is not None
        ))
    return results

@router.post("/sessions/{session_id}/override")
def override_candidate_evaluation(
    session_id: int,
    override_data: RecruiterOverrideRequest,
    current_user: User = Depends(get_current_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    # Record previous values for audit log
    prev_state = f"Score: {session.overall_score}, OverrideScore: {session.recruiter_override_score}, Rec: {session.recommendation}, OverrideRec: {session.recruiter_override_recommendation}"

    if override_data.override_score is not None:
        session.recruiter_override_score = override_data.override_score
    if override_data.override_recommendation:
        session.recruiter_override_recommendation = override_data.override_recommendation
    
    session.recruiter_notes = override_data.recruiter_notes
    session.recruiter_reviewer_id = current_user.id
    session.reviewed_at = datetime.utcnow()

    new_state = f"OverrideScore: {session.recruiter_override_score}, OverrideRec: {session.recruiter_override_recommendation}, Notes: {session.recruiter_notes}"

    audit = AuditLog(
        session_id=session.id,
        performed_by_id=current_user.id,
        action="HUMAN_REVIEW_OVERRIDE",
        previous_value=prev_state,
        new_value=new_state,
        reason=override_data.recruiter_notes
    )
    db.add(audit)
    db.commit()
    db.refresh(session)

    return {
        "message": "Evaluation successfully updated by human reviewer",
        "session_id": session.id,
        "effective_score": session.recruiter_override_score or session.overall_score,
        "effective_recommendation": session.recruiter_override_recommendation or session.recommendation,
        "reviewed_at": session.reviewed_at
    }

@router.get("/rubrics", response_model=RubricConfigSchema)
def get_rubric_weights(
    role_key: str = "default",
    current_user: User = Depends(get_current_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    rubric = db.query(RubricConfig).filter(RubricConfig.role_key == role_key).first()
    if not rubric:
        return RubricConfigSchema()
    return RubricConfigSchema(
        role_key=rubric.role_key,
        technical_weight=rubric.technical_weight,
        relevance_weight=rubric.relevance_weight,
        depth_weight=rubric.depth_weight,
        problem_solving_weight=rubric.problem_solving_weight,
        clarity_weight=rubric.clarity_weight
    )

@router.put("/rubrics", response_model=RubricConfigSchema)
def update_rubric_weights(
    cfg: RubricConfigSchema,
    current_user: User = Depends(get_current_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    # Verify sum of weights approx 1.0
    total = cfg.technical_weight + cfg.relevance_weight + cfg.depth_weight + cfg.problem_solving_weight + cfg.clarity_weight
    if abs(total - 1.0) > 0.05:
        raise HTTPException(status_code=400, detail=f"The sum of rubric weights must equal 1.0 (currently {round(total, 2)})")

    rubric = db.query(RubricConfig).filter(RubricConfig.role_key == cfg.role_key).first()
    if not rubric:
        rubric = RubricConfig(role_key=cfg.role_key)
        db.add(rubric)

    prev_state = f"Weights: tech={rubric.technical_weight}, rel={rubric.relevance_weight}, depth={rubric.depth_weight}, prob={rubric.problem_solving_weight}, clarity={rubric.clarity_weight}"

    rubric.technical_weight = cfg.technical_weight
    rubric.relevance_weight = cfg.relevance_weight
    rubric.depth_weight = cfg.depth_weight
    rubric.problem_solving_weight = cfg.problem_solving_weight
    rubric.clarity_weight = cfg.clarity_weight

    new_state = f"Weights: tech={cfg.technical_weight}, rel={cfg.relevance_weight}, depth={cfg.depth_weight}, prob={cfg.problem_solving_weight}, clarity={cfg.clarity_weight}"

    audit = AuditLog(
        session_id=None,
        performed_by_id=current_user.id,
        action="RUBRIC_WEIGHTS_UPDATED",
        previous_value=prev_state,
        new_value=new_state,
        reason=f"Recruiter updated rubric weights for {cfg.role_key}"
    )
    db.add(audit)
    db.commit()

    return cfg

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    current_user: User = Depends(get_current_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()
    return logs
