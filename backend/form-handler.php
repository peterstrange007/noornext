<?php

// Unified NoorNext website form handler.
// Supports: contact, collaboration, job applications, internship applications.

error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

function respond($success, $message, $httpCode = 200) {
	http_response_code($httpCode);
	header('Content-Type: application/json; charset=UTF-8');
	echo json_encode(['success' => $success, 'message' => $message]);
	exit;
}

function field($name) {
	return isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
}

function clean_text($value) {
	return trim(strip_tags((string) $value));
}

function clean_header($value, $fallback) {
	$value = trim((string) $value);
	if ($value === '') {
		$value = $fallback;
	}
	return preg_replace('/[\r\n]+/', ' ', substr($value, 0, 120));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond(false, 'Invalid request method', 405);
}

$type = strtolower(clean_text($_GET['type'] ?? 'contact'));
$allowedTypes = ['contact', 'collaboration', 'job', 'internship'];
if (!in_array($type, $allowedTypes, true)) {
	respond(false, 'Unknown form type', 400);
}

$name = clean_text(field('name'));
$email = trim(field('email'));

if ($type === 'collaboration' && $name === '') {
	$name = clean_text(field('contact'));
}

if ($name === '' || $email === '') {
	respond(false, 'Name and email are required', 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
	respond(false, 'Invalid email address', 400);
}

$to = 'contact@noornext.com';
$fromEmail = 'no-reply@noornext.com';

$labels = [
	'organization' => 'Organization',
	'designation' => 'Designation',
	'job_title' => 'Job',
	'internship_title' => 'Internship',
	'college' => 'College / Organization',
	'note' => 'Note',
	'message' => 'Message',
];

$subjectMap = [
	'contact' => 'Website contact message',
	'collaboration' => 'New collaboration inquiry',
	'job' => 'New job application',
	'internship' => 'New internship application',
];

$bodyLines = [
	'Form: ' . ucfirst($type),
	"Name: {$name}",
	"Email: {$email}",
];

foreach ($labels as $key => $label) {
	$value = clean_text(field($key));
	if ($value !== '') {
		$bodyLines[] = "{$label}: {$value}";
	}
}

$bodyLines[] = 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$bodyLines[] = 'Date: ' . date('Y-m-d H:i:s');
$bodyPlain = implode("\n", $bodyLines) . "\n";

$subject = clean_header(field('subject'), $subjectMap[$type]);

$fileField = null;
foreach (['resume', 'attachment'] as $candidate) {
	if (isset($_FILES[$candidate]) && is_array($_FILES[$candidate])) {
		$fileField = $candidate;
		break;
	}
}

$hasAttachment = false;
$attachmentContent = '';
$attachmentName = '';
$attachmentMime = '';

if ($fileField !== null) {
	$file = $_FILES[$fileField];

	if ($file['error'] === UPLOAD_ERR_OK) {
		if ($file['size'] > 10 * 1024 * 1024) {
			respond(false, 'Attachment exceeds the 10 MB limit', 400);
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

$headers = [
	"From: NoorNext <{$fromEmail}>",
	"Reply-To: {$email}",
	'MIME-Version: 1.0',
];

if ($hasAttachment) {
	$boundary = 'nn_' . md5(uniqid((string) time(), true));
	$headers[] = "Content-Type: multipart/mixed; boundary=\"{$boundary}\"";

	$body = "This is a multi-part message in MIME format.\r\n\r\n";
	$body .= "--{$boundary}\r\n";
	$body .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
	$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
	$body .= $bodyPlain . "\r\n";
	$body .= "--{$boundary}\r\n";
	$body .= "Content-Type: {$attachmentMime}; name=\"{$attachmentName}\"\r\n";
	$body .= "Content-Transfer-Encoding: base64\r\n";
	$body .= "Content-Disposition: attachment; filename=\"{$attachmentName}\"\r\n\r\n";
	$body .= $attachmentContent . "\r\n";
	$body .= "--{$boundary}--\r\n";
} else {
	$headers[] = 'Content-Type: text/plain; charset=UTF-8';
	$body = $bodyPlain;
}

$sent = mail($to, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
	respond(false, 'The server could not send email. Please check hosting mail settings.', 500);
}

respond(true, 'Submission received. Thank you!');
