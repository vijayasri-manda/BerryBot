from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.interview import QuestionOut

class CategoryScore(BaseModel):
    category: str
    score: float
    weight_percentage: float

class LearningRecommendation(BaseModel):
    topic: str
    description: str
    resources: List[str] = []
    priority: str = "High"  # High, Medium, Low

class AuditLogOut(BaseModel):
    id: int
    session_id: Optional[int]
    performed_by_id: int
    action: str
    previous_value: Optional[str]
    new_value: Optional[str]
    reason: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class FullInterviewReportOut(BaseModel):
    session_id: int
    candidate_id: int
    candidate_name: str
    candidate_email: str
    job_role: str
    experience_level: str
    interview_type: str
    language: str
    created_at: datetime
    completed_at: Optional[datetime]
    duration_minutes: int
    
    # Scores
    overall_score: float
    technical_score: float
    relevance_score: float
    depth_score: float
    problem_solving_score: float
    clarity_score: float
    resume_match_score: float
    
    # Rubric weighting applied
    rubric_weights: Dict[str, float]

    # Recommendations & Explanations
    recommendation: str
    recommendation_justification: str
    strengths_summary: str
    knowledge_gaps_summary: str
    learning_recommendations: List[LearningRecommendation] = []

    # Recruiter review section
    recruiter_override_score: Optional[float] = None
    recruiter_override_recommendation: Optional[str] = None
    recruiter_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    # Questions & Detailed Rubric Breakdown
    questions: List[QuestionOut] = []
    audit_history: List[AuditLogOut] = []

class RecruiterOverrideRequest(BaseModel):
    override_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    override_recommendation: Optional[str] = None # Strong Match, Potential Match, Further Assessment Recommended, Does Not Yet Meet Defined Criteria
    recruiter_notes: str = Field(..., min_length=3, description="Justification for override")

class RubricConfigSchema(BaseModel):
    role_key: str = "default"
    question_count: int = Field(5, ge=1, le=20, description="Number of questions set by HR for each candidate interview")
    duration_minutes: int = Field(15, ge=5, le=90, description="Interview duration set by HR in minutes")
    technical_weight: float = Field(0.30, ge=0.0, le=1.0)
    relevance_weight: float = Field(0.20, ge=0.0, le=1.0)
    depth_weight: float = Field(0.20, ge=0.0, le=1.0)
    problem_solving_weight: float = Field(0.20, ge=0.0, le=1.0)
    clarity_weight: float = Field(0.10, ge=0.0, le=1.0)

class RecruiterDashboardItem(BaseModel):
    session_id: int
    candidate_id: int
    candidate_name: str
    candidate_email: str
    job_role: str
    experience_level: str
    language: str
    overall_score: float
    effective_score: float # override if present else overall
    recommendation: str
    effective_recommendation: str
    status: str
    created_at: datetime
    is_reviewed: bool
