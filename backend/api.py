from fastapi import FastAPI
from .routers import db, settings, ai


api = FastAPI(title="Orbital Notes API",
    docs_url=None,          # no /docs UI
    redoc_url=None,         # no /redoc UI
    openapi_url=None        # don’t pre-build openapi.json
)

api.include_router(db.router)
api.include_router(settings.router)
api.include_router(ai.router)

# ── simple health check -------------------------------------------------
@api.get("/ping")
def ping():
    return {"msg": "pong"}