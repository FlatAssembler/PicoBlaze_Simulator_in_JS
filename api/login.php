<?php

require_once __DIR__ . '/../db_helper.php';
require_once __DIR__ . '/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Method not allowed. Use POST.', 405);
}

$rawBody = file_get_contents('php://input');

if ($rawBody === false || trim($rawBody) === '') {
    error('Request body is empty.', 400);
}

$data = json_decode($rawBody, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error('Invalid JSON body.', 400);
}

if (!is_array($data)) {
    error('JSON body must be an object.', 400);
}

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if ($username === '') {
    error('The username field is required.', 422);
}

if ($password === '') {
    error('The password field is required.', 422);
}

$conn = Database::getInstance()->getConnection();

$stmt = $conn->prepare(
    'SELECT id, username, passwordHash
     FROM usernames
     WHERE username = ?
     LIMIT 1'
);

$stmt->bind_param('s', $username);
$stmt->execute();

$result = $stmt->get_result();
$user = $result->fetch_assoc();

$stmt->close();

/*
 * Namjerno vraćamo istu poruku za nepostojećeg korisnika
 * i pogrešnu lozinku.
 */
if (!$user) {
    error('Invalid username or password.', 401);
}

/*
 * Trenutačna web-registracija koristi MD5.
 * To ostavljamo privremeno radi kompatibilnosti.
 */
$passwordHash = md5($password);

if (!hash_equals($user['passwordHash'], $passwordHash)) {
    error('Invalid username or password.', 401);
}

/*
 * Generiramo 32 slučajna bajta i pretvaramo ih
 * u token od 64 heksadecimalna znaka.
 */
$plainToken = bin2hex(random_bytes(32));

/*
 * U bazu spremamo samo hash tokena.
 */
$tokenHash = hash('sha256', $plainToken);

/*
 * Token vrijedi 7 dana.
 */
$expiresAt = date(
    'Y-m-d H:i:s',
    time() + (7 * 24 * 60 * 60)
);

/*
 * Po želji brišemo istekle tokene ovog korisnika.
 */
$stmt = $conn->prepare(
    'DELETE FROM api_tokens
     WHERE user_id = ? AND expires_at <= NOW()'
);

$userId = (int) $user['id'];

$stmt->bind_param('i', $userId);
$stmt->execute();
$stmt->close();

/*
 * Spremanje novog tokena.
 */
$stmt = $conn->prepare(
    'INSERT INTO api_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)'
);

$stmt->bind_param(
    'iss',
    $userId,
    $tokenHash,
    $expiresAt
);

$stmt->execute();
$stmt->close();

success(
    [
        'token' => $plainToken,
        'token_type' => 'Bearer',
        'expires_at' => $expiresAt,
        'user' => [
            'id' => $userId,
            'username' => $user['username']
        ]
    ],
    'Login successful.'
);