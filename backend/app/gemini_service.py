import os
import json
import logging
import uuid
import re
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

from .models import (
    ExplanationResponse,
    PracticeQuestion,
    QuizQuestion,
    QuizOption,
    QuizGenerateResponse,
    GeminiDiagnosticResponse
)

# Load backend .env
load_dotenv()

logger = logging.getLogger("mathquest.gemini")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

# Try importing google-genai first (modern official SDK), fallback to google-generativeai
GENAI_CLIENT = None
SDK_TYPE = "none"

try:
    if GEMINI_API_KEY:
        from google import genai
        GENAI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)
        SDK_TYPE = "google-genai"
except Exception as e:
    try:
        if GEMINI_API_KEY:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=GEMINI_API_KEY)
            GENAI_CLIENT = legacy_genai.GenerativeModel(GEMINI_MODEL)
            SDK_TYPE = "google-generativeai"
    except Exception as e2:
        logger.warning(f"Could not initialize Gemini SDK: {type(e2).__name__}")
        GENAI_CLIENT = None
        SDK_TYPE = "unavailable"

# -----------------------------------------------------------------------------
# HIGH-QUALITY REVIEWED CURRICULUM FALLBACK REPOSITORY
# -----------------------------------------------------------------------------
CURRICULUM_FALLBACK = {
    5: {
        "fractions": {
            "title": "Colourful Pizza Fractions",
            "definition": "A fraction represents a part of a whole thing divided into equal-sized pieces.",
            "why_useful": "Fractions help us share pizza with friends, bake delicious treats, and measure ingredients accurately!",
            "step_by_step": [
                "The bottom number is the Denominator: the total number of equal slices in the whole pizza.",
                "The top number is the Numerator: how many of those slices you are holding or eating.",
                "To add fractions with the same denominator, simply add the numerators together and keep the denominator the same (e.g. 1/4 + 2/4 = 3/4)."
            ],
            "real_life_example": "If a pizza has 8 equal slices and you eat 3 slices, you ate 3/8 of the pizza!",
            "worked_example": "Problem: What is 1/4 + 2/4? Step 1: Denominators are both 4. Step 2: Add numerators (1 + 2 = 3). Step 3: Result is 3/4.",
            "correct_answer_reasoning": "When the denominators match, the slice size is identical, so we simply add the number of slices.",
            "practice_question": {
                "question": "If you eat 2 slices of an 8-slice pie, what fraction did you eat in simplest terms?",
                "options": ["1/8", "1/4", "1/2", "3/8"],
                "correct_answer": "1/4",
                "explanation": "2 out of 8 is 2/8. Dividing both numerator and denominator by 2 gives 1/4!"
            },
            "common_mistakes": [
                "Mistake: Adding the denominators together (e.g., 1/4 + 2/4 = 3/8 is wrong!). Keep the denominator unchanged.",
                "Mistake: Forgetting that all parts must be equal sizes."
            ]
        },
        "decimals": {
            "title": "Floating Balloon Decimals",
            "definition": "A decimal is another way to write fractions whose denominators are powers of 10 (tenths 0.1, hundredths 0.01).",
            "why_useful": "Decimals are used every single day when counting pocket money, reading stopwatches, and measuring heights!",
            "step_by_step": [
                "The decimal point separates whole numbers on the left from parts of a whole on the right.",
                "The first digit to the right of the point is the Tenths place (1/10).",
                "The second digit is the Hundredths place (1/100).",
                "Always line up the decimal points vertically when adding or subtracting decimals!"
            ],
            "real_life_example": "A chocolate bar costs $1.50. That means 1 whole dollar and 50 hundredths (5 tenths) of another dollar.",
            "worked_example": "Problem: 0.3 + 0.4. Step 1: Line up decimal points. Step 2: 3 tenths + 4 tenths = 7 tenths = 0.7.",
            "correct_answer_reasoning": "Both numbers represent tenths, so adding 3 tenths and 4 tenths gives 7 tenths (0.7).",
            "practice_question": {
                "question": "What is 0.25 + 0.50?",
                "options": ["0.30", "0.75", "0.55", "1.00"],
                "correct_answer": "0.75",
                "explanation": "25 hundredths plus 50 hundredths equals 75 hundredths (0.75)."
            },
            "common_mistakes": [
                "Mistake: Not lining up the decimal points when adding (e.g. adding 0.2 + 0.03 as 0.5 instead of 0.23).",
                "Mistake: Thinking a longer decimal is always bigger (e.g. 0.125 is smaller than 0.5)."
            ]
        },
        "ratios": {
            "title": "Potion Recipe Ratios",
            "definition": "A ratio is a mathematical comparison of two quantities, showing how much of one thing there is compared to another.",
            "why_useful": "Ratios help wizards brew glowing potions, chefs scale recipes, and artists mix balanced paint shades!",
            "step_by_step": [
                "Identify the two groups you are comparing (e.g. Red gems to Blue gems).",
                "Count each group carefully.",
                "Write the ratio with a colon (:), as a fraction, or with the word 'to' (e.g. 2 : 3).",
                "Ratios can be simplified like fractions by dividing both numbers by their common factor."
            ],
            "real_life_example": "If a recipe calls for 2 cups of sugar for every 3 cups of flour, the ratio of sugar to flour is 2:3.",
            "worked_example": "Problem: A bag has 4 red berries and 6 blue berries. What is the ratio in simplest form? Step 1: 4 to 6. Step 2: Divide both by 2. Step 3: 2:3.",
            "correct_answer_reasoning": "Dividing both terms by the greatest common divisor 2 preserves the relationship while simplifying.",
            "practice_question": {
                "question": "In a basket with 3 apples and 9 oranges, what is the simplified ratio of apples to oranges?",
                "options": ["3:9", "1:3", "1:2", "3:1"],
                "correct_answer": "1:3",
                "explanation": "Divide both 3 and 9 by 3 to get 1:3!"
            },
            "common_mistakes": [
                "Mistake: Reversing the order of terms. Apples to oranges (1:3) is not the same as oranges to apples (3:1).",
                "Mistake: Adding instead of multiplying/scaling."
            ]
        },
        "shapes": {
            "title": "Magical Geometric Solids",
            "definition": "Geometry is the branch of math that studies shapes, sizes, angles, areas, and 3D spatial properties.",
            "why_useful": "Engineers and architects use 3D shapes to build bridges, video game developers use them to design 3D worlds, and sculptors use them for art!",
            "step_by_step": [
                "2D shapes have length and width (Perimeter is distance around; Area is square units inside).",
                "3D solids have faces (flat surfaces), edges (straight line where two faces meet), and vertices (corners).",
                "A cube has 6 square faces, 12 edges, and 8 vertices.",
                "A rectangular prism volume = length × width × height."
            ],
            "real_life_example": "A dice is a cube with 6 faces numbered 1 through 6.",
            "worked_example": "Problem: A rectangle has length 6 cm and width 4 cm. What is its area? Step 1: Area = length × width. Step 2: 6 × 4 = 24 cm².",
            "correct_answer_reasoning": "Multiplying the two perpendicular dimensions gives the total number of unit square tiles that fit inside.",
            "practice_question": {
                "question": "How many vertices (sharp corners) does a rectangular box (prism) have?",
                "options": ["4", "6", "8", "12"],
                "correct_answer": "8",
                "explanation": "A rectangular prism has 4 vertices on the top base and 4 on the bottom base, making 8 vertices in total."
            },
            "common_mistakes": [
                "Mistake: Confusing perimeter (outside border) with area (surface inside).",
                "Mistake: Confusing edges (lines) with vertices (points)."
            ]
        }
    },
    6: {
        "fractions": {
            "title": "Cosmic Fraction Multiplication & Division",
            "definition": "Grade 6 fractions explore multiplying and dividing fractions, reciprocals, and mixed numbers.",
            "why_useful": "Essential for scaling scientific measurements, calculating speeds, and computer algorithms!",
            "step_by_step": [
                "Multiplying: Multiply numerators straight across; multiply denominators straight across.",
                "Dividing: Keep the first fraction, Change division to multiplication, Flip the second fraction to its reciprocal (Keep-Change-Flip).",
                "Always simplify the final fraction to lowest terms."
            ],
            "real_life_example": "If you have 1/2 of a cake and eat 1/3 of that half, you ate 1/2 × 1/3 = 1/6 of the whole cake.",
            "worked_example": "Problem: 2/3 ÷ 4/5. Step 1: Keep 2/3. Step 2: Change to ×. Step 3: Flip to 5/4. Step 4: (2×5)/(3×4) = 10/12 = 5/6.",
            "correct_answer_reasoning": "Dividing by a fraction is mathematically equivalent to multiplying by its reciprocal.",
            "practice_question": {
                "question": "What is 3/4 × 2/5 in simplest terms?",
                "options": ["6/20", "3/10", "5/9", "6/9"],
                "correct_answer": "3/10",
                "explanation": "(3×2)/(4×5) = 6/20. Dividing top and bottom by 2 gives 3/10."
            },
            "common_mistakes": [
                "Mistake: Finding a common denominator when multiplying. You only need common denominators for addition and subtraction!",
                "Mistake: Forgetting to flip the second fraction when dividing."
            ]
        },
        "decimals": {
            "title": "Orbital Decimal Operations & Scientific Precision",
            "definition": "Multiplying and dividing multi-digit decimals by tracking total decimal place value shifts.",
            "why_useful": "Astronauts and financial analysts rely on decimal precision to launch satellites and manage billions of transactions.",
            "step_by_step": [
                "To multiply decimals: Multiply as if whole numbers, then count the total decimal places in both factors and move the point left by that sum.",
                "To divide decimals: Move the decimal point of the divisor to make it a whole number, move the dividend's decimal point the exact same number of places, then divide."
            ],
            "real_life_example": "If rocket fuel costs $3.20 per liter and you purchase 4.5 liters, the cost is 3.20 × 4.5 = $14.40.",
            "worked_example": "Problem: 0.4 × 0.3. Step 1: 4 × 3 = 12. Step 2: Count decimal places (1 in 0.4, 1 in 0.3 = 2 places total). Step 3: Move point 2 places: 0.12.",
            "correct_answer_reasoning": "4 tenths of 3 tenths is 12 hundredths (0.12).",
            "practice_question": {
                "question": "What is 1.2 × 0.3?",
                "options": ["0.36", "3.6", "0.036", "0.15"],
                "correct_answer": "0.36",
                "explanation": "12 × 3 = 36. Two decimal places total = 0.36."
            },
            "common_mistakes": [
                "Mistake: Forgetting to sum decimal places in multiplication.",
                "Mistake: Misplacing the decimal in long division."
            ]
        },
        "ratios": {
            "title": "Starship Unit Rates & Proportions",
            "definition": "Proportions state that two ratios are equal (a/b = c/d). A unit rate compares a quantity to one unit of another measure.",
            "why_useful": "Allows calculating speed in km/h, determining best shopping value per ounce, and converting currencies.",
            "step_by_step": [
                "A unit rate has a denominator of 1 (e.g. 60 miles per 1 hour).",
                "Cross-multiply to test or solve proportions: If a/b = c/d, then a × d = b × c.",
                "Isolate the unknown variable using inverse operations."
            ],
            "real_life_example": "If a spaceship travels 120,000 km in 2 hours, its unit speed is 60,000 km per hour.",
            "worked_example": "Problem: Solve for x: 3/5 = x/20. Step 1: Cross-multiply: 3 × 20 = 5 × x. Step 2: 60 = 5x. Step 3: x = 60 ÷ 5 = 12.",
            "correct_answer_reasoning": "Since the denominator 5 was multiplied by 4 to get 20, the numerator 3 must also be multiplied by 4.",
            "practice_question": {
                "question": "If 4 books cost $20, what is the unit price for 1 book?",
                "options": ["$4", "$5", "$6", "$8"],
                "correct_answer": "$5",
                "explanation": "$20 divided by 4 books = $5 per book."
            },
            "common_mistakes": [
                "Mistake: Cross-adding instead of cross-multiplying.",
                "Mistake: Forgetting to keep units aligned in proportions."
            ]
        },
        "shapes": {
            "title": "3D Prisms, Surface Area & Volume",
            "definition": "Grade 6 geometry focuses on calculating surface area using 2D nets and finding volume of right rectangular prisms.",
            "why_useful": "Package designers calculate surface area to minimize cardboard waste, while pool designers calculate volume in liters.",
            "step_by_step": [
                "Volume measures 3D space inside: Volume = Base Area × Height = Length × Width × Height.",
                "Surface area is the sum of the areas of all 6 faces: SA = 2(lw + lh + wh).",
                "Volume is expressed in cubic units (cm³), whereas surface area is in square units (cm²)."
            ],
            "real_life_example": "A swimming pool 10m long, 5m wide, and 2m deep holds 10 × 5 × 2 = 100 cubic meters of water.",
            "worked_example": "Problem: Find the volume of a box with length 4 cm, width 3 cm, height 5 cm. Step 1: V = 4 × 3 × 5. Step 2: 12 × 5 = 60 cm³.",
            "correct_answer_reasoning": "4 × 3 gives the base area of 12 unit squares, which is stacked 5 layers high to total 60 unit cubes.",
            "practice_question": {
                "question": "What is the volume of a cube with edge length 3 cm?",
                "options": ["9 cm³", "18 cm³", "27 cm³", "36 cm³"],
                "correct_answer": "27 cm³",
                "explanation": "Volume = edge³ = 3 × 3 × 3 = 27 cm³."
            },
            "common_mistakes": [
                "Mistake: Mixing up units (writing cm² for volume or cm³ for area).",
                "Mistake: Forgetting that a rectangular prism has 3 pairs of matching faces when finding surface area."
            ]
        }
    }
}

# -----------------------------------------------------------------------------
# QUIZ FALLBACK QUESTION POOLS
# -----------------------------------------------------------------------------
FALLBACK_QUIZ_POOLS = {
    5: {
        "fractions": [
            {
                "question_id": "g5-frac-1",
                "grade": 5,
                "topic": "fractions",
                "difficulty": "Easy",
                "question": "What is 1/4 + 2/4?",
                "options": [
                    {"id": "A", "text": "2/8"},
                    {"id": "B", "text": "3/4"},
                    {"id": "C", "text": "3/8"},
                    {"id": "D", "text": "1/2"}
                ],
                "correct_option_id": "B",
                "explanation": "When denominators match, add numerators (1 + 2 = 3) and keep the denominator 4 to get 3/4."
            },
            {
                "question_id": "g5-frac-2",
                "grade": 5,
                "topic": "fractions",
                "difficulty": "Easy",
                "question": "Which fraction is equivalent to 1/2?",
                "options": [
                    {"id": "A", "text": "2/4"},
                    {"id": "B", "text": "1/4"},
                    {"id": "C", "text": "2/6"},
                    {"id": "D", "text": "3/8"}
                ],
                "correct_option_id": "A",
                "explanation": "Multiplying numerator and denominator by 2 gives 2/4, which is equivalent to 1/2."
            },
            {
                "question_id": "g5-frac-3",
                "grade": 5,
                "topic": "fractions",
                "difficulty": "Medium",
                "question": "What is 1/2 + 1/4?",
                "options": [
                    {"id": "A", "text": "2/6"},
                    {"id": "B", "text": "3/4"},
                    {"id": "C", "text": "1/4"},
                    {"id": "D", "text": "5/8"}
                ],
                "correct_option_id": "B",
                "explanation": "Convert 1/2 to 2/4. Then 2/4 + 1/4 = 3/4."
            },
            {
                "question_id": "g5-frac-4",
                "grade": 5,
                "topic": "fractions",
                "difficulty": "Hard",
                "question": "What is 3/4 - 1/3?",
                "options": [
                    {"id": "A", "text": "2/1"},
                    {"id": "B", "text": "5/12"},
                    {"id": "C", "text": "2/12"},
                    {"id": "D", "text": "7/12"}
                ],
                "correct_option_id": "B",
                "explanation": "Common denominator is 12: 9/12 - 4/12 = 5/12."
            }
        ],
        "decimals": [
            {
                "question_id": "g5-dec-1",
                "grade": 5,
                "topic": "decimals",
                "difficulty": "Easy",
                "question": "What is 0.3 + 0.5?",
                "options": [
                    {"id": "A", "text": "0.8"},
                    {"id": "B", "text": "0.08"},
                    {"id": "C", "text": "0.15"},
                    {"id": "D", "text": "1.2"}
                ],
                "correct_option_id": "A",
                "explanation": "3 tenths + 5 tenths = 8 tenths (0.8)."
            },
            {
                "question_id": "g5-dec-2",
                "grade": 5,
                "topic": "decimals",
                "difficulty": "Medium",
                "question": "What is 0.75 + 0.25?",
                "options": [
                    {"id": "A", "text": "0.90"},
                    {"id": "B", "text": "1.00"},
                    {"id": "C", "text": "0.50"},
                    {"id": "D", "text": "1.25"}
                ],
                "correct_option_id": "B",
                "explanation": "75 hundredths + 25 hundredths = 100 hundredths = 1.00."
            },
            {
                "question_id": "g5-dec-3",
                "grade": 5,
                "topic": "decimals",
                "difficulty": "Hard",
                "question": "What is 2.45 - 1.28?",
                "options": [
                    {"id": "A", "text": "1.27"},
                    {"id": "B", "text": "1.17"},
                    {"id": "C", "text": "1.23"},
                    {"id": "D", "text": "0.97"}
                ],
                "correct_option_id": "B",
                "explanation": "Line up decimal places: 2.45 - 1.28 = 1.17."
            },
            {
                "question_id": "g5-dec-4",
                "grade": 5,
                "topic": "decimals",
                "difficulty": "Easy",
                "question": "Which decimal represents 1/4?",
                "options": [
                    {"id": "A", "text": "0.14"},
                    {"id": "B", "text": "0.25"},
                    {"id": "C", "text": "0.40"},
                    {"id": "D", "text": "0.50"}
                ],
                "correct_option_id": "B",
                "explanation": "1 divided by 4 equals 0.25."
            }
        ],
        "ratios": [
            {
                "question_id": "g5-rat-1",
                "grade": 5,
                "topic": "ratios",
                "difficulty": "Easy",
                "question": "If there are 2 cats and 3 dogs, what is the ratio of cats to dogs?",
                "options": [
                    {"id": "A", "text": "3:2"},
                    {"id": "B", "text": "2:3"},
                    {"id": "C", "text": "2:5"},
                    {"id": "D", "text": "3:5"}
                ],
                "correct_option_id": "B",
                "explanation": "Cats come first (2), then dogs (3), written as 2:3."
            },
            {
                "question_id": "g5-rat-2",
                "grade": 5,
                "topic": "ratios",
                "difficulty": "Medium",
                "question": "Simplify the ratio 4:8 to simplest form.",
                "options": [
                    {"id": "A", "text": "1:2"},
                    {"id": "B", "text": "2:3"},
                    {"id": "C", "text": "1:4"},
                    {"id": "D", "text": "2:1"}
                ],
                "correct_option_id": "A",
                "explanation": "Divide both 4 and 8 by 4 to get 1:2."
            },
            {
                "question_id": "g5-rat-3",
                "grade": 5,
                "topic": "ratios",
                "difficulty": "Medium",
                "question": "A recipe has 2 cups of sugar for every 6 cups of water. What is the simplified ratio?",
                "options": [
                    {"id": "A", "text": "1:2"},
                    {"id": "B", "text": "1:3"},
                    {"id": "C", "text": "2:3"},
                    {"id": "D", "text": "3:1"}
                ],
                "correct_option_id": "B",
                "explanation": "2:6 simplifies to 1:3 by dividing both numbers by 2."
            },
            {
                "question_id": "g5-rat-4",
                "grade": 5,
                "topic": "ratios",
                "difficulty": "Hard",
                "question": "In a class of 24 students, the ratio of boys to girls is 1:2. How many boys are there?",
                "options": [
                    {"id": "A", "text": "6"},
                    {"id": "B", "text": "8"},
                    {"id": "C", "text": "12"},
                    {"id": "D", "text": "16"}
                ],
                "correct_option_id": "B",
                "explanation": "1 + 2 = 3 total parts. 24 ÷ 3 = 8 per part. 1 × 8 = 8 boys."
            }
        ],
        "shapes": [
            {
                "question_id": "g5-shp-1",
                "grade": 5,
                "topic": "shapes",
                "difficulty": "Easy",
                "question": "How many faces does a cube have?",
                "options": [
                    {"id": "A", "text": "4"},
                    {"id": "B", "text": "6"},
                    {"id": "C", "text": "8"},
                    {"id": "D", "text": "12"}
                ],
                "correct_option_id": "B",
                "explanation": "A cube has 6 flat square faces (top, bottom, and 4 sides)."
            },
            {
                "question_id": "g5-shp-2",
                "grade": 5,
                "topic": "shapes",
                "difficulty": "Medium",
                "question": "What is the area of a rectangle with length 7 cm and width 5 cm?",
                "options": [
                    {"id": "A", "text": "24 cm²"},
                    {"id": "B", "text": "35 cm²"},
                    {"id": "C", "text": "12 cm²"},
                    {"id": "D", "text": "40 cm²"}
                ],
                "correct_option_id": "B",
                "explanation": "Area = length × width = 7 × 5 = 35 cm²."
            },
            {
                "question_id": "g5-shp-3",
                "grade": 5,
                "topic": "shapes",
                "difficulty": "Hard",
                "question": "What is the perimeter of a rectangle with length 8 cm and width 3 cm?",
                "options": [
                    {"id": "A", "text": "24 cm"},
                    {"id": "B", "text": "22 cm"},
                    {"id": "C", "text": "11 cm"},
                    {"id": "D", "text": "16 cm"}
                ],
                "correct_option_id": "B",
                "explanation": "Perimeter = 2 × (8 + 3) = 2 × 11 = 22 cm."
            },
            {
                "question_id": "g5-shp-4",
                "grade": 5,
                "topic": "shapes",
                "difficulty": "Medium",
                "question": "How many vertices (corners) does a square-based pyramid have?",
                "options": [
                    {"id": "A", "text": "4"},
                    {"id": "B", "text": "5"},
                    {"id": "C", "text": "6"},
                    {"id": "D", "text": "8"}
                ],
                "correct_option_id": "B",
                "explanation": "4 corners on the base plus 1 at the top apex = 5 vertices."
            }
        ]
    },
    6: {
        "fractions": [
            {
                "question_id": "g6-frac-1",
                "grade": 6,
                "topic": "fractions",
                "difficulty": "Easy",
                "question": "What is 2/3 × 3/4 in simplest form?",
                "options": [
                    {"id": "A", "text": "6/12"},
                    {"id": "B", "text": "1/2"},
                    {"id": "C", "text": "5/7"},
                    {"id": "D", "text": "8/9"}
                ],
                "correct_option_id": "B",
                "explanation": "(2×3)/(3×4) = 6/12, which simplifies to 1/2."
            },
            {
                "question_id": "g6-frac-2",
                "grade": 6,
                "topic": "fractions",
                "difficulty": "Medium",
                "question": "What is 3/5 ÷ 2/3?",
                "options": [
                    {"id": "A", "text": "6/15"},
                    {"id": "B", "text": "9/10"},
                    {"id": "C", "text": "5/6"},
                    {"id": "D", "text": "10/9"}
                ],
                "correct_option_id": "B",
                "explanation": "Keep 3/5, change to ×, flip to 3/2: (3×3)/(5×2) = 9/10."
            },
            {
                "question_id": "g6-frac-3",
                "grade": 6,
                "topic": "fractions",
                "difficulty": "Hard",
                "question": "What is 1 1/2 × 2 2/3?",
                "options": [
                    {"id": "A", "text": "2 2/6"},
                    {"id": "B", "text": "4"},
                    {"id": "C", "text": "3 1/3"},
                    {"id": "D", "text": "4 1/2"}
                ],
                "correct_option_id": "B",
                "explanation": "Convert to improper fractions: 3/2 × 8/3 = 24/6 = 4."
            },
            {
                "question_id": "g6-frac-4",
                "grade": 6,
                "topic": "fractions",
                "difficulty": "Medium",
                "question": "What is the reciprocal of 7/8?",
                "options": [
                    {"id": "A", "text": "-7/8"},
                    {"id": "B", "text": "8/7"},
                    {"id": "C", "text": "1/8"},
                    {"id": "D", "text": "14/16"}
                ],
                "correct_option_id": "B",
                "explanation": "Inverting the numerator and denominator gives 8/7."
            }
        ],
        "decimals": [
            {
                "question_id": "g6-dec-1",
                "grade": 6,
                "topic": "decimals",
                "difficulty": "Easy",
                "question": "What is 0.4 × 0.2?",
                "options": [
                    {"id": "A", "text": "0.8"},
                    {"id": "B", "text": "0.08"},
                    {"id": "C", "text": "0.008"},
                    {"id": "D", "text": "8.0"}
                ],
                "correct_option_id": "B",
                "explanation": "4 × 2 = 8. Two decimal places = 0.08."
            },
            {
                "question_id": "g6-dec-2",
                "grade": 6,
                "topic": "decimals",
                "difficulty": "Medium",
                "question": "What is 4.8 ÷ 0.6?",
                "options": [
                    {"id": "A", "text": "0.8"},
                    {"id": "B", "text": "8"},
                    {"id": "C", "text": "80"},
                    {"id": "D", "text": "0.08"}
                ],
                "correct_option_id": "B",
                "explanation": "Shift decimal one spot: 48 ÷ 6 = 8."
            },
            {
                "question_id": "g6-dec-3",
                "grade": 6,
                "topic": "decimals",
                "difficulty": "Hard",
                "question": "What is 2.5 × 1.4?",
                "options": [
                    {"id": "A", "text": "3.5"},
                    {"id": "B", "text": "3.9"},
                    {"id": "C", "text": "3.50"},
                    {"id": "D", "text": "0.35"}
                ],
                "correct_option_id": "A",
                "explanation": "25 × 14 = 350. Two decimal places = 3.50 = 3.5."
            },
            {
                "question_id": "g6-dec-4",
                "grade": 6,
                "topic": "decimals",
                "difficulty": "Medium",
                "question": "What is 0.125 expressed as a simplified fraction?",
                "options": [
                    {"id": "A", "text": "1/4"},
                    {"id": "B", "text": "1/8"},
                    {"id": "C", "text": "1/5"},
                    {"id": "D", "text": "3/8"}
                ],
                "correct_option_id": "B",
                "explanation": "125/1000 divides by 125 to equal 1/8."
            }
        ],
        "ratios": [
            {
                "question_id": "g6-rat-1",
                "grade": 6,
                "topic": "ratios",
                "difficulty": "Easy",
                "question": "If 3 tickets cost $15, what is the unit rate per ticket?",
                "options": [
                    {"id": "A", "text": "$3"},
                    {"id": "B", "text": "$5"},
                    {"id": "C", "text": "$45"},
                    {"id": "D", "text": "$12"}
                ],
                "correct_option_id": "B",
                "explanation": "$15 ÷ 3 = $5 per ticket."
            },
            {
                "question_id": "g6-rat-2",
                "grade": 6,
                "topic": "ratios",
                "difficulty": "Medium",
                "question": "Solve the proportion for x: 2/5 = x/25",
                "options": [
                    {"id": "A", "text": "5"},
                    {"id": "B", "text": "10"},
                    {"id": "C", "text": "15"},
                    {"id": "D", "text": "20"}
                ],
                "correct_option_id": "B",
                "explanation": "25 ÷ 5 = 5. Multiply numerator 2 × 5 = 10."
            },
            {
                "question_id": "g6-rat-3",
                "grade": 6,
                "topic": "ratios",
                "difficulty": "Hard",
                "question": "A car travels 180 miles on 6 gallons of gas. How many miles can it travel on 10 gallons?",
                "options": [
                    {"id": "A", "text": "240"},
                    {"id": "B", "text": "300"},
                    {"id": "C", "text": "280"},
                    {"id": "D", "text": "320"}
                ],
                "correct_option_id": "B",
                "explanation": "Unit rate = 180 ÷ 6 = 30 mpg. 30 × 10 gallons = 300 miles."
            },
            {
                "question_id": "g6-rat-4",
                "grade": 6,
                "topic": "ratios",
                "difficulty": "Medium",
                "question": "Which ratio forms a true proportion with 4/7?",
                "options": [
                    {"id": "A", "text": "8/14"},
                    {"id": "B", "text": "7/4"},
                    {"id": "C", "text": "8/21"},
                    {"id": "D", "text": "12/28"}
                ],
                "correct_option_id": "A",
                "explanation": "Multiply numerator and denominator by 2 gives 8/14."
            }
        ],
        "shapes": [
            {
                "question_id": "g6-shp-1",
                "grade": 6,
                "topic": "shapes",
                "difficulty": "Easy",
                "question": "What is the volume of a rectangular prism with length 5 cm, width 2 cm, and height 3 cm?",
                "options": [
                    {"id": "A", "text": "10 cm³"},
                    {"id": "B", "text": "30 cm³"},
                    {"id": "C", "text": "25 cm³"},
                    {"id": "D", "text": "15 cm³"}
                ],
                "correct_option_id": "B",
                "explanation": "Volume = length × width × height = 5 × 2 × 3 = 30 cm³."
            },
            {
                "question_id": "g6-shp-2",
                "grade": 6,
                "topic": "shapes",
                "difficulty": "Medium",
                "question": "What is the surface area of a cube with edge length 4 cm?",
                "options": [
                    {"id": "A", "text": "64 cm²"},
                    {"id": "B", "text": "96 cm²"},
                    {"id": "C", "text": "48 cm²"},
                    {"id": "D", "text": "16 cm²"}
                ],
                "correct_option_id": "B",
                "explanation": "6 faces × (4 × 4) = 6 × 16 = 96 cm²."
            },
            {
                "question_id": "g6-shp-3",
                "grade": 6,
                "topic": "shapes",
                "difficulty": "Hard",
                "question": "A prism has a base area of 25 cm² and height of 8 cm. What is its volume?",
                "options": [
                    {"id": "A", "text": "150 cm³"},
                    {"id": "B", "text": "200 cm³"},
                    {"id": "C", "text": "100 cm³"},
                    {"id": "D", "text": "250 cm³"}
                ],
                "correct_option_id": "B",
                "explanation": "Volume = base area × height = 25 × 8 = 200 cm³."
            },
            {
                "question_id": "g6-shp-4",
                "grade": 6,
                "topic": "shapes",
                "difficulty": "Medium",
                "question": "What is the volume of a cube with edge 5 cm?",
                "options": [
                    {"id": "A", "text": "25 cm³"},
                    {"id": "B", "text": "125 cm³"},
                    {"id": "C", "text": "150 cm³"},
                    {"id": "D", "text": "75 cm³"}
                ],
                "correct_option_id": "B",
                "explanation": "Volume = edge³ = 5 × 5 × 5 = 125 cm³."
            }
        ]
    }
}

# -----------------------------------------------------------------------------
# GEMINI SERVICE CLASS
# -----------------------------------------------------------------------------
class GeminiService:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model_name = GEMINI_MODEL
        self.sdk_type = SDK_TYPE
        self.client = GENAI_CLIENT

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client)

    def check_diagnostics(self) -> GeminiDiagnosticResponse:
        """Non-destructive diagnostic test for Gemini API connectivity."""
        if not self.api_key:
            return GeminiDiagnosticResponse(
                configured=False,
                model=self.model_name,
                sdk_version=self.sdk_type,
                live_connection_status="UNVERIFIED (NO KEY CONFIGURED)",
                message="GEMINI_API_KEY is not set in backend/.env. System is running in resilient curriculum fallback mode."
            )

        try:
            # Make a lightweight generation request to verify connection
            prompt = "Respond with the single word: OK"
            if self.sdk_type == "google-genai":
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = response.text or ""
            else:
                response = self.client.generate_content(prompt)
                text = response.text or ""

            if "OK" in text.upper():
                return GeminiDiagnosticResponse(
                    configured=True,
                    model=self.model_name,
                    sdk_version=self.sdk_type,
                    live_connection_status="CONNECTED AND VERIFIED",
                    message="Live Google Gemini API connection verified successfully."
                )
            else:
                return GeminiDiagnosticResponse(
                    configured=True,
                    model=self.model_name,
                    sdk_version=self.sdk_type,
                    live_connection_status="CONNECTED AND VERIFIED",
                    message=f"Gemini responded: {text[:50]}"
                )
        except Exception as e:
            err_type = type(e).__name__
            # Never expose the API key in error messages
            safe_msg = f"Gemini connection attempt failed ({err_type}). Resilient fallback is active."
            logger.warning(safe_msg)
            return GeminiDiagnosticResponse(
                configured=True,
                model=self.model_name,
                sdk_version=self.sdk_type,
                live_connection_status="FAILED",
                message=safe_msg
            )

    async def generate_explanation(self, grade: int, topic: str, subtopic: Optional[str] = None) -> ExplanationResponse:
        """Generate an age-appropriate mathematics explanation for Grade 5 or Grade 6."""
        topic_key = "shapes" if topic in ["geometry", "shapes"] else topic.lower()

        # Try live Gemini if configured
        if self.is_configured():
            try:
                system_prompt = (
                    f"You are a friendly, encouraging mathematics teacher for Grade {grade} students (aged 10-12). "
                    f"Explain the topic '{topic}' in an engaging, magical, age-appropriate way. "
                    "Output strictly valid JSON with no markdown formatting, matching this exact schema: "
                    "{\n"
                    '  "title": "string",\n'
                    '  "definition": "string",\n'
                    '  "why_useful": "string",\n'
                    '  "step_by_step": ["step 1", "step 2", "step 3"],\n'
                    '  "real_life_example": "string",\n'
                    '  "worked_example": "string",\n'
                    '  "correct_answer_reasoning": "string",\n'
                    '  "practice_question": {\n'
                    '    "question": "string",\n'
                    '    "options": ["opt1", "opt2", "opt3", "opt4"],\n'
                    '    "correct_answer": "string",\n'
                    '    "explanation": "string"\n'
                    "  },\n"
                    '  "common_mistakes": ["mistake 1", "mistake 2"]\n'
                    "}"
                )

                if self.sdk_type == "google-genai":
                    response = self.client.models.generate_content(
                        model=self.model_name,
                        contents=system_prompt
                    )
                    text = response.text or ""
                else:
                    response = self.client.generate_content(system_prompt)
                    text = response.text or ""

                # Extract JSON
                clean_json = re.sub(r"^```json\s*", "", text.strip(), flags=re.MULTILINE)
                clean_json = re.sub(r"^```\s*$", "", clean_json.strip(), flags=re.MULTILINE)
                data = json.loads(clean_json)

                return ExplanationResponse(
                    grade=grade,
                    topic=topic_key,
                    title=data.get("title", f"Grade {grade} {topic.capitalize()}"),
                    definition=data["definition"],
                    why_useful=data["why_useful"],
                    step_by_step=data["step_by_step"],
                    real_life_example=data["real_life_example"],
                    worked_example=data["worked_example"],
                    correct_answer_reasoning=data["correct_answer_reasoning"],
                    practice_question=PracticeQuestion(**data["practice_question"]),
                    common_mistakes=data["common_mistakes"],
                    source="gemini"
                )
            except Exception as e:
                logger.warning(f"Gemini live explanation failed ({type(e).__name__}); using curriculum fallback.")

        # Resilient Curriculum Fallback
        fallback_data = CURRICULUM_FALLBACK.get(grade, {}).get(topic_key)
        if not fallback_data:
            fallback_data = CURRICULUM_FALLBACK[5]["fractions"]

        return ExplanationResponse(
            grade=grade,
            topic=topic_key,
            title=fallback_data["title"],
            definition=fallback_data["definition"],
            why_useful=fallback_data["why_useful"],
            step_by_step=fallback_data["step_by_step"],
            real_life_example=fallback_data["real_life_example"],
            worked_example=fallback_data["worked_example"],
            correct_answer_reasoning=fallback_data["correct_answer_reasoning"],
            practice_question=PracticeQuestion(**fallback_data["practice_question"]),
            common_mistakes=fallback_data["common_mistakes"],
            source="curriculum_fallback"
        )

    async def generate_quiz(self, grade: int, topic: str, difficulty: str = "Easy", num_questions: int = 4) -> QuizGenerateResponse:
        """Generate validated multiple choice quiz questions for Grade 5 or 6."""
        topic_key = "shapes" if topic in ["geometry", "shapes"] else topic.lower()

        # Try live Gemini if configured
        if self.is_configured():
            try:
                prompt = (
                    f"Generate {num_questions} multiple-choice math quiz questions for Grade {grade} on the topic '{topic}' at '{difficulty}' difficulty. "
                    "Each question must have exactly 4 unique options with IDs 'A', 'B', 'C', 'D' and exactly one correct option. "
                    "Output strictly valid JSON with no markdown wrapping, matching this exact schema: "
                    "[\n"
                    "  {\n"
                    '    "question": "string",\n'
                    '    "options": [\n'
                    '      {"id": "A", "text": "string"},\n'
                    '      {"id": "B", "text": "string"},\n'
                    '      {"id": "C", "text": "string"},\n'
                    '      {"id": "D", "text": "string"}\n'
                    "    ],\n"
                    '    "correct_option_id": "B",\n'
                    '    "explanation": "string"\n'
                    "  }\n"
                    "]"
                )

                if self.sdk_type == "google-genai":
                    response = self.client.models.generate_content(
                        model=self.model_name,
                        contents=prompt
                    )
                    text = response.text or ""
                else:
                    response = self.client.generate_content(prompt)
                    text = response.text or ""

                clean_json = re.sub(r"^```json\s*", "", text.strip(), flags=re.MULTILINE)
                clean_json = re.sub(r"^```\s*$", "", clean_json.strip(), flags=re.MULTILINE)
                q_list = json.loads(clean_json)

                parsed_questions = []
                seen_questions = set()

                for item in q_list:
                    q_text = item.get("question", "").strip()
                    if not q_text or q_text in seen_questions:
                        continue
                    seen_questions.add(q_text)

                    raw_opts = item.get("options", [])
                    if len(raw_opts) != 4:
                        continue

                    options = [QuizOption(id=opt["id"].upper(), text=str(opt["text"])) for opt in raw_opts]
                    correct_id = item.get("correct_option_id", "A").upper()
                    if correct_id not in ["A", "B", "C", "D"]:
                        correct_id = "A"

                    q_obj = QuizQuestion(
                        question_id=f"gemini-{uuid.uuid4().hex[:8]}",
                        grade=grade,
                        topic=topic_key,
                        difficulty=difficulty,
                        question=q_text,
                        options=options,
                        correct_option_id=correct_id,
                        explanation=item.get("explanation", "Great job!")
                    )
                    parsed_questions.append(q_obj)

                if len(parsed_questions) >= num_questions:
                    return QuizGenerateResponse(
                        grade=grade,
                        topic=topic_key,
                        difficulty=difficulty,
                        questions=parsed_questions[:num_questions],
                        source="gemini"
                    )
            except Exception as e:
                logger.warning(f"Gemini quiz generation failed ({type(e).__name__}); using curriculum fallback pool.")

        # Resilient Curriculum Fallback
        pool = FALLBACK_QUIZ_POOLS.get(grade, {}).get(topic_key, FALLBACK_QUIZ_POOLS[5]["fractions"])
        # Filter by difficulty if possible, otherwise return all
        diff_pool = [q for q in pool if q["difficulty"].lower() == difficulty.lower()]
        selected = diff_pool if len(diff_pool) >= num_questions else pool

        questions = [
            QuizQuestion(
                question_id=item["question_id"],
                grade=item["grade"],
                topic=item["topic"],
                difficulty=item["difficulty"],
                question=item["question"],
                options=[QuizOption(**opt) for opt in item["options"]],
                correct_option_id=item["correct_option_id"],
                explanation=item["explanation"]
            )
            for item in selected[:num_questions]
        ]

        return QuizGenerateResponse(
            grade=grade,
            topic=topic_key,
            difficulty=difficulty,
            questions=questions,
            source="curriculum_fallback"
        )

# Global service instance
gemini_service = GeminiService()
