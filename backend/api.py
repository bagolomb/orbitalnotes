from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import db, settings, ai


api = FastAPI(title="Orbital Notes API",
    docs_url=None,          # no /docs UI
    redoc_url=None,         # no /redoc UI
    openapi_url=None        # don’t pre-build openapi.json
)

api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

api.include_router(db.router, prefix="/api")
api.include_router(settings.router, prefix="/api")
api.include_router(ai.router, prefix="/api")

# ── simple health check -------------------------------------------------
@api.get("/ping")
def ping():
    return {"msg": "pong"}