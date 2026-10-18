import os
import json
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.resume import Resume
from app.models.interview import InterviewSession, InterviewQuestion
from app.models.audit import RubricConfig
from app.services.auth_service import get_password_hash
from app.sample_data.sample_resumes import SAMPLE_RESUMES
from app.api.auth import router as auth_router
from app.api.resumes import router as resumes_router
from app.api.interviews import router as interviews_router
from app.api.recruiter import router as recruiter_router
from app.api.health import router as health_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed Data
    Base.metadata.create_all(bind=engine)
    init_db_records()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent, Multilingual, Resume-Based Interview Platform inspired by HCL Berri Bot",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(resumes_router, prefix=settings.API_V1_STR)
app.include_router(interviews_router, prefix=settings.API_V1_STR)
app.include_router(recruiter_router, prefix=settings.API_V1_STR)

def init_db_records():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # Seed users
        cand_user = db.query(User).filter(User.email == "candidate@example.com").first()
        if not cand_user:
            cand_user = User(
                email="candidate@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="Priya Sharma",
                role="candidate"
            )
            db.add(cand_user)

        recruiter_user = db.query(User).filter(User.email == "recruiter@example.com").first()
        if not recruiter_user:
            recruiter_user = User(
                email="recruiter@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="Alex Morgan",
                role="recruiter"
            )
            db.add(recruiter_user)

        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                role="admin"
            )
            db.add(admin_user)
        
        db.commit()
        db.refresh(cand_user)

        # Seed default rubric
        rubric = db.query(RubricConfig).filter(RubricConfig.role_key == "default").first()
        if not rubric:
            db.add(RubricConfig(
                role_key="default",
                technical_weight=0.30,
                relevance_weight=0.20,
                depth_weight=0.20,
                problem_solving_weight=0.20,
                clarity_weight=0.10
            ))
            db.commit()

        # Seed sample resume for candidate if none
        existing_res = db.query(Resume).filter(Resume.user_id == cand_user.id).first()
        if not existing_res:
            sample = SAMPLE_RESUMES["fullstack"]
            sample_res = Resume(
                user_id=cand_user.id,
                filename="Priya_Sharma_FullStack_Resume.pdf",
                file_path="sample://fullstack.pdf",
                file_size=1024 * 145,
                raw_text=f"{sample['candidate_name']}\n{sample['summary']}\n{json.dumps(sample['skills'])}",
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
            db.add(sample_res)
            db.commit()
            db.refresh(sample_res)

            # Seed a completed sample interview session
            session = InterviewSession(
                user_id=cand_user.id,
                resume_id=sample_res.id,
                job_role="Full Stack Developer",
                experience_level="Intermediate",
                interview_type="Mixed",
                language="en",
                duration_minutes=20,
                total_questions=4,
                current_question_index=4,
                status="completed",
                overall_score=86.5,
                technical_score=88.0,
                relevance_score=85.0,
                depth_score=84.0,
                problem_solving_score=89.0,
                clarity_score=86.0,
                resume_match_score=91.0,
                recommendation="Strong Match",
                recommendation_justification="Candidate demonstrated comprehensive mastery for Full Stack Developer profile, achieving an aggregate score of 86.5%. Responses showed high technical precision, sound architectural problem-solving, and clear articulation of design trade-offs.",
                strengths_summary="Demonstrated robust proficiency in React lifecycle, WebSocket state syncing, and PostgreSQL query index optimization.",
                knowledge_gaps_summary="Further exploration of distributed lock contention algorithms and Redis cluster failover patterns.",
                learning_recommendations_json=json.dumps([
                    {
                        "topic": "Distributed Locking & Redis Redlock",
                        "description": "Study consensus mechanisms and safety bounds in distributed lock managers.",
                        "resources": ["Redis Distributed Locks Documentation", "Martin Kleppmann Analysis"],
                        "priority": "High"
                    },
                    {
                        "topic": "Advanced Database Query Profiling",
                        "description": "Learn EXPLAIN ANALYZE execution plan breakdown and buffer cache hit rates.",
                        "resources": ["Use The Index, Luke!", "PostgreSQL Official Documentation"],
                        "priority": "Medium"
                    }
                ]),
                started_at=datetime.utcnow() - timedelta(hours=2),
                completed_at=datetime.utcnow() - timedelta(hours=1, minutes=40)
            )
            db.add(session)
            db.commit()
            db.refresh(session)

            # Add questions for this session
            sample_questions = [
                {
                    "order_index": 1,
                    "category": "Resume Project Deep Dive",
                    "question_text": "In your project 'HealthSync' built with React and Node.js, can you explain the architecture and how you handled real-time queue synchronization?",
                    "candidate_answer": "In HealthSync, we designed an event-driven architecture using WebSockets backed by Redis Pub/Sub. When patients join the queue, their status is pushed to a Redis Sorted Set keyed by timestamp, and doctors pull updates with low latency.",
                    "score_overall": 89.0,
                    "score_technical": 90.0,
                    "score_relevance": 92.0,
                    "score_depth": 87.0,
                    "score_problem_solving": 88.0,
                    "score_clarity": 88.0,
                    "feedback_justification": "Clear, technically accurate explanation of Redis Sorted Sets and WebSocket state synchronization.",
                    "strengths": "Demonstrated sound understanding of real-time messaging, latency reduction, and queue primitives.",
                    "missing_concepts": "Could elaborate on reconnect reconciliation when a client drops connection temporarily.",
                    "ideal_answer_summary": "Architecture highlights Redis Pub/Sub, heartbeat ack mechanisms, and reconciliation after transient network partition."
                },
                {
                    "order_index": 2,
                    "category": "Core Programming & Concurrency",
                    "question_text": "How does the Node.js event loop handle asynchronous I/O versus CPU-intensive tasks, and how do you prevent thread starvation?",
                    "candidate_answer": "Node.js runs single-threaded for JavaScript execution on the libuv event loop. Async I/O tasks are offloaded to OS kernel polling or the libuv worker thread pool. For heavy CPU tasks, we offload them to Worker Threads or external queue workers to avoid blocking the loop.",
                    "score_overall": 87.0,
                    "score_technical": 89.0,
                    "score_relevance": 88.0,
                    "score_depth": 85.0,
                    "score_problem_solving": 86.0,
                    "score_clarity": 87.0,
                    "feedback_justification": "Good differentiation between libuv thread pool and the JS call stack with worker thread offloading.",
                    "strengths": "Accurately identified worker threads and event loop blocking hazards.",
                    "missing_concepts": "Mentioning UV_THREADPOOL_SIZE environment variable tuning.",
                    "ideal_answer_summary": "Explain event loop phases (timers, poll, check), thread pool sizing, and worker threads."
                },
                {
                    "order_index": 3,
                    "category": "Database & High Performance",
                    "question_text": "When scaling PostgreSQL queries under high concurrency, how do you prevent N+1 query bottlenecks and configure connection pools?",
                    "candidate_answer": "We prevent N+1 queries by using explicit JOIN FETCH or batch loading with DataLoader. For connection pooling, we run PgBouncer in transaction pooling mode to handle thousands of incoming client connections efficiently.",
                    "score_overall": 88.0,
                    "score_technical": 91.0,
                    "score_relevance": 88.0,
                    "score_depth": 86.0,
                    "score_problem_solving": 89.0,
                    "score_clarity": 86.0,
                    "feedback_justification": "Excellent mention of PgBouncer transaction pooling and DataLoader batch loading.",
                    "strengths": "Practical familiarity with PgBouncer and SQL query planning.",
                    "missing_concepts": "Prepared statements caveats with transaction pooling mode.",
                    "ideal_answer_summary": "Use JOIN / batch loading, configure PgBouncer or HikariCP, and monitor slow query logs."
                },
                {
                    "order_index": 4,
                    "category": "Engineering Collaboration & Behavioral",
                    "question_text": "Tell me about a situation where a production incident occurred or you had a technical disagreement with a team member. How did you resolve it?",
                    "candidate_answer": "During a sprint, we had a debate between GraphQL and REST for our mobile clients. I created a benchmark POC measuring payload size and battery consumption over 3G networks. The data clearly showed GraphQL reduced over-fetching by 60%, aligning the team collaboratively.",
                    "score_overall": 82.0,
                    "score_technical": 82.0,
                    "score_relevance": 85.0,
                    "score_depth": 80.0,
                    "score_problem_solving": 84.0,
                    "score_clarity": 83.0,
                    "feedback_justification": "Strong evidence of data-driven decision making and pragmatic prototype evaluation.",
                    "strengths": "Used objective empirical metrics instead of subjective arguments to reach consensus.",
                    "missing_concepts": "Could describe the post-incident retrospective or documentation for future onboarding.",
                    "ideal_answer_summary": "Use STAR method: describe situation, task, empirical evaluation, consensus building, and lessons learned."
                }
            ]

            for q_data in sample_questions:
                q = InterviewQuestion(
                    session_id=session.id,
                    order_index=q_data["order_index"],
                    category=q_data["category"],
                    question_text=q_data["question_text"],
                    question_text_en=q_data["question_text"],
                    audio_caption=q_data["question_text"],
                    candidate_answer=q_data["candidate_answer"],
                    answer_input_type="voice",
                    audio_duration_seconds=38.5,
                    score_overall=q_data["score_overall"],
                    score_technical=q_data["score_technical"],
                    score_relevance=q_data["score_relevance"],
                    score_depth=q_data["score_depth"],
                    score_problem_solving=q_data["score_problem_solving"],
                    score_clarity=q_data["score_clarity"],
                    feedback_justification=q_data["feedback_justification"],
                    strengths=q_data["strengths"],
                    missing_concepts=q_data["missing_concepts"],
                    ideal_answer_summary=q_data["ideal_answer_summary"],
                    answered_at=datetime.utcnow() - timedelta(hours=1, minutes=45)
                )
                db.add(q)
            db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "message": "Berri Bot AI Interview Platform API is running",
        "docs": "/docs",
        "health": "/api/health"
    }
