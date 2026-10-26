import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.storage import storage

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["app"] == "MathQuest AI"

def test_login_success_seeded_student():
    res = client.post("/api/auth/login", json={
        "username": "leo5",
        "password": "password123",
        "grade": 5
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["student"]["username"] == "leo5"
    assert data["student"]["grade"] == 5

def test_login_grade_mismatch_locked():
    # leo5 is assigned to Grade 5, trying to log into Grade 6 must be 403 Forbidden
    res = client.post("/api/auth/login", json={
        "username": "leo5",
        "password": "password123",
        "grade": 6
    })
    assert res.status_code == 403
    assert "Grade Mismatch" in res.json()["detail"]

def test_login_wrong_password():
    res = client.post("/api/auth/login", json={
        "username": "leo5",
        "password": "wrongpassword",
        "grade": 5
    })
    assert res.status_code == 401

def test_register_new_student():
    import uuid
    new_user = f"tester_{uuid.uuid4().hex[:6]}"
    res = client.post("/api/auth/register", json={
        "username": new_user,
        "password": "mypassword123",
        "grade": 5,
        "display_name": "Test Explorer"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["student"]["username"] == new_user
    assert data["student"]["grade"] == 5
    assert data["student"]["stars"] >= 1

def test_register_duplicate_username_fails():
    res = client.post("/api/auth/register", json={
        "username": "leo5",
        "password": "anypassword",
        "grade": 5
    })
    assert res.status_code == 400
