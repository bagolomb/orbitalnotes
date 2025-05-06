from fastapi import APIRouter
import json
from pathlib import Path

router = APIRouter(prefix="/settings")

app_data_dir = Path.home() / ".orbitalnotes"


def loadSettingsOrReturnNone():
    try:
        with open(f"{app_data_dir}/settings.json", "r") as f:
            return json.load(f)
    except:
        return None

def loadSettings():
    with open(f"{app_data_dir}/settings.json", "r") as f:
        return json.load(f)

@router.get("/checkIfSettingsExist")
def checkIfSettingsExist():
    return {"exists": loadSettingsOrReturnNone() is not None}

def initAppDataDir():
    if not app_data_dir.exists():
        app_data_dir.mkdir(parents=True, exist_ok=True)

@router.post("/init")
def initSettings():
    initAppDataDir()
    with open(f"{app_data_dir}/settings.json", "w") as f:
        json.dump({
                "theme": "light",
                "app_data_dir": str(app_data_dir)
            }, f)
    return

def getSettings():
    return loadSettings()

def saveSettings(settings):
    with open(f"{app_data_dir}/settings.json", "w") as f:
        json.dump(settings, f)
    
        

