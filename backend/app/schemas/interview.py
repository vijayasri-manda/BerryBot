from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class InterviewPolicy(BaseModel):
    question_count: int = Field(default=5, ge=3, le=10, strict=True)


class InterviewCreate(BaseModel):
    job_role: str = Field(..., description="Target job role")
    experience_level: str = Field(default="Fresher", description="Fresher, Intermediate, Experienced")
    interview_type: str = Field(default="Mixed", description="Technical, HR, Behavioral, Mixed")
    language: str = Field(default="en", description="en, te, hi, ta, kn")
    duration_minutes: int = Field(default=15, description="10, 20, 30")
    resume_id: Optional[int] = None
    job_description: Optional[str] = None

class QuestionAnswerSubmit(BaseModel):
    answer_text: str
    input_type: str = "text"  # "voice" or "text"
    audio_duration_seconds: float = 0.0

class QuestionEvaluationOut(BaseModel):
    question_id: int
    score_overall: float
    score_technical: float
    score_relevance: float
    score_depth: float
    score_problem_solving: float
    score_clarity: float
    feedback_justification: str
    strengths: str
    missing_concepts: str
    ideal_answer_summary: str

class QuestionOut(BaseModel):
    id: int
    session_id: int
    order_index: int
    category: str
    question_text: str
    question_text_en: Optional[str] = None
    audio_caption: Optional[str] = None
    is_follow_up: bool = False
    candidate_answer: Optional[str] = None
    answer_input_type: Optional[str] = None
    score_overall: float = 0.0
    feedback_justification: Optional[str] = None
    strengths: Optional[str] = None
    missing_concepts: Optional[str] = None
    ideal_answer_summary: Optional[str] = None
    answered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SessionStatusOut(BaseModel):
    session_id: int
    status: str
    current_question_index: int
    total_questions: int
    current_question: Optional[QuestionOut] = None
    is_completed: bool = False
    overall_score: float = 0.0

class InterviewSessionOut(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    job_role: str
    experience_level: str
    interview_type: str
    language: str
    duration_minutes: int
    total_questions: int
    current_question_index: int
    status: str
    overall_score: float
    technical_score: float
    relevance_score: float
    depth_score: float
    problem_solving_score: float
    clarity_score: float
    resume_match_score: float
    recommendation: Optional[str] = None
    recommendation_justification: Optional[str] = None
    strengths_summary: Optional[str] = None
    knowledge_gaps_summary: Optional[str] = None
    learning_recommendations_json: Optional[str] = None
    recruiter_override_score: Optional[float] = None
    recruiter_override_recommendation: Optional[str] = None
    recruiter_notes: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True
