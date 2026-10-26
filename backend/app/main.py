import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .models import (
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    StudentProfile,
    MessageResponse,
    ExplanationRequest,
    ExplanationResponse,
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    SingleAnswerVerifyRequest,
    SingleAnswerVerifyResponse,
    LessonCompleteResponse,
    HealthResponse,
    GeminiDiagnosticResponse
)
from .storage import storage
from .gemini_service import gemini_service, FALLBACK_QUIZ_POOLS

app = FastAPI(
    title="MathQuest AI API",
    description="3D Gamified Mathematics Learning Platform for Grade 5 & Grade 6",
    version="1.0.0"
)

# -----------------------------------------------------------------------------
# CORS MIDDLEWARE
# -----------------------------------------------------------------------------
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
if not origins or "*" in origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track server start time
START_TIME = time.time()

# -----------------------------------------------------------------------------
# AUTHENTICATION DEPENDENCY
# -----------------------------------------------------------------------------
def get_current_username(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Please log in first."
        )
    token = authorization.replace("Bearer ", "").strip()
    # Format: mq_tok_<random>_<grade> or student username embedded
    parts = token.split("_")
    # In lightweight token system, if token has format mq_tok_... or matches username
    # Find student by checking active token records or first matching student
    # If student username was stored in custom token:
    if len(parts) >= 3:
        # Standard token
        pass
    # For robust verification, allow token or username header
    return token

# -----------------------------------------------------------------------------
# HEALTH & DIAGNOSTICS ENDPOINTS
# -----------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
async def get_health():
    """Application health endpoint."""
    return HealthResponse(
        status="ok",
        app="MathQuest AI",
        version="1.0.0",
        storage_status="connected",
        gemini_configured=gemini_service.is_configured(),
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@app.get("/api/diagnostics/gemini", response_model=GeminiDiagnosticResponse)
async def get_gemini_diagnostics():
    """Non-destructive diagnostic test for Google Gemini API configuration."""
    return gemini_service.check_diagnostics()

# -----------------------------------------------------------------------------
# AUTHENTICATION ENDPOINTS
# -----------------------------------------------------------------------------
@app.post("/api/auth/register", response_model=AuthResponse)
@app.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Register a new student account with strict grade assignment."""
    try:
        profile = storage.create_student(
            username=req.username,
            password=req.password,
            grade=req.grade,
            display_name=req.display_name
        )
        token = f"mq_tok_{req.username}_{int(time.time())}_{req.grade}"
        return AuthResponse(token=token, student=profile)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create student.")

@app.post("/api/auth/login", response_model=AuthResponse)
@app.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate a student and enforce grade lock protection."""
    try:
        profile = storage.verify_student(
            username=req.username,
            password=req.password,
            grade=req.grade
        )
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Hmm, that username or password didn't match! Check your spelling or use a demo student."
            )
        token = f"mq_tok_{req.username}_{int(time.time())}_{req.grade}"
        return AuthResponse(token=token, student=profile)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@app.post("/api/auth/logout", response_model=MessageResponse)
@app.post("/auth/logout", response_model=MessageResponse)
async def logout():
    """Safely log out current student session."""
    return MessageResponse(message="Logged out safely!")

@app.get("/api/auth/profile", response_model=StudentProfile)
async def get_profile(username: str):
    """Retrieve student profile by username."""
    profile = storage.get_student_profile(username)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    return profile

# -----------------------------------------------------------------------------
# GRADE-RESTRICTED LESSON & QUIZ VERIFICATION ENDPOINTS
# -----------------------------------------------------------------------------
@app.post("/api/grades/{grade}/lessons/{topic}/complete", response_model=LessonCompleteResponse)
@app.post("/grades/{grade}/lessons/{topic}/complete", response_model=LessonCompleteResponse)
async def complete_lesson(grade: int, topic: str, username: Optional[str] = None):
    """Mark a lesson complete and award student star and exploration badge."""
    uname = username or "leo5" if grade == 5 else "maya6"
    try:
        profile, awarded = storage.complete_lesson(uname, grade, topic)
        return LessonCompleteResponse(student=profile, awarded_star=awarded)
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

@app.post("/api/grades/{grade}/quiz/{topic}/verify", response_model=SingleAnswerVerifyResponse)
@app.post("/grades/{grade}/quiz/{topic}/verify", response_model=SingleAnswerVerifyResponse)
async def verify_single_quiz_answer(grade: int, topic: str, req: SingleAnswerVerifyRequest, username: Optional[str] = None):
    """Server-side deterministic quiz answer verification."""
    topic_key = "shapes" if topic in ["shapes", "geometry"] else topic.lower()
    pool = FALLBACK_QUIZ_POOLS.get(grade, {}).get(topic_key, [])
    question = next((q for q in pool if q["question_id"] == req.question_id), None)

    if not question:
        # Fallback to first question in pool if ID generated dynamically
        question = pool[0] if pool else None

    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz question not found.")

    correct_id = question["correct_option_id"]
    correct_idx = next((i for i, opt in enumerate(question["options"]) if opt["id"] == correct_id), 0)
    is_correct = (req.selected_index == correct_idx)

    uname = username or ("leo5" if grade == 5 else "maya6")
    profile = storage.get_student_profile(uname)
    if is_correct and profile:
        profile = storage.record_quiz_score(uname, grade, topic_key, score=1, stars_to_award=1)

    return SingleAnswerVerifyResponse(
        correct=is_correct,
        feedback="Awesome! You earned 1 star!" if is_correct else "Nice try! Let's learn together.",
        correct_index=correct_idx,
        correct_answer=question["options"][correct_idx]["text"],
        explanation=question["explanation"],
        student=profile
    )

# -----------------------------------------------------------------------------
# GEMINI EXPLANATION & QUIZ GENERATION
# -----------------------------------------------------------------------------
@app.post("/api/explanation", response_model=ExplanationResponse)
async def generate_explanation(req: ExplanationRequest):
    """Generate Gemini-powered math explanation with resilient curriculum fallback."""
    return await gemini_service.generate_explanation(
        grade=req.grade,
        topic=req.topic,
        subtopic=req.subtopic
    )

@app.post("/api/quiz/generate", response_model=QuizGenerateResponse)
async def generate_quiz(req: QuizGenerateRequest):
    """Generate Gemini-powered 4-option math quiz questions with schema validation."""
    return await gemini_service.generate_quiz(
        grade=req.grade,
        topic=req.topic,
        difficulty=req.difficulty,
        num_questions=req.num_questions
    )

# -----------------------------------------------------------------------------
# ADAPTIVE DIFFICULTY & QUIZ SCORING ENGINE
# -----------------------------------------------------------------------------
@app.post("/api/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(req: QuizSubmitRequest, username: Optional[str] = None):
    """
    Score submitted quiz answers and evaluate rule-based adaptive difficulty:
    - 3 consecutive correct -> level up (Easy -> Medium -> Hard)
    - 2 consecutive incorrect -> level down (Hard -> Medium -> Easy)
    - Bounded within [Easy, Hard]
    - Reset counters on opposite answer
    - Prevent duplicate submissions of same answer
    """
    topic_key = "shapes" if req.topic in ["shapes", "geometry"] else req.topic.lower()
    pool = FALLBACK_QUIZ_POOLS.get(req.grade, {}).get(topic_key, [])
    pool_dict = {q["question_id"]: q for q in pool}

    score = 0
    total = len(req.answers)
    consecutive_correct = req.consecutive_correct
    consecutive_incorrect = req.consecutive_incorrect
    diff_order = ["Easy", "Medium", "Hard"]
    current_diff_idx = diff_order.index(req.current_difficulty) if req.current_difficulty in diff_order else 0

    seen_qids = set()

    for ans in req.answers:
        # Prevent duplicate question submissions in same batch
        if ans.question_id in seen_qids:
            continue
        seen_qids.add(ans.question_id)

        q = pool_dict.get(ans.question_id)
        if q:
            correct_id = q["correct_option_id"]
            user_opt_id = ans.selected_option_id
            if not user_opt_id and ans.selected_index is not None and ans.selected_index < len(q["options"]):
                user_opt_id = q["options"][ans.selected_index]["id"]

            if user_opt_id == correct_id:
                score += 1
                consecutive_correct += 1
                consecutive_incorrect = 0
            else:
                consecutive_incorrect += 1
                consecutive_correct = 0

    # Evaluate adaptive difficulty rule transitions
    adaptive_transition = "maintained"
    new_diff_idx = current_diff_idx

    if consecutive_correct >= 3:
        if current_diff_idx < len(diff_order) - 1:
            new_diff_idx = current_diff_idx + 1
            adaptive_transition = "increased"
        consecutive_correct = 0  # Reset after level transition
    elif consecutive_incorrect >= 2:
        if current_diff_idx > 0:
            new_diff_idx = current_diff_idx - 1
            adaptive_transition = "decreased"
        consecutive_incorrect = 0  # Reset after level transition

    new_difficulty = diff_order[new_diff_idx]
    pct = (score / max(1, total)) * 100

    uname = username or ("leo5" if req.grade == 5 else "maya6")
    student = storage.record_quiz_score(uname, req.grade, topic_key, score=score, stars_to_award=score)

    feedback_msg = (
        f"Fantastic! You got {score}/{total} correct! "
        + ("Difficulty increased to " + new_difficulty + "!" if adaptive_transition == "increased" else "")
    )

    return QuizSubmitResponse(
        score=score,
        total=total,
        percentage=round(pct, 1),
        streak=consecutive_correct,
        adaptive_transition=adaptive_transition,
        new_difficulty=new_difficulty,
        stars_earned=score,
        badges_awarded=student.badges,
        feedback=feedback_msg,
        student=student
    )

# -----------------------------------------------------------------------------
# STATIC FILE HOSTING & FRONTEND MOUNTING
# -----------------------------------------------------------------------------
# Support both local dev layout and Vercel deployment (cwd = repo root)
_this_file = Path(__file__).resolve()
FRONTEND_DIR = _this_file.parent.parent.parent / "Frontend"
if not FRONTEND_DIR.exists():
    # Vercel runs from the project root
    FRONTEND_DIR = Path(os.getcwd()) / "Frontend"
if FRONTEND_DIR.exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
    if (FRONTEND_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(str(FRONTEND_DIR / "index.html"))

    @app.get("/{page}.html")
    async def serve_page(page: str):
        target = FRONTEND_DIR / f"{page}.html"
        if target.exists():
            return FileResponse(str(target))
        return FileResponse(str(FRONTEND_DIR / "index.html"))
