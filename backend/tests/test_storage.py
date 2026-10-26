import pytest
from app.storage import StudentStorage
from pathlib import Path
import tempfile
import json

def test_storage_initialization():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_file = Path(tmpdir) / "students.json"
        storage = StudentStorage(file_path=tmp_file)
        assert tmp_file.exists()
        # Verify pre-seeded accounts exist
        assert storage.get_student("leo5") is not None
        assert storage.get_student("maya6") is not None

def test_storage_create_and_retrieve_student():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_file = Path(tmpdir) / "students.json"
        storage = StudentStorage(file_path=tmp_file)
        profile = storage.create_student("newkid5", "pass123", 5, "New Kid")
        assert profile.username == "newkid5"
        assert profile.grade == 5

        # Check retrieval
        retrieved = storage.get_student_profile("newkid5")
        assert retrieved is not None
        assert retrieved.display_name == "New Kid"

def test_storage_progress_and_badge_award():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_file = Path(tmpdir) / "students.json"
        storage = StudentStorage(file_path=tmp_file)
        storage.create_student("progkid5", "pass123", 5)

        # Complete lesson 1
        prof1, awarded1 = storage.complete_lesson("progkid5", 5, "fractions")
        assert awarded1 is True
        assert "fractions" in prof1.completed_lessons

        # Complete lesson 2 -> triggers island_explorer badge
        prof2, awarded2 = storage.complete_lesson("progkid5", 5, "decimals")
        assert awarded2 is True
        assert "island_explorer" in prof2.badges
