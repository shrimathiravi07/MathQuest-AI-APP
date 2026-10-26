# MathQuest AI — 3D Gamified Mathematics Learning Platform (Grade 5 & Grade 6)

MathQuest AI is an educational 3D mathematics adventure web application designed specifically for Grade 5 and Grade 6 students. It combines Three.js 3D fantasy islands, interactive math manipulatives (pizza fraction slicing, decimal balloon popping, potion ratio mixing, and 3D geometric solid orbit), Web Audio synthesized sound effects, text-to-speech narration, gamified rewards (stars and badges), and a Python FastAPI backend integrated with Google Gemini AI.


## 1. Actual Technology Stack

- **Frontend:**
  - Semantic HTML5 & Modern Vanilla CSS3 (`Frontend/css/style.css`)
  - Vanilla JavaScript ES6+ (`Frontend/js/`)
  - Utility Classes: TailwindCSS CDN 3.4.17
  - 3D Visuals: Three.js r128
  - Typography: Google Fonts (Fredoka & Nunito)
  - Audio: Synthesized Web Audio API & Web Speech API SpeechSynthesis
- **Backend:**
  - Python 3.13
  - FastAPI 0.115+
  - Uvicorn 0.52+
  - Pydantic v2
  - Pytest 8.4+
- **AI Integration:**
  - Google GenAI Python SDK (`google-genai` v2.33.0 & `google-generativeai` v0.8.6)
  - Configured model: `gemini-1.5-flash` (or `gemini-2.0-flash`, `gemini-2.5-flash`)
- **Deployment:**
  - Render (`render.yaml`)



## 2. Project Structure


MathQuizz-Ai-App/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Package initializer
│   │   ├── main.py              # FastAPI application, routing, static mounting
│   │   ├── models.py            # Pydantic request/response schemas
│   │   ├── storage.py           # Persistent student database management
│   │   ├── gemini_service.py    # Google Gemini API client & curriculum fallback
│   │   └── create_student.py    # CLI tool to register students
│   ├── data/
│   │   └── students.json        # Persistent student records, stars, badges
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_config.py       # Configuration & secret redaction tests
│   │   ├── test_auth.py         # Login, register, grade isolation tests
│   │   ├── test_gemini.py       # Gemini mock & fallback handling tests
│   │   ├── test_explanation.py  # 8 topic explanation tests
│   │   ├── test_quiz.py         # 4-option quiz validation & scoring tests
│   │   ├── test_adaptive.py     # Rule-based adaptive difficulty tests
│   │   └── test_storage.py      # Storage & badge persistence tests
│   ├── .env                     # Local environment file (ignored by git)
│   ├── .env.example             # Template environment configuration
│   └── requirements.txt         # Python dependencies
├── Frontend/
│   ├── css/
│   │   └── style.css            # 3D Toy card styles, animations, theme tokens
│   ├── js/
│   │   ├── api.js               # FastAPI client, auth calls, health checks
│   │   ├── app.js               # Navigation, auth UI, quiz engine, profile
│   │   ├── data.js              # Grade 5 & 6 curriculum, seeded students, badges
│   │   ├── sound.js             # Synthesized Web Audio sound effects
│   │   ├── three-hero.js        # Three.js 3D Fantasy World scene & camera orbit
│   │   ├── tts.js               # Web Speech API narration & celebratory effects
│   │   └── visualizations.js    # 2D/3D Canvas manipulatives (Pizza, Balloons, etc.)
│   ├── index.html               # Main unified SPA entry point
│   ├── login.html               # Dedicated Login & Registration page
│   ├── grade5.html              # Dedicated Grade 5 Island World page
│   ├── grade6.html              # Dedicated Grade 6 Island World page
│   ├── map.html                 # Dedicated Game Map page
│   ├── lesson.html              # Dedicated Interactive Lesson page
│   ├── quiz.html                # Dedicated 3D Quiz Arena page
│   ├── stars.html               # Dedicated My Stars & Achievements page
│   └── profile.html             # Dedicated Student Profile page
├── .gitignore                   # Ignores .env and virtual environments
├── MathQuest_AI_Copilot_Implementation_Specification.txt
├── PROJECT_AUDIT_REPORT.md      # Feature-by-feature verification matrix
├── TESTING_REPORT.md            # Detailed Pytest test execution report
├── render.yaml                  # Cloud deployment configuration
└── README.md                    # Complete project documentation
```

---

## 3. Getting Started & Installation

### Prerequisites
- Python 3.10+ (Python 3.13 verified)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Backend Setup (PowerShell on Windows)
1. Navigate to the backend directory:
   ```powershell
   cd c:\Users\shrim\Downloads\GMAPP\backend
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Configure your environment:
   - Copy `.env.example` to `.env`:
     ```powershell
     cp .env.example .env
     ```
   - Open `backend\.env` and set your Google Gemini API key if available:
     ```ini
     GEMINI_API_KEY=your_actual_api_key_here
     GEMINI_MODEL=gemini-1.5-flash
     PORT=8000
     HOST=0.0.0.0
     ```

### Running the Application
Start the FastAPI server from the `backend/` directory:
```powershell
cd c:\Users\shrim\Downloads\GMAPP\backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Once started:
- **Full App (with 3D world):** Open [http://localhost:8000](http://localhost:8000) in your browser.
- **Interactive API Documentation:** Open [http://localhost:8000/docs](http://localhost:8000/docs).
- **Gemini Diagnostics:** Check [http://localhost:8000/api/diagnostics/gemini](http://localhost:8000/api/diagnostics/gemini).

---

## 4. Demo Student Accounts

The application comes pre-loaded with demo students for instant verification:

| Username | Password | Grade | Stars | Highlights |
|---|---|---|---|---|
| `leo5` | `password123` | Grade 5 | 45 ⭐ | Forest Island, Pizza Master Badge |
| `maya6` | `password123` | Grade 6 | 80 ⭐ | Crystal Island, Math Legend Badge |
| `sam5` | `password123` | Grade 5 | 10 ⭐ | Beginner Explorer |

> **Note on Strict Grade Isolation:**  
> A Grade 5 student cannot log into the Grade 6 world, and a Grade 6 student cannot access Grade 5 content. The backend strictly enforces HTTP 403 Forbidden on cross-grade requests.

---

## 5. Running Automated Tests

Run the complete 36-test suite using Pytest from `backend/`:
```powershell
cd c:\Users\shrim\Downloads\GMAPP\backend
pytest -v
```

All 36 tests execute deterministically in ~3 seconds.

---

## 6. Rule-Based Adaptive Difficulty Engine

The quiz arena uses an explainable rule-based system:
1. **Initial Level:** Starts at **Easy**.
2. **Increase Rule:** 3 consecutive correct answers (`streak == 3`) automatically increases difficulty by one level (Easy → Medium → Hard).
3. **Decrease Rule:** 2 consecutive incorrect answers automatically decreases difficulty by one level (Hard → Medium → Easy).
4. **Counter Reset:** Whenever an opposite answer occurs, the consecutive counter resets.
5. **Enforced Bounds:** Difficulty never increases above Hard or decreases below Easy.
6. **Anti-Duplication:** Submitting the same question answer multiple times within a session cannot duplicate rewards.

---

## 7. Educational Math Topics Supported

Both Grade 5 and Grade 6 feature comprehensive curriculum content for:
1. **Fractions:**
   - *Grade 5:* Equal parts, numerator/denominator, 3D interactive pizza slices, equivalent fractions.
   - *Grade 6:* Multiplying fractions, reciprocals, dividing fractions (Keep-Change-Flip).
2. **Decimals:**
   - *Grade 5:* Tenths and hundredths, money concepts, balloon decimal games.
   - *Grade 6:* Multi-digit decimal multiplication, long division, place-value shifting.
3. **Ratios:**
   - *Grade 5:* Part-to-part comparisons, colon notation, potion recipe scaling.
   - *Grade 6:* Unit rates, solving proportions via cross-multiplication.
4. **Geometry / Shapes:**
   - *Grade 5:* 2D perimeter and area, 3D cube faces, edges, vertices.
   - *Grade 6:* Surface area using 2D nets, rectangular prism volume ($V = l \times w \times h$).

---

## 8. Deployment to Render

1. Connect your repository to [Render.com](https://render.com).
2. Select **New Web Service** and link to `render.yaml`.
3. In the Render Dashboard, set your private `GEMINI_API_KEY` under Environment Variables.
4. Render will run `pip install -r backend/requirements.txt` and launch `uvicorn app.main:app`.
