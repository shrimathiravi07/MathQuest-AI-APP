import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.parametrize("grade,topic", [
    (5, "fractions"),
    (5, "decimals"),
    (5, "ratios"),
    (5, "shapes"),
    (6, "fractions"),
    (6, "decimals"),
    (6, "ratios"),
    (6, "shapes"),
])
def test_explanation_all_required_topics(grade, topic):
    res = client.post("/api/explanation", json={
        "grade": grade,
        "topic": topic
    })
    assert res.status_code == 200
    data = res.json()
    assert data["grade"] == grade
    assert data["topic"] == topic
    assert len(data["definition"]) > 10
    assert len(data["why_useful"]) > 10
    assert len(data["step_by_step"]) >= 2
    assert "question" in data["practice_question"]
    assert len(data["practice_question"]["options"]) == 4
    assert len(data["common_mistakes"]) >= 1

def test_explanation_invalid_grade():
    res = client.post("/api/explanation", json={
        "grade": 4,
        "topic": "fractions"
    })
    assert res.status_code == 422  # Pydantic validation error

def test_explanation_invalid_topic():
    res = client.post("/api/explanation", json={
        "grade": 5,
        "topic": "quantum_physics"
    })
    assert res.status_code == 422
