from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True, index=True)
    
    # Configuration
    job_role = Column(String(100), nullable=False)
    experience_level = Column(String(50), default="Fresher")  # Fresher, Intermediate, Experienced
    interview_type = Column(String(50), default="Mixed")       # Technical, HR, Behavioral, Mixed
    language = Column(String(10), default="en")                # en, te, hi, ta, kn
    duration_minutes = Column(Integer, default=15)
    total_questions = Column(Integer, default=5)
    current_question_index = Column(Integer, default=0)
    status = Column(String(50), default="configured")          # configured, in_progress, paused, completed
    job_description = Column(Text, nullable=True)

    # Aggregated Evaluation Results
    overall_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)
    depth_score = Column(Float, default=0.0)
    problem_solving_score = Column(Float, default=0.0)
    clarity_score = Column(Float, default=0.0)
    resume_match_score = Column(Float, default=0.0)

    recommendation = Column(String(100), nullable=True)       # Strong Match, Potential Match, Further Assessment Recommended, Does Not Yet Meet Defined Criteria
    recommendation_justification = Column(Text, nullable=True)
    strengths_summary = Column(Text, nullable=True)
    knowledge_gaps_summary = Column(Text, nullable=True)
    learning_recommendations_json = Column(Text, nullable=True) # JSON list of recommended resources/topics

    # Recruiter / Human Reviewer Overrides & Audit
    recruiter_override_score = Column(Float, nullable=True)
    recruiter_override_recommendation = Column(String(100), nullable=True)
    recruiter_notes = Column(Text, nullable=True)
    recruiter_reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="candidate_sessions")
    reviewer = relationship("User", foreign_keys=[recruiter_reviewer_id], backref="reviewed_sessions")
    resume = relationship("Resume", backref="interviews")
    questions = relationship("InterviewQuestion", backref="session", cascade="all, delete-orphan", order_by="InterviewQuestion.order_index")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False)
    category = Column(String(100), default="Technical")
    
    question_text = Column(Text, nullable=False)
    question_text_en = Column(Text, nullable=True)
    audio_caption = Column(Text, nullable=True)
    expected_topics_json = Column(Text, nullable=True)

    # Candidate Answer
    candidate_answer = Column(Text, nullable=True)
    answer_input_type = Column(String(20), default="text") # voice, text
    audio_duration_seconds = Column(Float, default=0.0)

    # Question-specific Evaluation Scores (0 - 100)
    score_overall = Column(Float, default=0.0)
    score_technical = Column(Float, default=0.0)
    score_relevance = Column(Float, default=0.0)
    score_depth = Column(Float, default=0.0)
    score_problem_solving = Column(Float, default=0.0)
    score_clarity = Column(Float, default=0.0)

    feedback_justification = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    missing_concepts = Column(Text, nullable=True)
    ideal_answer_summary = Column(Text, nullable=True)

    is_follow_up = Column(Boolean, default=False)
    parent_question_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    answered_at = Column(DateTime, nullable=True)
