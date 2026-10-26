import pytest
import asyncio
from unittest.mock import MagicMock
from app.gemini_service import GeminiService

def test_gemini_fallback_when_no_key():
    service = GeminiService()
    service.api_key = ""
    service.client = None

    explanation = asyncio.run(service.generate_explanation(5, "fractions"))
    assert explanation.source == "curriculum_fallback"
    assert explanation.grade == 5
    assert explanation.topic == "fractions"
    assert len(explanation.step_by_step) >= 2

def test_gemini_mocked_success():
    service = GeminiService()
    service.api_key = "fake-key"
    service.sdk_type = "google-genai"

    # Mock Gemini client
    mock_response = MagicMock()
    mock_response.text = '''{
        "title": "Fun with Fractions",
        "definition": "A fraction is part of a whole.",
        "why_useful": "Sharing pizza fairly.",
        "step_by_step": ["Look at total slices", "Count eaten slices"],
        "real_life_example": "Eating 1 slice of a 4-slice cake.",
        "worked_example": "1/4 + 1/4 = 2/4 = 1/2",
        "correct_answer_reasoning": "Matching denominators allow adding numerators.",
        "practice_question": {
            "question": "What is 1/2 of 8?",
            "options": ["2", "4", "6", "8"],
            "correct_answer": "4",
            "explanation": "8 divided by 2 is 4."
        },
        "common_mistakes": ["Adding denominators"]
    }'''

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response
    service.client = mock_client

    result = asyncio.run(service.generate_explanation(5, "fractions"))
    assert result.source == "gemini"
    assert result.title == "Fun with Fractions"
    assert result.definition == "A fraction is part of a whole."

def test_gemini_mocked_malformed_json_triggers_safe_fallback():
    service = GeminiService()
    service.api_key = "fake-key"
    service.sdk_type = "google-genai"

    # Mock client returns invalid JSON
    mock_response = MagicMock()
    mock_response.text = "NOT VALID JSON AT ALL"
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response
    service.client = mock_client

    # Should safely fallback without raising unhandled exception
    result = asyncio.run(service.generate_explanation(5, "fractions"))
    assert result.source == "curriculum_fallback"
    assert result.grade == 5
