<?php

require_once __DIR__ . '/../db_helper.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Method not allowed. Use POST.', 405);
}

$plainToken = getBearerToken();

if ($plainToken === null) {
    error('Bearer token is required.', 401);
}

$tokenHash = hash('sha256', $plainToken);

$conn = Database::getInstance()->getConnection();

/*
 * Provjeravamo postoji li token i je li još važeći.
 */
$stmt = $conn->prepare(
    'SELECT id
     FROM api_tokens
     WHERE token_hash = ?
       AND expires_at > NOW()
     LIMIT 1'
);

$stmt->bind_param('s', $tokenHash);
$stmt->execute();

$result = $stmt->get_result();
$tokenRecord = $result->fetch_assoc();

$stmt->close();

if (!$tokenRecord) {
    error('Invalid or expired access token.', 401);
}

/*
 * Brišemo samo token kojim je pozvan logout.
 */
$stmt = $conn->prepare(
    'DELETE FROM api_tokens
     WHERE token_hash = ?'
);

$stmt->bind_param('s', $tokenHash);
$stmt->execute();

$deletedRows = $stmt->affected_rows;

$stmt->close();

if ($deletedRows !== 1) {
    error('Logout failed.', 500);
}

success(
    [],
    'Logout successful.'
);