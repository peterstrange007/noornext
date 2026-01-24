<?php

// existing code
// Simple, fast PHP form handler that sends form data to contact@noornext.com
// Accepts POST fields: name, email, subject, message
// Optional file input name: attachment (must be PDF, max 5 MB)
// Minimal error reporting for debugging; disable in production if needed
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

$name    = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$email   = isset($_POST['email']) ? trim($_POST['email']) : '';
$subject = isset($_POST['subject']) ? trim($_POST['subject']) : 'New contact form submission';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if ($name === '' || $email === '') {
	respond(false, 'Name and email are required', 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
	respond(false, 'Invalid email address', 400);
}

$to = 'contact@noornext.com';
$from_email = 'no-reply@noornext.com';

// sanitize subject length
$subject = preg_replace('/[\r\n]+/', ' ', substr($subject, 0, 78));

$body_plain = "Name: {$name}\nEmail: {$email}\nSubject: {$subject}\n\nMessage:\n{$message}\n\n";
$body_plain .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\nDate: " . date('Y-m-d H:i:s');

// Attachment handling
$hasAttachment = false;
$attachmentContent = '';
$attachmentName = '';
$attachmentMime = '';

if (isset($_FILES['attachment']) && is_array($_FILES['attachment'])) {
	$file = $_FILES['attachment'];
	if ($file['error'] === UPLOAD_ERR_OK) {
		if ($file['size'] > 5 * 1024 * 1024) {
			respond(false, 'Attachment exceeds 5 MB limit', 400);
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

// Prepare headers and message
$headers = [];
$headers[] = "From: Noornext <{$from_email}>";
$headers[] = "Reply-To: {$email}";
$headers[] = 'MIME-Version: 1.0';

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
	$sent = mail($to, $subject, $body, $headers_str);
} else {
	$headers[] = 'Content-Type: text/plain; charset=UTF-8';
	$headers_str = implode("\r\n", $headers);
	$sent = mail($to, $subject, $body_plain, $headers_str);
}

if ($sent) {
	respond(true, 'Message sent successfully');
} else {
	respond(false, 'Failed to send message', 500);
}

