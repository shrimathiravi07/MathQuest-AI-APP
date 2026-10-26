import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.parametrize("grade,topic,diff", [
    (5, "fractions", "Easy"),
    (5, "decimals", "Medium"),
    (5, "ratios", "Hard"),
    (6, "shapes", "Easy"),
])
def test_generate_quiz_schema_and_options(grade, topic, diff):
    res = client.post("/api/quiz/generate", json={
        "grade": grade,
        "topic": topic,
        "difficulty": diff,
        "num_questions": 4
    })
    assert res.status_code == 200
    data = res.json()
    assert data["grade"] == grade
    assert data["topic"] == topic
    questions = data["questions"]
    assert len(questions) == 4

    for q in questions:
        assert q["grade"] == grade
        assert q["topic"] == topic
        assert len(q["options"]) == 4
        # Validate 4 unique option IDs
        ids = [opt["id"] for opt in q["options"]]
        assert set(ids) == {"A", "B", "C", "D"}
        # Correct option must refer to existing option
        assert q["correct_option_id"] in ["A", "B", "C", "D"]
        assert len(q["explanation"]) > 5

def test_verify_single_quiz_answer_correct():
    res = client.post("/api/grades/5/quiz/fractions/verify", json={
        "question_id": "g5-frac-1",
        "selected_index": 1  # 3/4 is option B (index 1)
    })
    assert res.status_code == 200
    data = res.json()
    assert data["correct"] is True
    assert "3/4" in data["correct_answer"]

def test_verify_single_quiz_answer_incorrect():
    res = client.post("/api/grades/5/quiz/fractions/verify", json={
        "question_id": "g5-frac-1",
        "selected_index": 0  # 2/8 is wrong
    })
    assert res.status_code == 200
    data = res.json()
    assert data["correct"] is False
