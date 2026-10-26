# Website Deployment Notes

## Current form setup

- The website submits contact, collaboration, job, and internship forms to `backend/form-handler.php`.
- The handler sends submissions to `contact@noornext.com` using PHP's `mail()` function.
- Job and internship applications accept PDF attachments up to 10 MB.
- The root `form-handler.php` file is a compatibility entry point that includes the backend handler.

## Deployment checklist

- [ ] Deploy the site to a PHP-enabled web host and include `backend/form-handler.php`.
- [ ] Confirm the host's PHP mail service is configured to send mail from `no-reply@noornext.com` to `contact@noornext.com`.
- [ ] Submit a contact message, collaboration inquiry, job application, and internship application on the deployed site; confirm each reaches the recipient.
- [ ] Confirm HTTPS is enabled so form submissions and uploaded resumes are sent securely.

The `.cpanel.yml` file copies the static site and PHP handler into the cPanel `public_html` directory. This project currently has no Flask application, Passenger WSGI entry point, or separate API URL configured.
