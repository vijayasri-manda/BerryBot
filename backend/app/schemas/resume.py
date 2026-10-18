from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ProjectItem(BaseModel):
    title: str
    technologies: List[str] = []
    description: str = ""
    key_highlights: List[str] = []

class EducationItem(BaseModel):
    degree: str
    institution: str
    year: str = ""
    grade_or_gpa: str = ""

class ExperienceItem(BaseModel):
    company: str
    role: str
    duration: str = ""
    responsibilities: List[str] = []

class SkillsCategorized(BaseModel):
    languages: List[str] = []
    frameworks: List[str] = []
    databases: List[str] = []
    tools_and_platforms: List[str] = []
    other: List[str] = []

class ParsedResumeData(BaseModel):
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    summary: Optional[str] = None
    skills: SkillsCategorized = SkillsCategorized()
    projects: List[ProjectItem] = []
    experience: List[ExperienceItem] = []
    education: List[EducationItem] = []
    certifications: List[str] = []
    topics_to_explore: List[str] = []

class ResumeOut(BaseModel):
    id: int
    user_id: int
    filename: str
    file_size: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    summary: Optional[str] = None
    parsed_data: ParsedResumeData
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeUpdateRequest(BaseModel):
    candidate_name: Optional[str] = None
    summary: Optional[str] = None
    parsed_data: Optional[ParsedResumeData] = None
