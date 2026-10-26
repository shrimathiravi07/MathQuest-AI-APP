import os
import json
from typing import Dict, Optional, Any
from pathlib import Path
from .models import StudentProfile

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
STUDENTS_FILE = DATA_DIR / "students.json"

DEFAULT_SEEDED_STUDENTS = {
    "leo5": {
        "username": "leo5",
        "display_name": "Leo the Fraction Finder",
        "password_key": "password123",
        "grade": 5,
        "avatar": "🦊",
        "stars": 45,
        "completed_lessons": ["fractions", "decimals"],
        "quiz_scores": {"fractions": 4, "decimals": 3, "ratios": 0, "shapes": 0},
        "badges": ["first_login", "star_collector", "pizza_master"]
    },
    "maya6": {
        "username": "maya6",
        "display_name": "Maya the Crystal Sage",
        "password_key": "password123",
        "grade": 6,
        "avatar": "🤖",
        "stars": 80,
        "completed_lessons": ["fractions", "decimals", "ratios", "shapes"],
        "quiz_scores": {"fractions": 4, "decimals": 4, "ratios": 4, "shapes": 3},
        "badges": ["first_login", "crystal_diviner", "ratio_pilot", "geometry_titan", "math_legend"]
    },
    "sam5": {
        "username": "sam5",
        "display_name": "Sam Explorer",
        "password_key": "password123",
        "grade": 5,
        "avatar": "🦊",
        "stars": 10,
        "completed_lessons": ["fractions"],
        "quiz_scores": {"fractions": 2, "decimals": 0, "ratios": 0, "shapes": 0},
        "badges": ["first_login"]
    }
}

class StudentStorage:
    def __init__(self, file_path: Path = STUDENTS_FILE):
        self.file_path = file_path
        self._ensure_storage()

    def _ensure_storage(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self._write_all(DEFAULT_SEEDED_STUDENTS)

    def _read_all(self) -> Dict[str, Dict[str, Any]]:
        try:
            if self.file_path.exists():
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return dict(DEFAULT_SEEDED_STUDENTS)

    def _write_all(self, data: Dict[str, Dict[str, Any]]):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_student(self, username: str) -> Optional[Dict[str, Any]]:
        uname = (username or "").strip().lower()
        students = self._read_all()
        return students.get(uname)

    def get_student_profile(self, username: str) -> Optional[StudentProfile]:
        data = self.get_student(username)
        if not data:
            return None
        return StudentProfile(
            username=data["username"],
            display_name=data.get("display_name", data["username"]),
            grade=data["grade"],
            avatar=data.get("avatar", "🦊"),
            stars=data.get("stars", 0),
            completed_lessons=data.get("completed_lessons", []),
            quiz_scores=data.get("quiz_scores", {"fractions": 0, "decimals": 0, "ratios": 0, "shapes": 0}),
            badges=data.get("badges", ["first_login"])
        )

    def create_student(self, username: str, password: str, grade: int, display_name: Optional[str] = None) -> StudentProfile:
        uname = username.strip().lower()
        students = self._read_all()
        if uname in students:
            raise ValueError(f"Student '{uname}' already exists.")

        new_student = {
            "username": uname,
            "display_name": (display_name or uname).strip(),
            "password_key": password,
            "grade": int(grade),
            "avatar": "🦊" if int(grade) == 5 else "🤖",
            "stars": 1,
            "completed_lessons": [],
            "quiz_scores": {"fractions": 0, "decimals": 0, "ratios": 0, "shapes": 0},
            "badges": ["first_login"]
        }
        students[uname] = new_student
        self._write_all(students)
        return self.get_student_profile(uname)

    def verify_student(self, username: str, password: str, grade: int) -> Optional[StudentProfile]:
        uname = username.strip().lower()
        student = self.get_student(uname)
        if not student:
            return None
        if student.get("password_key") != password:
            return None
        if int(student.get("grade")) != int(grade):
            raise PermissionError(
                f"Grade Mismatch! Student '{student['username']}' is assigned to Grade {student['grade']}. "
                f"Grade {grade} is locked for this account."
            )
        return self.get_student_profile(uname)

    def complete_lesson(self, username: str, grade: int, topic: str) -> tuple[StudentProfile, bool]:
        uname = username.strip().lower()
        students = self._read_all()
        student = students.get(uname)
        if not student:
            raise ValueError(f"Student '{uname}' not found.")

        if int(student["grade"]) != int(grade):
            raise PermissionError(f"Access Denied: Grade {student['grade']} student cannot access Grade {grade} lessons.")

        awarded = False
        completed = student.setdefault("completed_lessons", [])
        if topic not in completed:
            completed.append(topic)
            student["stars"] = student.get("stars", 0) + 1
            awarded = True

        badges = student.setdefault("badges", [])
        if len(completed) >= 2 and "island_explorer" not in badges:
            badges.append("island_explorer")

        students[uname] = student
        self._write_all(students)
        return self.get_student_profile(uname), awarded

    def record_quiz_score(self, username: str, grade: int, topic: str, score: int, stars_to_award: int = 1) -> StudentProfile:
        uname = username.strip().lower()
        students = self._read_all()
        student = students.get(uname)
        if not student:
            raise ValueError(f"Student '{uname}' not found.")

        scores = student.setdefault("quiz_scores", {"fractions": 0, "decimals": 0, "ratios": 0, "shapes": 0})
        prev_score = scores.get(topic, 0)
        scores[topic] = max(prev_score, score)

        if stars_to_award > 0:
            student["stars"] = student.get("stars", 0) + stars_to_award

        badges = student.setdefault("badges", [])
        if student["stars"] >= 8 and "star_collector" not in badges:
            badges.append("star_collector")
        if score >= 4 and f"{topic}_master" not in badges:
            badges.append(f"{topic}_master")

        students[uname] = student
        self._write_all(students)
        return self.get_student_profile(uname)

    def update_avatar(self, username: str, avatar_emoji: str) -> StudentProfile:
        uname = username.strip().lower()
        students = self._read_all()
        student = students.get(uname)
        if not student:
            raise ValueError(f"Student '{uname}' not found.")
        student["avatar"] = avatar_emoji
        students[uname] = student
        self._write_all(students)
        return self.get_student_profile(uname)

# Global storage instance
storage = StudentStorage()
