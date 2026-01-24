<?php
<?php

// Unified PHP form handler for contact, job and internship applications.
// Endpoint usage (relative): /backend/form-handler.php?type=contact
//                                         ?type=job
//                                         ?type=internship

error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

function respond($success, $message, $httpCode = 200) {
	http_response_code($httpCode);
	header('Content-Type: application/json; charset=UTF-8');
	echo json_encode(['success' => $success, 'message' => $message]);
	exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond(false, 'Invalid request method', 405);
}

$type = isset($_GET['type']) ? strtolower(trim($_GET['type'])) : 'contact';

$name  = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';

if ($name === '' || $email === '') {
	respond(false, 'Name and email are required', 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
	respond(false, 'Invalid email address', 400);
}

$to = 'contact@noornext.com';
$from_email = 'no-reply@noornext.com';

// Common fields
$note = isset($_POST['note']) ? trim(strip_tags($_POST['note'])) : '';

// job/internship specific
$job_title = isset($_POST['job_title']) ? trim(strip_tags($_POST['job_title'])) : '';
$internship_title = isset($_POST['internship_title']) ? trim(strip_tags($_POST['internship_title'])) : '';
$college = isset($_POST['college']) ? trim(strip_tags($_POST['college'])) : '';

// contact fields
$subject = isset($_POST['subject']) ? trim(strip_tags($_POST['subject'])) : ($type === 'contact' ? 'Website contact' : 'New application');
$message = isset($_POST['message']) ? trim(strip_tags($_POST['message'])) : '';

// Prepare a readable body containing all provided fields
$body_lines = [];
$body_lines[] = "Name: {$name}";
$body_lines[] = "Email: {$email}";
if ($job_title !== '') $body_lines[] = "Job: {$job_title}";
if ($internship_title !== '') $body_lines[] = "Internship: {$internship_title}";
if ($college !== '') $body_lines[] = "College/Organization: {$college}";
if ($note !== '') $body_lines[] = "Note: {$note}";
if ($message !== '') $body_lines[] = "Message: {$message}";
$body_lines[] = "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$body_lines[] = "Date: " . date('Y-m-d H:i:s');

$body_plain = implode("\n", $body_lines) . "\n";

// Accept file fields named 'resume' or 'attachment'
$fileField = null;
if (isset($_FILES['resume'])) $fileField = 'resume';
elseif (isset($_FILES['attachment'])) $fileField = 'attachment';

$hasAttachment = false;
$attachmentContent = '';
$attachmentName = '';
$attachmentMime = '';

if ($fileField !== null) {
	$file = $_FILES[$fileField];
	if ($file['error'] === UPLOAD_ERR_OK) {
		// match front-end constraints: allow up to 10 MB
		if ($file['size'] > 10 * 1024 * 1024) {
			respond(false, 'Attachment exceeds 10 MB limit', 400);
		}

		$finfo = new finfo(FILEINFO_MIME_TYPE);
		$mime = $finfo->file($file['tmp_name']);
		if ($mime !== 'application/pdf') {
			respond(false, 'Only PDF attachments are allowed', 400);
		}

		$data = file_get_contents($file['tmp_name']);
		if ($data === false) {
			respond(false, 'Failed to read uploaded file', 500);
		}

		$attachmentContent = chunk_split(base64_encode($data));
		$attachmentName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($file['name']));
		$attachmentMime = $mime;
		$hasAttachment = true;
	} elseif ($file['error'] !== UPLOAD_ERR_NO_FILE) {
		respond(false, 'File upload error', 400);
	}
}

// Headers
$headers = [];
$headers[] = "From: Noornext <{$from_email}>";
$headers[] = "Reply-To: {$email}";
$headers[] = 'MIME-Version: 1.0';

// Subject sanitize
$safe_subject = preg_replace('/[\r\n]+/', ' ', substr($subject, 0, 78));

if ($hasAttachment) {
	$boundary = 'b1_' . md5(uniqid((string)time(), true));
	$headers[] = "Content-Type: multipart/mixed; boundary=\"{$boundary}\"";

	$body = "This is a multi-part message in MIME format." . "\r\n\r\n";
	$body .= "--{$boundary}\r\n";
	$body .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
	$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
	$body .= $body_plain . "\r\n\r\n";

	$body .= "--{$boundary}\r\n";
	$body .= "Content-Type: {$attachmentMime}; name=\"{$attachmentName}\"\r\n";
	$body .= "Content-Transfer-Encoding: base64\r\n";
	$body .= "Content-Disposition: attachment; filename=\"{$attachmentName}\"\r\n\r\n";
	$body .= $attachmentContent . "\r\n\r\n";
	$body .= "--{$boundary}--\r\n";

	$headers_str = implode("\r\n", $headers);
	$sent = mail($to, $safe_subject, $body, $headers_str);
} else {
	$headers[] = 'Content-Type: text/plain; charset=UTF-8';
	$headers_str = implode("\r\n", $headers);
	$sent = mail($to, $safe_subject, $body_plain, $headers_str);
}

if ($sent) {
	respond(true, 'Message sent successfully');
} else {
	respond(false, 'Failed to send message — server may not be configured to send mail', 500);
}


