# app.py  ────────────────────────────────────────────────────────────────
DEV = True                    # ← set to False for production build

import subprocess, atexit, signal, threading, time, requests, uvicorn, webview
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles   import StaticFiles
from backend.app.api           import api        # your FastAPI instance

# ── helper -----------------------------------------------------------------
def wait_on(url, timeout=15):
    end = time.time() + timeout
    while time.time() < end:
        try: requests.get(url, timeout=10); return
        except requests.exceptions.ConnectionError: time.sleep(0.25)
    raise RuntimeError(f"Timed out waiting for {url}")

# ── front-end / CORS -------------------------------------------------------
if DEV:
    vite = subprocess.Popen(
        ["npm", "run", "dev", "--", "--port", "5173", "--host", "127.0.0.1"],
        cwd="frontend",
        stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT
    )
    atexit.register(lambda: vite.send_signal(signal.SIGTERM))

    api.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173"],
        allow_methods=["*"], allow_headers=["*"]
    )
    ui_url = "http://127.0.0.1:5173"
else:
    api.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")
    ui_url = "http://127.0.0.1:8000"

# ── start FastAPI in background -------------------------------------------
threading.Thread(
    target=uvicorn.run,
    kwargs=dict(app=api, host="127.0.0.1", port=8000, log_level="warning"),
    daemon=True
).start()

# ── wait, then show window -------------------------------------------------
wait_on(ui_url)
wait_on("http://127.0.0.1:8000/ping")
webview.create_window("Orbital Notes", ui_url)
webview.start(debug=True)
