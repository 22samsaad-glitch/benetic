"""
Configurable lead scoring engine.

Scoring rules are stored in tenant.settings["scoring_rules"] as a list of dicts:
[
    {"field": "email", "condition": "exists", "points": 10},
    {"field": "phone", "condition": "exists", "points": 10},
    {"field": "source", "condition": "equals", "value": "meta_ads", "points": 15},
    {"field": "utm_campaign", "condition": "exists", "points": 5},
]

If no rules are configured, a sensible default is used.
"""
from __future__ import annotations

from app.models.lead import Lead

DEFAULT_RULES = [
    {"field": "email", "condition": "exists", "points": 10},
    {"field": "phone", "condition": "exists", "points": 10},
    {"field": "first_name", "condition": "exists", "points": 5},
    {"field": "last_name", "condition": "exists", "points": 5},
    {"field": "source", "condition": "equals", "value": "meta_ads", "points": 15},
    {"field": "source", "condition": "equals", "value": "google_ads", "points": 15},
    {"field": "source", "condition": "equals", "value": "website", "points": 10},
    {"field": "utm_campaign", "condition": "exists", "points": 5},
]


def compute_score(lead: Lead, rules: list[dict] | None = None) -> int:
    if rules is None:
        rules = DEFAULT_RULES

    score = 0
    for rule in rules:
        field_val = getattr(lead, rule["field"], None)
        condition = rule["condition"]

        if condition == "exists" and field_val:
            score += rule["points"]
        elif condition == "equals" and field_val == rule.get("value"):
            score += rule["points"]
        elif condition == "contains" and field_val and rule.get("value") in str(field_val):
            score += rule["points"]

    return min(score, 100)  # cap at 100
