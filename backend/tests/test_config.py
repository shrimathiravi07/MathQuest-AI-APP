import os
import pytest
from app.gemini_service import GeminiService
from app.models import GeminiDiagnosticResponse

def test_config_defaults():
    service = GeminiService()
    assert service.model_name is not None
    assert isinstance(service.model_name, str)

def test_missing_api_key_diagnostics(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    service = GeminiService()
    service.api_key = ""
    diag = service.check_diagnostics()
    assert diag.configured is False
    assert "NO KEY" in diag.live_connection_status
    # Ensure no secret is printed
    assert "AIza" not in diag.message

def test_secret_redaction(monkeypatch):
    dummy_secret = "AIzaSyFakeSecretKeyForTesting12345"
    service = GeminiService()
    service.api_key = dummy_secret
    diag = service.check_diagnostics()
    # Ensure the dummy secret is not present in diagnostic response message
    assert dummy_secret not in diag.message
    assert dummy_secret not in diag.live_connection_status
