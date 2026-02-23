"""Test core services: scoring and lead processing."""
from __future__ import annotations
from app.models.lead import Lead
from app.services.scoring import compute_score, DEFAULT_RULES


def test_scoring_full_lead():
    """A lead with all fields should score high."""
    lead = Lead(
        email="test@test.com",
        phone="+15551234567",
        first_name="Jane",
        last_name="Doe",
        source="meta_ads",
        utm_campaign="spring",
    )
    score = compute_score(lead)
    # email(10) + phone(10) + first_name(5) + last_name(5) + meta_ads(15) + utm_campaign(5) = 50
    assert score == 50


def test_scoring_minimal_lead():
    """A lead with only email should score low."""
    lead = Lead(email="test@test.com", source="manual")
    score = compute_score(lead)
    assert score == 10  # email only


def test_scoring_custom_rules():
    """Custom rules should override defaults."""
    lead = Lead(email="test@test.com", source="referral")
    rules = [{"field": "source", "condition": "equals", "value": "referral", "points": 50}]
    score = compute_score(lead, rules)
    assert score == 50


def test_scoring_capped_at_100():
    """Score should never exceed 100."""
    lead = Lead(email="a", phone="b", first_name="c", last_name="d", source="meta_ads", utm_campaign="e")
    rules = [{"field": "email", "condition": "exists", "points": 80}] * 5  # 400 potential points
    score = compute_score(lead, rules)
    assert score == 100
