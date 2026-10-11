"""RevenueIQ launcher: starts the web app immediately and opens the browser.

On a fresh install the app builds its demo data in the background and the
browser shows a live setup screen, so nothing blocks the window from opening.
"""
import socket
import sys
import threading
import time
import webbrowser

try:  # show messages immediately even when output is redirected
    sys.stdout.reconfigure(line_buffering=True)
except (AttributeError, ValueError):
    pass

try:
    import uvicorn
    import fastapi  # noqa: F401  (fail fast if the environment is incomplete)
except ImportError as exc:  # run.bat reinstalls packages when it sees exit code 3
    print(f"Missing package: {exc.name}")
    sys.exit(3)

from backend import db


def free_port(start=8000, tries=20):
    for port in range(start, start + tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError("No free port found between 8000 and 8020")


def open_browser_when_ready(url, port):
    for _ in range(120):
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                webbrowser.open(url)
                return
        except OSError:
            time.sleep(0.15)


def main():
    print("=" * 60)
    print("  RevenueIQ - Revenue Intelligence Platform")
    print("=" * 60)
    if not db.is_ready():
        print("First run: demo data and the churn model are being built in the background.")
        print("The browser shows the progress - it takes about 20 seconds.\n")
    port = free_port()
    url = f"http://127.0.0.1:{port}"
    print(f"RevenueIQ is running at {url}")
    print("Keep this window open while you use the app. Close it (or press Ctrl+C) to stop.\n")
    if "--no-browser" not in sys.argv:
        threading.Thread(target=open_browser_when_ready, args=(url, port), daemon=True).start()
    uvicorn.run("backend.app:app", host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    main()
