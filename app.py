#!/usr/bin/env python3
import subprocess
import os
import sys
import time
import requests
import webview
import signal
from pathlib import Path
from threading import Thread
import uvicorn

DEV_MODE = True
FRONTEND_DIR = Path(__file__).parent / "frontend"
BUILD_DIR = FRONTEND_DIR / "build"

# make these globals so our handler can see them
vite_proc = None
api_proc = None

# 1) on Ctrl-C, close the WebView AND kill both servers
def _on_sigint(sig, frame):
    webview.destroy_window()
    if vite_proc:
        os.killpg(os.getpgid(vite_proc.pid), signal.SIGINT)
    if api_proc:
        os.killpg(os.getpgid(api_proc.pid), signal.SIGINT)
    sys.exit(0)

signal.signal(signal.SIGINT, _on_sigint)

def run_api_prod():
    from backend.api import api
    from fastapi.staticfiles import StaticFiles
    api.mount("/", StaticFiles(directory=str(BUILD_DIR), html=True), name="static")
    uvicorn.run(api, host="127.0.0.1", port=8000)

def start_servers():
    global vite_proc, api_proc

    if DEV_MODE:
        vite_proc = subprocess.Popen(
            ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"],
            cwd=str(FRONTEND_DIR),
            stdout=sys.stdout, stderr=sys.stderr
        )
        api_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "backend.api:api",
             "--reload", "--host", "127.0.0.1", "--port", "8000"],
            cwd=str(Path(__file__).parent),
            stdout=sys.stdout, stderr=sys.stderr
        )
        # wait until both servers are up
        for url in ("http://127.0.0.1:5173", "http://127.0.0.1:8000/ping"):
            while True:
                try:
                    requests.get(url, timeout=1)
                    break
                except Exception:
                    time.sleep(0.1)
        return vite_proc, api_proc, "http://127.0.0.1:5173"

    else:
        Thread(target=run_api_prod, daemon=True).start()
        api_url = "http://127.0.0.1:8000"
        while True:
            try:
                requests.get(api_url, timeout=1)
                break
            except Exception:
                time.sleep(0.1)
        return None, None, api_url

def cleanup(proc):
    if not proc:
        return
    try:
        pg = os.getpgid(proc.pid)
        os.killpg(pg, signal.SIGINT)
    except Exception:
        pass
    proc.wait()

if __name__ == "__main__":
    vite_proc, api_proc, frontend_url = start_servers()
    webview.create_window("Orbital Notes", frontend_url, width=1024, height=768, resizable=True)
    webview.start(debug=True)

    # if user closes the window normally (not via Ctrl-C)
    cleanup(vite_proc)
    cleanup(api_proc)
    print("✅ Cleanup complete. Exiting.")
    sys.exit(0)
