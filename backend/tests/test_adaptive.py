import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_adaptive_difficulty_increase_after_3_correct():
    """3 consecutive correct answers should increase difficulty."""
    res = client.post("/api/quiz/submit", json={
        "grade": 5,
        "topic": "fractions",
        "current_difficulty": "Easy",
        "consecutive_correct": 2,  # already had 2, adding 1 more correct gives 3!
        "consecutive_incorrect": 0,
        "answers": [
            {"question_id": "g5-frac-1", "selected_option_id": "B"}  # Correct option B
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["adaptive_transition"] == "increased"
    assert data["new_difficulty"] == "Medium"

def test_adaptive_difficulty_decrease_after_2_incorrect():
    """2 consecutive incorrect answers should decrease difficulty."""
    res = client.post("/api/quiz/submit", json={
        "grade": 5,
        "topic": "fractions",
        "current_difficulty": "Medium",
        "consecutive_correct": 0,
        "consecutive_incorrect": 1,  # already had 1, adding 1 more incorrect gives 2!
        "answers": [
            {"question_id": "g5-frac-1", "selected_option_id": "A"}  # Wrong option
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["adaptive_transition"] == "decreased"
    assert data["new_difficulty"] == "Easy"

def test_adaptive_difficulty_easy_lower_boundary():
    """Cannot decrease below Easy."""
    res = client.post("/api/quiz/submit", json={
        "grade": 5,
        "topic": "fractions",
        "current_difficulty": "Easy",
        "consecutive_correct": 0,
        "consecutive_incorrect": 1,
        "answers": [
            {"question_id": "g5-frac-1", "selected_option_id": "A"}  # Wrong option
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["new_difficulty"] == "Easy"  # Stays at Easy

def test_adaptive_difficulty_hard_upper_boundary():
    """Cannot increase above Hard."""
    res = client.post("/api/quiz/submit", json={
        "grade": 5,
        "topic": "fractions",
        "current_difficulty": "Hard",
        "consecutive_correct": 2,
        "consecutive_incorrect": 0,
        "answers": [
            {"question_id": "g5-frac-1", "selected_option_id": "B"}  # Correct option
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["new_difficulty"] == "Hard"  # Stays at Hard

def test_duplicate_answer_prevention():
    """Prevent repeated submission of same question in same payload."""
    res = client.post("/api/quiz/submit", json={
        "grade": 5,
        "topic": "fractions",
        "current_difficulty": "Easy",
        "consecutive_correct": 0,
        "consecutive_incorrect": 0,
        "answers": [
            {"question_id": "g5-frac-1", "selected_option_id": "B"},
            {"question_id": "g5-frac-1", "selected_option_id": "B"}  # Duplicate question submission
        ]
    })
    assert res.status_code == 200
    data = res.json()
    # Score should only count unique question once
    assert data["score"] == 1
    assert data["total"] == 2
