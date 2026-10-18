from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=True, index=True)
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False) # e.g. "SCORE_OVERRIDE", "RUBRIC_UPDATE", "STATUS_CHANGE"
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class RubricConfig(Base):
    __tablename__ = "rubric_configs"

    id = Column(Integer, primary_key=True, index=True)
    role_key = Column(String(100), default="default", unique=True) # e.g. "default", "Software Development Engineer"
    
    # HR / Recruiter Interview Policies
    question_count = Column(Integer, default=5)
    duration_minutes = Column(Integer, default=15)

    # Competency Rubric Weights
    technical_weight = Column(Float, default=0.30)
    relevance_weight = Column(Float, default=0.20)
    depth_weight = Column(Float, default=0.20)
    problem_solving_weight = Column(Float, default=0.20)
    clarity_weight = Column(Float, default=0.10)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
