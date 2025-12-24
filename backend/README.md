# NoorNext Backend (form submission)

Simple Flask backend to receive job and internship application forms and send them via SMTP to the configured recipient.

Prerequisites

- Python 3.8+
- Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Environment variables

- `SMTP_HOST` (required)
- `SMTP_PORT` (default: 465)
- `SMTP_USER` (optional)
- `SMTP_PASS` (optional)
- `SMTP_USE_TLS` (optional: true/false) — enables STARTTLS when true and port != 465
- `TO_EMAIL` (default: contact.noornext@gmail.com)
- `FROM_EMAIL` (defaults to `SMTP_USER` or no-reply@localhost)

Run locally

```bash
export SMTP_HOST=smtp.example.com
export SMTP_PORT=465
export SMTP_USER=you@example.com
export SMTP_PASS=supersecret
python app.py
```

Deploy on cPanel

1. Upload the `backend/` directory to your cPanel account (e.g., via File Manager or FTP).
2. In cPanel, go to **Setup Python App** under **Software**.
3. Create a new Python application:
   - **Python version**: 3.8 or higher
   - **Application root**: `/home/yourusername/backend` (adjust path)
   - **Application URL**: Choose a subdomain or path, e.g., `api.yourdomain.com` or `yourdomain.com/backend`
   - **Application startup file**: `passenger_wsgi.py`
4. Install dependencies: In the app's virtual environment, run `pip install -r requirements.txt`.
5. Set environment variables in cPanel's Python App settings or via `.htaccess`:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_USE_TLS` (if needed)
   - `TO_EMAIL=contact.noornext@gmail.com` (already default)
   - `FROM_EMAIL` (optional)
6. Restart the Python app.
7. Update your frontend's `BACKEND_URL` to point to the deployed app URL, e.g., add `<script>window.BACKEND_URL = 'https://api.yourdomain.com';</script>` in your HTML head.

Notes

- The backend expects `resume` as a PDF file (MIME `application/pdf`) and enforces a 10MB limit.
- CORS is enabled for convenience; when deploying, restrict origins.
