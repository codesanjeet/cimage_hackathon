from models import Visitor, Alert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from google import genai
import os
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCgsvgfaRJfxkJ09V5RH6w4q2IYQGFxubM")


async def analyze_visitor(db: AsyncSession, visitor_id: int) -> dict:
    result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
    visitor = result.scalar_one_or_none()

    if not visitor:
        return {"error": "Visitor not found"}

    alerts_result = await db.execute(
        select(Alert).where(Alert.visitor_id == visitor_id)
    )
    alerts = alerts_result.scalars().all()

    # ── Build raw context ──────────────────────────────────────
    elapsed_minutes = 0
    if visitor.check_in_time:
        elapsed_minutes = int(
            (datetime.utcnow() - visitor.check_in_time).total_seconds() / 60
        )

    alert_list = [
        {"type": a.type, "message": a.message, "resolved": a.resolved}
        for a in alerts
    ]

    visitor_context = {
        "name": visitor.name,
        "phone": visitor.phone,
        "email": visitor.email or "Not provided",
        "purpose": visitor.purpose,
        "status": visitor.status,
        "check_in_time": str(visitor.check_in_time) if visitor.check_in_time else "Not checked in",
        "expected_duration_minutes": visitor.expected_minutes,
        "actual_time_inside_minutes": elapsed_minutes,
        "overstayed_by_minutes": max(0, elapsed_minutes - visitor.expected_minutes),
        "alerts": alert_list,
        "alert_count": len(alert_list),
        "has_blacklist_alert": any(a["type"] == "blacklist" for a in alert_list),
        "has_overstay_alert": any(a["type"] == "overstay" for a in alert_list),
    }

    # ── Call Gemini ────────────────────────────────────────────
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = f"""
You are a campus security AI analyst. Analyze the following visitor data and return a JSON risk assessment.

VISITOR DATA:
{json.dumps(visitor_context, indent=2)}

Return ONLY a valid JSON object with exactly these fields:
{{
  "risk_score": <integer 0-100>,
  "risk_level": <"LOW" | "MEDIUM" | "HIGH">,
  "suspicious_notes": [<list of specific, detailed observations about this visitor>],
  "recommendation": <a detailed, specific security recommendation — minimum 2 sentences, tailored to this visitor's exact situation>,
  "summary": <2-3 sentence human-readable summary of the overall risk assessment>
}}

Rules:
- risk_score 0-30 = LOW, 31-65 = MEDIUM, 66-100 = HIGH
- suspicious_notes must be specific to THIS visitor's data, not generic
- recommendation must be actionable and specific — never say just "monitor" or "escalate", explain exactly what to do
- If visitor has blacklist alert, risk_score must be >= 80
- If overstayed > 60 minutes, risk_score must be >= 60
- Return ONLY the JSON, no markdown, no explanation
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw = response.text.strip()
        # Strip markdown code fences if Gemini adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        ai_result = json.loads(raw)

        return {
            "visitor_id": visitor_id,
            "visitor_name": visitor.name,
            "visitor_photo": getattr(visitor, "photo_url", None),
            "phone": visitor.phone,
            "status": visitor.status,
            "purpose": visitor.purpose,
            "time_inside_minutes": elapsed_minutes,
            "expected_minutes": visitor.expected_minutes,
            "risk_score": ai_result.get("risk_score", 0),
            "risk_level": ai_result.get("risk_level", "LOW"),
            "suspicious_notes": ai_result.get("suspicious_notes", []),
            "recommendation": ai_result.get("recommendation", ""),
            "summary": ai_result.get("summary", ""),
            "powered_by": "gemini-2.5-flash",
        }

    except Exception as e:
        # Fallback to heuristic if Gemini fails
        print(f"[AI ERROR] Gemini failed: {e}, falling back to heuristic")
        return _heuristic_fallback(visitor, alerts, elapsed_minutes, visitor_id)


def _heuristic_fallback(visitor, alerts, elapsed_minutes, visitor_id) -> dict:
    risk_score = 0
    notes = []

    overstay = max(0, elapsed_minutes - visitor.expected_minutes)
    if overstay > 0:
        risk_score += min(40 + overstay // 10, 60)
        notes.append(
            f"Visitor has been inside for {elapsed_minutes} minutes — "
            f"{overstay} minutes beyond the approved {visitor.expected_minutes}-minute window."
        )

    for alert in alerts:
        if alert.type == "blacklist":
            risk_score += 60
            notes.append(f"BLACKLIST MATCH: {alert.message}")
        elif alert.type == "overstay":
            risk_score += 15
            notes.append(f"Repeat overstay pattern detected: {alert.message}")
        elif alert.type == "suspicious":
            risk_score += 25
            notes.append(f"Previously flagged as suspicious: {alert.message}")

    if not visitor.email:
        risk_score += 5
        notes.append("No email address on record — identity verification is limited to phone only.")

    risk_score = min(risk_score, 100)

    if risk_score >= 66:
        risk_level = "HIGH"
        recommendation = (
            f"Immediately dispatch security personnel to locate {visitor.name}. "
            f"Visitor has been on campus for {elapsed_minutes} minutes with active blacklist/overstay flags. "
            "Do not allow re-entry until admin review is complete."
        )
    elif risk_score >= 31:
        risk_level = "MEDIUM"
        recommendation = (
            f"Contact host to verify {visitor.name}'s continued presence on campus. "
            f"If host cannot confirm, request visitor to report to the security desk within 15 minutes."
        )
    else:
        risk_level = "LOW"
        recommendation = (
            f"Visitor {visitor.name} appears low-risk based on current data. "
            "Continue standard monitoring protocols."
        )

    return {
        "visitor_id": visitor_id,
        "visitor_name": visitor.name,
        "visitor_photo": getattr(visitor, "photo_url", None),
        "phone": visitor.phone,
        "status": visitor.status,
        "purpose": visitor.purpose,
        "time_inside_minutes": elapsed_minutes,
        "expected_minutes": visitor.expected_minutes,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "suspicious_notes": notes,
        "recommendation": recommendation,
        "summary": f"{visitor.name} is currently {visitor.status} on campus. Risk assessment based on {len(alerts)} alert(s) and visit duration data.",
        "powered_by": "heuristic-fallback",
    }