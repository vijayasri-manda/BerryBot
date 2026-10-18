from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    raw_text = Column(Text, nullable=False)
    
    # Structured Extracted Fields
    candidate_name = Column(String(255), nullable=True)
    candidate_email = Column(String(255), nullable=True)
    candidate_phone = Column(String(100), nullable=True)
    summary = Column(Text, nullable=True)
    education_json = Column(Text, nullable=True)     # JSON string of degrees, institutions, years, grades
    skills_json = Column(Text, nullable=True)        # JSON string of technical skills, languages, tools
    projects_json = Column(Text, nullable=True)      # JSON string of projects: name, tech, role, details
    experience_json = Column(Text, nullable=True)    # JSON string of work experience / internships
    certifications_json = Column(Text, nullable=True)# JSON string of certifications
    topics_json = Column(Text, nullable=True)        # Topics to explore in interview
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="resumes")
