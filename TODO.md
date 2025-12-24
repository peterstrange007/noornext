# Backend Setup for Job and Internship Form Submissions

## Completed Tasks

- [x] Verified existing Flask backend in `backend/app.py` with endpoints `/apply/job` and `/apply/internship`
- [x] Confirmed backend sends emails to 'contact.noornext@gmail.com' by default
- [x] Created `backend/passenger_wsgi.py` for cPanel deployment
- [x] Updated `backend/README.md` with cPanel deployment instructions
- [x] Added `window.BACKEND_URL` script to `job.html` and `internship-detail.html` (set to placeholder URL)

## Remaining Tasks

- [ ] Deploy the backend on cPanel:
  - Upload `backend/` directory to cPanel via File Manager or FTP
  - In cPanel, go to **Setup Python App** under **Software**
  - Create a new Python application with Python 3.8+, root `/home/yourusername/backend`, URL e.g., `api.yourdomain.com`, startup file `passenger_wsgi.py`
  - Install dependencies: `pip install -r requirements.txt`
  - Set environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, etc.
  - Restart the Python app
- [ ] Update `window.BACKEND_URL` in `job.html` and `internship-detail.html` to the actual deployed backend URL (e.g., `https://api.yourdomain.com`)
- [ ] Test the form submissions to ensure emails are received at 'contact.noornext@gmail.com'
- [ ] Optionally, restrict CORS origins in `backend/app.py` for production security

## Notes

- The backend uses Python Flask and is configured for production deployment on cPanel using Passenger WSGI.
- SMTP credentials are required for email functionality; set them in cPanel's Python app environment variables.
- The static site (HTML, CSS, JS) should already be deployed via the existing `.cpanel.yml` configuration.
