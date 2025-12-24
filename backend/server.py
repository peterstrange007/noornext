"""Production server wrapper for the NoorNext backend.

Usage:
  Set environment variables (see backend/README.md), then:
    python server.py

This script prefers to run the app with `waitress`; if `waitress` is not
installed it falls back to Flask's built-in server (suitable for local testing).
"""
import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', '5000'))

try:
    # import the Flask app
    from app import app
except Exception as e:
    raise RuntimeError('Failed to import Flask app from app.py: ' + str(e))


def run_with_waitress(app, host, port):
    try:
        from waitress import serve
    except Exception:
        return False
    serve(app, host=host, port=port)
    return True


if __name__ == '__main__':
    # Attempt to run using waitress (recommended). Fall back to Flask dev server.
    used = run_with_waitress(app, HOST, PORT)
    if not used:
        print('waitress not available; starting Flask dev server (not for production)')
        app.run(host=HOST, port=PORT)
