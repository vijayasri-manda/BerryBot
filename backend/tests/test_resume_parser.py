import pytest
from app.services.resume_parser import ResumeParserService

SAMPLE_TEXT = """
Priya Sharma
Email: priya.sharma@example.com | Phone: +91 98451 23456 | Bengaluru, India

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL, Java
Frameworks: React, Node.js, FastAPI, Spring Boot, Tailwind CSS
Databases: PostgreSQL, MongoDB, Redis
Tools: Docker, Git, AWS, Postman, CI/CD

PROJECTS
HealthSync Telemedicine Portal | React, Node.js, PostgreSQL
• Developed a real-time doctor-patient consultation portal with WebSocket queue updates.
• Optimized PostgreSQL database queries using composite indexes reducing latency by 45%.

ShopSmart E-Commerce | React, FastAPI, Docker
• Built product catalog and checkout service containerized via Docker.

EDUCATION
Bachelor of Technology in Computer Science
JNTU College of Engineering, 2019 - 2023 | CGPA: 8.7 / 10
"""

def test_resume_parser_extraction():
    parsed = ResumeParserService.parse_resume(SAMPLE_TEXT, "Priya_Sharma_Resume.pdf")
    
    assert "priya.sharma@example.com" in parsed["candidate_email"]
    assert "98451" in parsed["candidate_phone"]
    
    skills = parsed["skills"]
    assert "Python" in skills["languages"]
    assert "React" in skills["frameworks"]
    assert "PostgreSQL" in skills["databases"]
    assert "Docker" in skills["tools_and_platforms"]
    
    projects = parsed["projects"]
    assert len(projects) >= 2
    assert any("HealthSync" in p["title"] for p in projects)
    
    topics = parsed["topics_to_explore"]
    assert len(topics) >= 3
    assert any("HealthSync" in t for t in topics)
