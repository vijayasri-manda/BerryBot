import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ai_provider" in data
    assert "en" in data["supported_languages"]
    assert "te" in data["supported_languages"]

def test_login_candidate(client):
    response = client.post("/api/auth/login", json={
        "email": "candidate@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "candidate@example.com"
    assert data["user"]["role"] == "candidate"

def test_load_sample_resume(client):
    # Login
    login_resp = client.post("/api/auth/login", json={
        "email": "candidate@example.com",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Load sample fullstack resume
    resp = client.get("/api/resumes/sample/fullstack", headers=headers)
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["candidate_name"] == "Priya Sharma"
    assert "React" in res_data["parsed_data"]["skills"]["frameworks"]

def test_create_interview_and_answer(client):
    login_resp = client.post("/api/auth/login", json={
        "email": "candidate@example.com",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create interview
    create_payload = {
        "job_role": "Full Stack Developer",
        "experience_level": "Fresher",
        "interview_type": "Technical",
        "language": "en",
        "duration_minutes": 10,
        "total_questions": 3
    }
    create_resp = client.post("/api/interviews", json=create_payload, headers=headers)
    assert create_resp.status_code == 200
    interview = create_resp.json()
    interview_id = interview["id"]
    policy = client.get('/api/interviews/policy', headers=headers).json()
    assert len(interview["questions"]) == policy['question_count']

    # Start interview
    start_resp = client.post(f"/api/interviews/{interview_id}/start", headers=headers)
    assert start_resp.status_code == 200

    # Submit answer
    answer_payload = {
        "answer_text": "I used React custom hooks for encapsulated business logic, and designed REST APIs with Express and PostgreSQL using indexed queries.",
        "input_type": "voice",
        "audio_duration_seconds": 22.5
    }
    ans_resp = client.post(f"/api/interviews/{interview_id}/answer", json=answer_payload, headers=headers)
    assert ans_resp.status_code == 200
    eval_data = ans_resp.json()
    assert eval_data["score_overall"] > 40.0
    assert eval_data["feedback_justification"] != ""


def test_hr_controls_question_count(client):
    def login(email, password):
        response = client.post('/api/auth/login', json={'email': email, 'password': password})
        assert response.status_code == 200
        return {'Authorization': 'Bearer ' + response.json()['access_token']}

    candidate = login('candidate@example.com', 'password123')
    recruiter = login('recruiter@example.com', 'password123')
    admin = login('admin@example.com', 'admin123')
    original = client.get('/api/interviews/policy', headers=candidate).json()
    payload = {'job_role': 'Full Stack Developer', 'total_questions': 3}
    existing = client.post('/api/interviews', headers=candidate, json=payload).json()
    try:
        assert client.get('/api/interviews/policy').status_code == 401
        assert client.put('/api/recruiter/interview-policy', headers=candidate, json={'question_count': 7}).status_code == 403
        for invalid in [2, 11, 4.5, True]:
            assert client.put('/api/recruiter/interview-policy', headers=recruiter, json={'question_count': invalid}).status_code == 422
        response = client.put('/api/recruiter/interview-policy', headers=recruiter, json={'question_count': 7})
        assert response.status_code == 200
        assert client.get('/api/interviews/policy', headers=candidate).json()['question_count'] == 7
        for request_count in [3, 10, None]:
            request = dict(payload)
            if request_count is None:
                request.pop('total_questions')
            else:
                request['total_questions'] = request_count
            response = client.post('/api/interviews', headers=candidate, json=request)
            assert response.status_code == 200
            assert response.json()['total_questions'] == 7
            assert len(response.json()['questions']) == 7
        assert client.get(f"/api/interviews/{existing['id']}", headers=candidate).json()['total_questions'] == existing['total_questions']
        assert client.post('/api/interviews', headers=recruiter, json=payload).status_code == 403
        logs = client.get('/api/recruiter/audit-logs', headers=recruiter).json()
        assert any(log['action'] == 'INTERVIEW_POLICY_UPDATED' and log['new_value'] == '7' for log in logs)
        assert client.put('/api/recruiter/interview-policy', headers=admin, json={'question_count': 4}).status_code == 200
    finally:
        client.put('/api/recruiter/interview-policy', headers=recruiter, json=original)
