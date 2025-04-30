from fastapi import APIRouter
import lancedb
from settings import getSettings
router = APIRouter(prefix="/db")

settings = getSettings()

db = None

@router.post("/init")
async def init_db():
    db = await lancedb.connect_async(settings["app_data_dir"]+"/db")
    
    

    
async def get_db():
    global db
    if db is None:
        db = await lancedb.connect_async(settings["app_data_dir"]+"/db")
    return db







