from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator

# -----------------------------------------------------------------------------
# 1. AUTHENTICATION & STUDENT MODELS
# -----------------------------------------------------------------------------
class StudentProfile(BaseModel):
    username: str
    display_name: str
    grade: int
    avatar: str = "🦊"
    stars: int = 0
    completed_lessons: List[str] = Field(default_factory=list)
    quiz_scores: Dict[str, int] = Field(default_factory=lambda: {"fractions": 0, "decimals": 0, "ratios": 0, "shapes": 0})
    badges: List[str] = Field(default_factory=lambda: ["first_login"])

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=100)
    grade: int = Field(..., ge=5, le=6)

    @field_validator("username")
    @classmethod
    def clean_username(cls, v: str) -> str:
        return v.strip().lower()

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)
    grade: int = Field(..., ge=5, le=6)
    display_name: Optional[str] = None

    @field_validator("username")
    @classmethod
    def clean_username(cls, v: str) -> str:
        return v.strip().lower()

class AuthResponse(BaseModel):
    token: str
    student: StudentProfile

class MessageResponse(BaseModel):
    message: str

# -----------------------------------------------------------------------------
# 2. GEMINI EXPLANATION MODELS
# -----------------------------------------------------------------------------
class ExplanationRequest(BaseModel):
    grade: int = Field(..., ge=5, le=6)
    topic: str
    subtopic: Optional[str] = None

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean in ["fractions", "decimals", "ratios", "shapes", "geometry"]:
            return "shapes" if clean == "geometry" else clean
        raise ValueError("Topic must be one of: fractions, decimals, ratios, geometry")

class PracticeQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class ExplanationResponse(BaseModel):
    grade: int
    topic: str
    title: str
    definition: str
    why_useful: str
    step_by_step: List[str]
    real_life_example: str
    worked_example: str
    correct_answer_reasoning: str
    practice_question: PracticeQuestion
    common_mistakes: List[str]
    source: str = "gemini"  # "gemini" or "curriculum_fallback"

# -----------------------------------------------------------------------------
# 3. GEMINI QUIZ MODELS
# -----------------------------------------------------------------------------
class QuizOption(BaseModel):
    id: str  # "A", "B", "C", "D"
    text: str

class QuizQuestion(BaseModel):
    question_id: str
    grade: int
    topic: str
    difficulty: str  # "Easy", "Medium", "Hard"
    question: str
    options: List[QuizOption]
    correct_option_id: str
    explanation: str

    @field_validator("options")
    @classmethod
    def validate_four_options(cls, v: List[QuizOption]) -> List[QuizOption]:
        if len(v) != 4:
            raise ValueError(f"Exactly 4 unique options required, found {len(v)}")
        ids = [opt.id for opt in v]
        if len(set(ids)) != 4:
            raise ValueError("All 4 option IDs must be unique (A, B, C, D)")
        return v

class QuizGenerateRequest(BaseModel):
    grade: int = Field(..., ge=5, le=6)
    topic: str
    difficulty: str = Field(default="Easy")
    num_questions: int = Field(default=4, ge=1, le=10)

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean in ["fractions", "decimals", "ratios", "shapes", "geometry"]:
            return "shapes" if clean == "geometry" else clean
        raise ValueError("Topic must be one of: fractions, decimals, ratios, geometry")

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        cap = v.capitalize()
        if cap in ["Easy", "Medium", "Hard"]:
            return cap
        return "Easy"

class QuizGenerateResponse(BaseModel):
    grade: int
    topic: str
    difficulty: str
    questions: List[QuizQuestion]
    source: str = "gemini"

# -----------------------------------------------------------------------------
# 4. QUIZ SUBMISSION & ADAPTIVE DIFFICULTY MODELS
# -----------------------------------------------------------------------------
class AnswerSubmission(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None
    selected_index: Optional[int] = None

class QuizSubmitRequest(BaseModel):
    grade: int = Field(..., ge=5, le=6)
    topic: str
    answers: List[AnswerSubmission]
    current_difficulty: str = "Easy"
    consecutive_correct: int = 0
    consecutive_incorrect: int = 0

class SingleAnswerVerifyRequest(BaseModel):
    question_id: str
    selected_index: int

class SingleAnswerVerifyResponse(BaseModel):
    correct: bool
    feedback: str
    correct_index: int
    correct_answer: str
    explanation: str
    student: Optional[StudentProfile] = None

class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: float
    streak: int
    adaptive_transition: str
    new_difficulty: str
    stars_earned: int
    badges_awarded: List[str]
    feedback: str
    student: StudentProfile

# -----------------------------------------------------------------------------
# 5. PROGRESS & HEALTH MODELS
# -----------------------------------------------------------------------------
class LessonCompleteResponse(BaseModel):
    student: StudentProfile
    awarded_star: bool

class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    storage_status: str
    gemini_configured: bool
    timestamp: str

class GeminiDiagnosticResponse(BaseModel):
    configured: bool
    model: str
    sdk_version: str
    live_connection_status: str  # "CONNECTED AND VERIFIED", "FAILED", "UNVERIFIED (NO KEY)"
    message: str
