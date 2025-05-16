import sys, subprocess, atexit, signal, time, requests, webview
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from backend.api import api   # your FastAPI()

DEV = True

# 1) CORS setup
if DEV:
    ui_url = "http://127.0.0.1:5173"
else:
    api.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")
    ui_url = "http://127.0.0.1:8000"

# 2) start Vite
if DEV:
    vite = subprocess.Popen(
        ["npm","run","dev","--","--port","5173","--host","127.0.0.1"],
        cwd=str(Path(__file__).parent/"frontend"),
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    atexit.register(lambda: vite.terminate())

# 3) start Uvicorn via subprocess (so --reload works)
uvicorn_proc = subprocess.Popen([
    sys.executable, "-m", "uvicorn",
    "backend.api:api",
    "--reload",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--log-level", "warning",
], cwd=str(Path(__file__).parent))
atexit.register(lambda: uvicorn_proc.terminate())

# 4) wait for UI and API
def wait_on(url, timeout=15):
    end = time.time() + timeout
    while time.time() < end:
        try:
            requests.get(url, timeout=1)
            return
        except:
            time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for {url}")

wait_on(ui_url)
wait_on("http://127.0.0.1:8000/ping")

# 5) launch WebView
webview.create_window("Orbital Notes", ui_url)
webview.start(debug=True)
