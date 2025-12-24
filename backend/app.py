import os
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_PORT = int(os.getenv('SMTP_PORT', '465'))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASS = os.getenv('SMTP_PASS')
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'false').lower() in ('1', 'true', 'yes')
TO_EMAIL = os.getenv('TO_EMAIL', 'contact.noornext@gmail.com')
FROM_EMAIL = os.getenv('FROM_EMAIL', SMTP_USER or f'no-reply@{os.getenv("SERVER_NAME","localhost")}')

app = Flask(__name__)
CORS(app)


def send_email(subject: str, body: str, attachment: bytes = None, attachment_name: str = None, sender: str = FROM_EMAIL, recipient: str = TO_EMAIL):
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = recipient
    msg.set_content(body)

    if attachment and attachment_name:
        msg.add_attachment(attachment, maintype='application', subtype='pdf', filename=attachment_name)

    if SMTP_USE_TLS and SMTP_PORT != 465:
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)
        smtp.quit()
    else:
        # SMTPS (SSL) on port 465
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as smtp:
            if SMTP_USER and SMTP_PASS:
                smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)


def _validate_file(file_storage):
    if not file_storage:
        return False, 'Missing file'
    if file_storage.mimetype != 'application/pdf':
        return False, 'Only PDF resumes are accepted'
    # size limit 10MB
    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(0)
    if size > 10 * 1024 * 1024:
        return False, 'Resume must be smaller than 10MB'
    return True, ''


@app.route('/apply/job', methods=['POST'])
def apply_job():
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    note = request.form.get('note', '').strip()
    job_title = request.form.get('job_title', '').strip()
    resume = request.files.get('resume')

    if not name or not email or not note or not resume:
        return jsonify({'error': 'Missing required fields'}), 400

    ok, reason = _validate_file(resume)
    if not ok:
        return jsonify({'error': reason}), 400

    attachment_bytes = resume.read()
    subject = f'Job application: {job_title or "(unknown)"} — {name}'
    body = f"Name: {name}\nEmail: {email}\nJob: {job_title}\n\nNote:\n{note}\n"

    try:
        send_email(subject, body, attachment=attachment_bytes, attachment_name=resume.filename)
        return jsonify({'ok': True, 'message': 'Application sent'}), 200
    except Exception as e:
        app.logger.exception('Failed to send email')
        return jsonify({'error': 'Failed to send email', 'details': str(e)}), 500


@app.route('/apply/internship', methods=['POST'])
def apply_internship():
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    college = request.form.get('college', '').strip()
    note = request.form.get('note', '').strip()
    internship_title = request.form.get('internship_title', '').strip()
    resume = request.files.get('resume')

    if not name or not email or not college or not note or not resume:
        return jsonify({'error': 'Missing required fields'}), 400

    ok, reason = _validate_file(resume)
    if not ok:
        return jsonify({'error': reason}), 400

    attachment_bytes = resume.read()
    subject = f'Internship application: {internship_title or "(unknown)"} — {name}'
    body = f"Name: {name}\nEmail: {email}\nCollege/Organization: {college}\nInternship: {internship_title}\n\nNote:\n{note}\n"

    try:
        send_email(subject, body, attachment=attachment_bytes, attachment_name=resume.filename)
        return jsonify({'ok': True, 'message': 'Application sent'}), 200
    except Exception as e:
        app.logger.exception('Failed to send email')
        return jsonify({'error': 'Failed to send email', 'details': str(e)}), 500


@app.route('/apply/collaboration', methods=['POST'])
def apply_collaboration():
    organization = request.form.get('organization', '').strip()
    contact = request.form.get('contact', '').strip()
    designation = request.form.get('designation', '').strip()
    email = request.form.get('email', '').strip()
    message = request.form.get('message', '').strip()

    if not organization or not contact or not designation or not email or not message:
        return jsonify({'error': 'Missing required fields'}), 400

    subject = f'Collaboration inquiry: {organization} — {contact}'
    body = f"Organization: {organization}\nContact Name: {contact}\nDesignation: {designation}\nEmail: {email}\n\nMessage:\n{message}\n"

    try:
        send_email(subject, body)
        return jsonify({'ok': True, 'message': 'Collaboration inquiry sent'}), 200
    except Exception as e:
        app.logger.exception('Failed to send email')
        return jsonify({'error': 'Failed to send email', 'details': str(e)}), 500


if __name__ == '__main__':
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '5000'))
    app.run(host=host, port=port, debug=os.getenv('FLASK_DEBUG', '0') == '1')
