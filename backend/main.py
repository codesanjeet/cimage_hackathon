from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import Base
from core.db import engine

from routers import auth, visitors, dashboard, alerts, ai

app = FastAPI(
    title="Smart Campus VMS",
    description="Intelligent Visitor Management System — Hackathon Edition",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(visitors.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(ai.router)


# DB Init
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.on_event("startup")
async def on_startup():
    await init_db()
    print(" Database tables created.")


@app.get("/", tags=["Health"])
async def root():
    return {"message": "Smart Campus VMS is running 🚀"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}