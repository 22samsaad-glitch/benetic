import sys
import os

# Add project root to path so `app` package is importable from api/index.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401, E402 — Vercel picks up the `app` ASGI object
