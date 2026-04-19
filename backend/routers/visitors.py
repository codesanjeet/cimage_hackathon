from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from core.db import get_db
from schemas.visitor import VisitorRegister, VisitorOut, CheckInRequest, BlacklistCreate
from schemas.common import ResponseSchema
from services import visitor_service
from models import Blacklist

router = APIRouter(prefix="/visitors", tags=["Visitors"])


@router.post("/register", response_model=ResponseSchema)
async def register_visitor(payload: VisitorRegister, db: AsyncSession = Depends(get_db)):
    visitor = await visitor_service.register_visitor(db, payload)
    return ResponseSchema(
        success=True,
        message="Visitor registered. Pending host approval.",
        data=VisitorOut.model_validate(visitor),
    )


@router.post("/{visitor_id}/approve", response_model=ResponseSchema)
async def approve_visitor(visitor_id: int, db: AsyncSession = Depends(get_db)):
    visitor = await visitor_service.approve_visitor(db, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return ResponseSchema(success=True, message="Visitor approved. OTP sent.", data=VisitorOut.model_validate(visitor))


@router.post("/{visitor_id}/reject", response_model=ResponseSchema)
async def reject_visitor(visitor_id: int, db: AsyncSession = Depends(get_db)):
    visitor = await visitor_service.reject_visitor(db, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return ResponseSchema(success=True, message="Visitor rejected.", data=VisitorOut.model_validate(visitor))


@router.post("/{visitor_id}/checkin", response_model=ResponseSchema)
async def checkin(visitor_id: int, payload: CheckInRequest, db: AsyncSession = Depends(get_db)):
    visitor, msg = await visitor_service.checkin_visitor(db, visitor_id, payload.otp)
    if not visitor:
        raise HTTPException(status_code=400, detail=msg)
    return ResponseSchema(success=True, message=msg, data=VisitorOut.model_validate(visitor))


@router.post("/{visitor_id}/checkout", response_model=ResponseSchema)
async def checkout(visitor_id: int, db: AsyncSession = Depends(get_db)):
    visitor = await visitor_service.checkout_visitor(db, visitor_id)
    if not visitor:
        raise HTTPException(status_code=400, detail="Visitor not found or not currently inside")
    return ResponseSchema(success=True, message="Checked out successfully.", data=VisitorOut.model_validate(visitor))


@router.get("", response_model=ResponseSchema)
async def list_visitors(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    visitors = await visitor_service.get_all_visitors(db, status=status, search=search)
    return ResponseSchema(
        success=True,
        message=f"{len(visitors)} visitors found",
        data=[VisitorOut.model_validate(v) for v in visitors],
    )


@router.get("/active", response_model=ResponseSchema)
async def active_visitors(db: AsyncSession = Depends(get_db)):
    visitors = await visitor_service.get_all_visitors(db, status="inside")
    return ResponseSchema(success=True, message="Active visitors", data=[VisitorOut.model_validate(v) for v in visitors])


@router.get("/{visitor_id}", response_model=ResponseSchema)
async def get_visitor(visitor_id: int, db: AsyncSession = Depends(get_db)):
    visitor = await visitor_service.get_visitor_by_id(db, visitor_id)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return ResponseSchema(success=True, message="Visitor found", data=VisitorOut.model_validate(visitor))


@router.post("/blacklist/add", response_model=ResponseSchema, tags=["Blacklist"])
async def add_to_blacklist(payload: BlacklistCreate, db: AsyncSession = Depends(get_db)):
    entry = Blacklist(phone=payload.phone, reason=payload.reason)
    db.add(entry)
    await db.commit()
    return ResponseSchema(success=True, message="Added to blacklist", data={"phone": payload.phone})