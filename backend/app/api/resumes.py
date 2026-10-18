import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeOut, ParsedResumeData, ResumeUpdateRequest
from app.services.auth_service import get_current_user
from app.services.resume_parser import ResumeParserService
from app.sample_data.sample_resumes import SAMPLE_RESUMES

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only PDF (.pdf) and Word (.docx) documents are accepted."
        )

    # 2. Read bytes and check size
    content = await file.read()
    file_size = len(content)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 3. Extract text
    if ext == ".pdf":
        raw_text = ResumeParserService.extract_text_from_pdf(content)
    else:
        raw_text = ResumeParserService.extract_text_from_docx(content)

    if not raw_text or len(raw_text.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable text from the uploaded resume. Please verify the document is not an image-only scan."
        )

    # 4. Parse structured content
    parsed = ResumeParserService.parse_resume(raw_text, file.filename)

    # 5. Save file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_filename = f"user_{current_user.id}_{int(file_size)}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, saved_filename)
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception:
        file_path = f"memory://{saved_filename}"

    # 6. Save in DB
    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        raw_text=raw_text,
        candidate_name=parsed.get("candidate_name") or current_user.full_name,
        candidate_email=parsed.get("candidate_email") or current_user.email,
        candidate_phone=parsed.get("candidate_phone"),
        summary=parsed.get("summary"),
        skills_json=json.dumps(parsed.get("skills", {})),
        projects_json=json.dumps(parsed.get("projects", [])),
        experience_json=json.dumps(parsed.get("experience", [])),
        education_json=json.dumps(parsed.get("education", [])),
        certifications_json=json.dumps(parsed.get("certifications", [])),
        topics_json=json.dumps(parsed.get("topics_to_explore", []))
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return _format_resume_response(resume)

@router.get("/sample/{sample_key}")
def load_sample_resume(
    sample_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if sample_key not in SAMPLE_RESUMES:
        sample_key = "fullstack"
    
    sample = SAMPLE_RESUMES[sample_key]
    
    resume = Resume(
        user_id=current_user.id,
        filename=f"Sample_{sample_key.title()}_Resume.pdf",
        file_path=f"sample://{sample_key}.pdf",
        file_size=1024 * 120,
        raw_text=f"{sample['candidate_name']}\n{sample['summary']}\n{json.dumps(sample['skills'])}\n{json.dumps(sample['projects'])}",
        candidate_name=sample["candidate_name"],
        candidate_email=sample["candidate_email"],
        candidate_phone=sample["candidate_phone"],
        summary=sample["summary"],
        skills_json=json.dumps(sample["skills"]),
        projects_json=json.dumps(sample["projects"]),
        experience_json=json.dumps(sample["experience"]),
        education_json=json.dumps(sample["education"]),
        certifications_json=json.dumps(sample["certifications"]),
        topics_json=json.dumps(sample["topics_to_explore"])
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return _format_resume_response(resume)

@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != current_user.id and current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")
    return _format_resume_response(resume)

@router.put("/{resume_id}")
def update_resume(
    resume_id: int,
    update_data: ResumeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != current_user.id and current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this resume")

    if update_data.candidate_name:
        resume.candidate_name = update_data.candidate_name
    if update_data.summary:
        resume.summary = update_data.summary
    if update_data.parsed_data:
        p = update_data.parsed_data
        resume.skills_json = json.dumps(p.skills.model_dump())
        resume.projects_json = json.dumps([prj.model_dump() for prj in p.projects])
        resume.experience_json = json.dumps([exp.model_dump() for exp in p.experience])
        resume.education_json = json.dumps([edu.model_dump() for edu in p.education])
        resume.certifications_json = json.dumps(p.certifications)
        resume.topics_json = json.dumps(p.topics_to_explore)

    db.commit()
    db.refresh(resume)
    return _format_resume_response(resume)

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != current_user.id and current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this resume")

    # Remove file if on disk
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception:
            pass

    db.delete(resume)
    db.commit()
    return {"message": "Resume and associated parsing data permanently deleted"}

def _format_resume_response(resume: Resume) -> dict:
    return {
        "id": resume.id,
        "user_id": resume.user_id,
        "filename": resume.filename,
        "file_size": resume.file_size,
        "candidate_name": resume.candidate_name,
        "candidate_email": resume.candidate_email,
        "candidate_phone": resume.candidate_phone,
        "summary": resume.summary,
        "parsed_data": {
            "candidate_name": resume.candidate_name,
            "candidate_email": resume.candidate_email,
            "candidate_phone": resume.candidate_phone,
            "summary": resume.summary,
            "skills": json.loads(resume.skills_json) if resume.skills_json else {},
            "projects": json.loads(resume.projects_json) if resume.projects_json else [],
            "experience": json.loads(resume.experience_json) if resume.experience_json else [],
            "education": json.loads(resume.education_json) if resume.education_json else [],
            "certifications": json.loads(resume.certifications_json) if resume.certifications_json else [],
            "topics_to_explore": json.loads(resume.topics_json) if resume.topics_json else []
        },
        "created_at": resume.created_at
    }
