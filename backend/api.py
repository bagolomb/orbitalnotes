from fastapi import FastAPI
from routers import db, settings


api = FastAPI(title="Orbital Notes API")

api.include_router(db.router)
api.include_router(settings.router)

# ── simple health check -------------------------------------------------
@api.get("/ping")
def ping():
    return {"msg": "pong"}