import httpx
import os
from config import RESEND_API_KEY, FROM_EMAIL


async def send_email(to: str, subject: str, html: str):
    """Send email via Resend API."""
    print(f"[EMAIL DEBUG] send_email called")
    print(f"[EMAIL DEBUG] RESEND_API_KEY present: {bool(RESEND_API_KEY)}")
    print(f"[EMAIL DEBUG] FROM_EMAIL: {FROM_EMAIL}")
    print(f"[EMAIL DEBUG] To: {to} | Subject: {subject}")

    if not RESEND_API_KEY:
        print(f"[EMAIL SKIP] No API key. Would send to {to}: {subject}")
        return

    async with httpx.AsyncClient() as client:
        print(f"[EMAIL DEBUG] Sending request to Resend API...")
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            },
        )
        print(f"[EMAIL DEBUG] Response status: {response.status_code}")
        print(f"[EMAIL DEBUG] Response body: {response.text}")

        if response.status_code != 200:
            print(f"[EMAIL ERROR] {response.status_code}: {response.text}")
        else:
            print(f"[EMAIL SENT] To: {to} | Subject: {subject}")


async def send_approval_email(visitor_email: str, visitor_name: str, otp: str):
    print(f"[EMAIL DEBUG] send_approval_email called for {visitor_name} at {visitor_email}")
    await send_email(
        to=visitor_email,
        subject="Your Visit Has Been Approved ✅",
        html=f"""
        <h2>Welcome, {visitor_name}!</h2>
        <p>Your visit request has been <strong>approved</strong>.</p>
        <p>Your check-in OTP is: <strong style="font-size:24px">{otp}</strong></p>
        <p>Please show this OTP to the security guard at the gate.</p>
        """,
    )


async def send_rejection_email(visitor_email: str, visitor_name: str):
    print(f"[EMAIL DEBUG] send_rejection_email called for {visitor_name} at {visitor_email}")
    await send_email(
        to=visitor_email,
        subject="Your Visit Request Was Rejected ❌",
        html=f"""
        <h2>Hello, {visitor_name}</h2>
        <p>Unfortunately, your visit request has been <strong>rejected</strong> by the host.</p>
        <p>Please contact the host directly for more information.</p>
        """,
    )


async def send_overstay_alert_email(host_email: str, visitor_name: str, minutes_over: int):
    print(f"[EMAIL DEBUG] send_overstay_alert_email called for {visitor_name}")
    await send_email(
        to=host_email,
        subject="⚠️ Visitor Overstay Alert",
        html=f"""
        <h2>Overstay Alert</h2>
        <p>Your visitor <strong>{visitor_name}</strong> has overstayed by <strong>{minutes_over} minutes</strong>.</p>
        <p>Please take necessary action.</p>
        """,
    )