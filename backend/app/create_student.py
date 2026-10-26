"""CLI Utility to create new student accounts in MathQuest AI."""
import sys
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.storage import storage

def main():
    if len(sys.argv) < 4:
        print("Usage: python create_student.py <username> <password> <grade> [display_name]")
        print("Example: python create_student.py alex5 secret123 5 'Alex Fraction Star'")
        sys.exit(1)

    username = sys.argv[1]
    password = sys.argv[2]
    grade = int(sys.argv[3])
    display_name = sys.argv[4] if len(sys.argv) > 4 else username

    try:
        profile = storage.create_student(username, password, grade, display_name)
        print(f"Successfully created student: {profile.username} (Grade {profile.grade}) - Display: '{profile.display_name}'")
    except Exception as e:
        print(f"Error creating student: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
