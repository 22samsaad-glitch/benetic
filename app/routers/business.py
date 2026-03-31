from __future__ import annotations

import re
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_current_user, get_current_tenant, get_db
from app.config import settings
from app.models.tenant import User, Tenant
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/business", tags=["business"])


class AnalyzeRequest(BaseModel):
    company_name: str
    website_url: Optional[str] = None
    # Pre-fetched content from the Next.js API route (avoids backend network calls)
    website_text: Optional[str] = None
    detected_site_name: Optional[str] = None


class AnalyzeResponse(BaseModel):
    business_description: str
    primary_audience: str
    message_style: str
    what_you_sell: str
    business_type: str  # "products" or "services"
    url_accessible: bool = True
    detected_site_name: str = ""


def _extract_site_name(soup: "BeautifulSoup") -> str:  # type: ignore[name-defined]
    """Try to extract a business/site name from parsed HTML."""
    # 1. og:site_name
    og = soup.find("meta", property="og:site_name")
    if og and og.get("content", "").strip():
        return og["content"].strip()
    # 2. <title> — take just the first segment before | or -
    title_tag = soup.find("title")
    if title_tag and title_tag.string:
        title = re.split(r"[|\-–—]", title_tag.string)[0].strip()
        if title:
            return title
    # 3. First <h1>
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return h1.get_text(strip=True)
    return ""


async def _fetch_website_data(url: str) -> tuple[str, str]:
    """Fetch website and return (readable_text, detected_site_name)."""
    try:
        import httpx
        from bs4 import BeautifulSoup

        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        site_name = _extract_site_name(soup)

        # Remove scripts, styles, nav, footer
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:3000], site_name
    except Exception:
        return "", ""


def _build_prompt(company_name: str, website_text: str) -> str:
    if website_text:
        context = f"""Website content (scraped directly from their site):
---
{website_text}
---

Use ONLY what is stated in the website content above. Do NOT invent descriptions. Do NOT use generic phrases like "professional services" unless that is literally what they sell."""
    else:
        context = "No website content available. Use the company name to make reasonable inferences."

    return f"""You are analyzing a specific business to configure an automated lead follow-up system.

Company name: {company_name}
{context}

Return a JSON object with exactly these keys (no markdown, just raw JSON):
{{
  "business_description": "1-2 sentences describing specifically what THIS business does, based on the actual website content",
  "primary_audience": "1 sentence describing who their ideal customers are, based on actual content",
  "message_style": "1 sentence on ideal tone for follow-up messages (e.g. 'Energetic and motivational, focused on performance improvement')",
  "what_you_sell": "A specific short phrase (3-8 words) naming their actual core product or service",
  "business_type": "products or services (one word only)"
}}

Be specific to THIS business. Always return valid JSON."""


async def _call_claude(company_name: str, website_text: str) -> AnalyzeResponse:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    prompt = _build_prompt(company_name, website_text)

    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    raw = message.content[0].text.strip()
    # Strip markdown code blocks if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    data = json.loads(raw)

    return AnalyzeResponse(
        business_description=data.get("business_description", ""),
        primary_audience=data.get("primary_audience", ""),
        message_style=data.get("message_style", "Friendly and professional"),
        what_you_sell=data.get("what_you_sell", ""),
        business_type=data.get("business_type", "services").lower().strip(),
        url_accessible=True,
        detected_site_name="",  # filled in by caller
    )


def _fallback_response(company_name: str, url_accessible: bool = True, detected_site_name: str = "") -> AnalyzeResponse:
    return AnalyzeResponse(
        business_description=f"{company_name} provides professional services to help clients achieve their goals.",
        primary_audience="Small and medium-sized businesses looking for quality solutions.",
        message_style="Friendly and professional, focused on building trust and demonstrating value.",
        what_you_sell="Professional services",
        business_type="services",
        url_accessible=url_accessible,
        detected_site_name=detected_site_name,
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_business(
    payload: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    if not payload.company_name.strip():
        raise HTTPException(status_code=422, detail="company_name is required")

    # Use pre-fetched content if provided (from Next.js API route)
    if payload.website_text is not None:
        website_text = payload.website_text
        detected_site_name = payload.detected_site_name or ""
        url_accessible = True
    else:
        website_text = ""
        detected_site_name = ""
        url_was_provided = bool(payload.website_url and payload.website_url.strip())
        if url_was_provided:
            website_text, detected_site_name = await _fetch_website_data(payload.website_url.strip())
        url_accessible = not (url_was_provided and not website_text)

    print(f"[business] ── ANALYZE CALLED ──────────────────────────────")
    print(f"[business] company={payload.company_name!r}")
    print(f"[business] website_text is None: {payload.website_text is None}")
    print(f"[business] website_text_len: {len(website_text)}")
    print(f"[business] detected_site: {detected_site_name!r}")
    print(f"[business] website_text preview: {website_text[:300] if website_text else '(empty)'}")
    print(f"[business] ANTHROPIC_API_KEY set: {bool(settings.ANTHROPIC_API_KEY)} len={len(settings.ANTHROPIC_API_KEY)}")

    if not settings.ANTHROPIC_API_KEY:
        print("[business] ✗ No API key — returning fallback")
        return _fallback_response(payload.company_name.strip(), url_accessible=url_accessible, detected_site_name=detected_site_name)

    try:
        print("[business] → Calling Claude...")
        result = await _call_claude(payload.company_name.strip(), website_text)
        result.url_accessible = url_accessible
        result.detected_site_name = detected_site_name
        print(f"[business] ✓ Claude result: {result.model_dump()}")
        return result
    except Exception as exc:
        print(f"[business] ✗ Claude call failed: {type(exc).__name__}: {exc}")
        return _fallback_response(payload.company_name.strip(), url_accessible=url_accessible, detected_site_name=detected_site_name)


# ---------------------------------------------------------------------------
# Website scraping for qualification rules
# ---------------------------------------------------------------------------

class ScrapeRequest(BaseModel):
    website_url: str


class QualificationRule(BaseModel):
    field: str       # e.g. "service_area", "job_type", "min_budget", "exclusions"
    description: str # human-readable description for the contractor to confirm


class ScrapeResponse(BaseModel):
    company_name: str
    service_area: str
    job_types: list[str]
    min_budget: str
    exclusions: list[str]
    raw_rules: list[QualificationRule]
    website_text_preview: str
    url_accessible: bool


@router.post("/scrape-qualification-rules", response_model=ScrapeResponse)
async def scrape_qualification_rules(
    payload: ScrapeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Scrape the contractor's website and extract qualification rules.
    Returns structured rules for the contractor to confirm during onboarding.
    """
    if not payload.website_url.strip():
        raise HTTPException(422, "website_url is required")

    url = payload.website_url.strip()
    website_text, detected_name = await _fetch_website_data(url)

    if not website_text:
        return ScrapeResponse(
            company_name=detected_name or "",
            service_area="Not found",
            job_types=[],
            min_budget="Not specified",
            exclusions=[],
            raw_rules=[],
            website_text_preview="",
            url_accessible=False,
        )

    if not settings.ANTHROPIC_API_KEY:
        return ScrapeResponse(
            company_name=detected_name or "",
            service_area="Local area (detected from website)",
            job_types=["General contracting"],
            min_budget="Not specified",
            exclusions=[],
            raw_rules=[
                QualificationRule(field="service_area", description="Serves local residential customers"),
                QualificationRule(field="job_types", description="General contracting work"),
            ],
            website_text_preview=website_text[:300],
            url_accessible=True,
        )

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

        prompt = f"""You are analyzing a contractor's website to extract lead qualification rules.

Website content:
---
{website_text[:4000]}
---

Extract the following information from the website. Return ONLY valid JSON with no markdown:

{{
  "company_name": "The business name from the website",
  "service_area": "The geographic area they serve (e.g. 'Austin, TX and surrounding areas')",
  "job_types": ["list", "of", "specific", "job", "types", "they", "handle"],
  "min_budget": "Any minimum job size or budget mentioned, or 'Not specified'",
  "exclusions": ["things", "they", "explicitly", "don't", "do", "e.g. 'no commercial', 'no apartments'"]
}}

Be specific. If information is not found, use reasonable defaults for a contractor.
Return only raw JSON — no explanation, no markdown."""

        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)

        job_types = data.get("job_types", [])
        exclusions = data.get("exclusions", [])
        service_area = data.get("service_area", "Local area")
        min_budget = data.get("min_budget", "Not specified")
        company_name = data.get("company_name", detected_name or "")

        rules: list[QualificationRule] = []
        if service_area:
            rules.append(QualificationRule(field="service_area", description=f"Service area: {service_area}"))
        for jt in job_types:
            rules.append(QualificationRule(field="job_type", description=f"Accepts: {jt}"))
        if min_budget and min_budget != "Not specified":
            rules.append(QualificationRule(field="min_budget", description=f"Minimum job size: {min_budget}"))
        for ex in exclusions:
            rules.append(QualificationRule(field="exclusion", description=f"Does not accept: {ex}"))

        return ScrapeResponse(
            company_name=company_name,
            service_area=service_area,
            job_types=job_types,
            min_budget=min_budget,
            exclusions=exclusions,
            raw_rules=rules,
            website_text_preview=website_text[:300],
            url_accessible=True,
        )

    except Exception as exc:
        logger.error(f"Scrape qualification rules failed: {exc}")
        return ScrapeResponse(
            company_name=detected_name or "",
            service_area="Local area",
            job_types=["General contracting"],
            min_budget="Not specified",
            exclusions=[],
            raw_rules=[
                QualificationRule(field="service_area", description="Serves local residential customers"),
            ],
            website_text_preview=website_text[:300],
            url_accessible=True,
        )


# ---------------------------------------------------------------------------
# Lead qualification check (called by webhook after lead intake)
# ---------------------------------------------------------------------------

class QualifyLeadRequest(BaseModel):
    lead_fields: dict          # flat key/value from the lead form
    qualification_rules: list[str]  # list of rule descriptions the contractor confirmed


class QualifyLeadResponse(BaseModel):
    result: str                # "qualified", "disqualified", "needs_review"
    reason: str
    clarification_question: Optional[str] = None  # populated if needs_review


@router.post("/qualify-lead", response_model=QualifyLeadResponse)
async def qualify_lead(
    payload: QualifyLeadRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Check a lead against the contractor's qualification rules using Claude.
    Returns qualified / disqualified / needs_review.
    """
    if not settings.ANTHROPIC_API_KEY:
        return QualifyLeadResponse(result="qualified", reason="No API key configured — defaulting to qualified")

    rules_text = "\n".join(f"- {r}" for r in payload.qualification_rules)
    lead_text = "\n".join(f"- {k}: {v}" for k, v in payload.lead_fields.items() if v)

    prompt = f"""You are a lead qualification system for a contractor.

Contractor's acceptance rules:
{rules_text}

Lead information submitted:
{lead_text}

Based on the rules and the lead's information, determine if this lead should be:
- "qualified": The lead clearly matches the contractor's rules
- "disqualified": The lead clearly does NOT match (e.g. wrong area, job type not handled)
- "needs_review": Not enough information to decide — specify what clarifying question to ask

Return ONLY valid JSON with no markdown:
{{
  "result": "qualified" | "disqualified" | "needs_review",
  "reason": "1-2 sentence explanation",
  "clarification_question": "The specific question to ask the lead if needs_review, otherwise null"
}}"""

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        return QualifyLeadResponse(
            result=data.get("result", "qualified"),
            reason=data.get("reason", ""),
            clarification_question=data.get("clarification_question"),
        )
    except Exception as exc:
        logger.error(f"Lead qualification failed: {exc}")
        return QualifyLeadResponse(result="qualified", reason="Qualification check failed — defaulting to qualified")


# ---------------------------------------------------------------------------
# Save qualification rules to tenant settings
# ---------------------------------------------------------------------------

class SaveRulesRequest(BaseModel):
    rules: list[str]           # list of confirmed rule description strings
    website_url: Optional[str] = None
    company_name: Optional[str] = None


@router.post("/save-qualification-rules")
def save_qualification_rules(
    payload: SaveRulesRequest,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Save the contractor's confirmed qualification rules to their tenant settings."""
    settings_copy = dict(tenant.settings or {})
    settings_copy["qualification_rules"] = payload.rules
    if payload.website_url:
        settings_copy["website_url"] = payload.website_url
    if payload.company_name:
        settings_copy["company_name"] = payload.company_name
    tenant.settings = settings_copy
    db.commit()
    return {"status": "ok", "rules_saved": len(payload.rules)}
