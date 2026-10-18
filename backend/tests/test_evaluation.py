import pytest
from app.services.ai_service import AIService

@pytest.mark.asyncio
async def test_answer_evaluation_rubric():
    question = "How do you handle real-time synchronization with WebSockets and Redis?"
    good_answer = "We used WebSockets on the frontend with React hooks, connected to a Node.js backend. To handle multiple backend instances and prevent missed messages, we used Redis Pub/Sub as an event bus, ensuring state synchronization and fast sub-millisecond latency."
    
    weights = {
        "technical_correctness": 0.30,
        "relevance": 0.20,
        "depth_of_understanding": 0.20,
        "problem_solving": 0.20,
        "clarity_of_explanation": 0.10
    }
    
    evaluation = await AIService.evaluate_answer(
        question_text=question,
        candidate_answer=good_answer,
        category="Technical Architecture",
        job_role="Full Stack Developer",
        experience_level="Intermediate",
        language="en",
        expected_topics=["WebSockets", "Redis Pub/Sub", "Concurrency"],
        rubric_weights=weights
    )
    
    assert evaluation["score_overall"] >= 65.0
    assert evaluation["score_technical"] >= 60.0
    assert "Redis" in evaluation["strengths"] or "Demonstrated" in evaluation["strengths"]
    assert len(evaluation["feedback_justification"]) > 20

@pytest.mark.asyncio
async def test_follow_up_generation():
    parent_q = "Explain your caching layer."
    answer = "We used Redis cache to store frequent queries and decrease database pressure."
    
    follow_up = await AIService.generate_dynamic_follow_up(
        parent_question=parent_q,
        candidate_answer=answer,
        job_role="Software Engineer",
        language="en"
    )
    
    assert follow_up is not None
    assert follow_up["is_follow_up"] is True
    assert "invalidation" in follow_up["question_text"] or "cache" in follow_up["question_text"]
