<?php

require_once __DIR__ . '/../db_helper.php';
require_once __DIR__ . '/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Method not allowed. Use POST.', 405);
}

/*
|--------------------------------------------------------------------------
| Čitanje JSON bodyja
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Čitanje polja
|--------------------------------------------------------------------------
*/

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$passwordConfirmation = $data['password_confirmation'] ?? '';

/*
|--------------------------------------------------------------------------
| Validacija korisničkog imena
|--------------------------------------------------------------------------
*/

if ($username === '') {
    error('The username field is required.', 422);
}

if (mb_strlen($username) < 3) {
    error(
        'The username must contain at least 3 characters.',
        422
    );
}

if (mb_strlen($username) > 50) {
    error(
        'The username may not be longer than 50 characters.',
        422
    );
}

/*
 * Dopuštamo:
 *
 * - slova
 * - brojeve
 * - donju crtu
 * - crticu
 */
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
    error(
        'The username may contain only letters, numbers, underscores and hyphens.',
        422
    );
}

/*
|--------------------------------------------------------------------------
| Validacija lozinke
|--------------------------------------------------------------------------
*/

if ($password === '') {
    error('The password field is required.', 422);
}

if (strlen($password) < 6) {
    error(
        'The password must contain at least 6 characters.',
        422
    );
}

if (strlen($password) > 255) {
    error(
        'The password may not be longer than 255 characters.',
        422
    );
}

if ($passwordConfirmation === '') {
    error(
        'The password confirmation field is required.',
        422
    );
}

if ($password !== $passwordConfirmation) {
    error(
        'The password confirmation does not match.',
        422
    );
}

/*
|--------------------------------------------------------------------------
| Spajanje na bazu
|--------------------------------------------------------------------------
*/

$conn = Database::getInstance()->getConnection();

/*
|--------------------------------------------------------------------------
| Provjera postoji li korisničko ime
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare(
    'SELECT id
     FROM usernames
     WHERE username = ?
     LIMIT 1'
);

$stmt->bind_param('s', $username);
$stmt->execute();

$result = $stmt->get_result();
$existingUser = $result->fetch_assoc();

$stmt->close();

if ($existingUser) {
    error('The username is already taken.', 409);
}

/*
|--------------------------------------------------------------------------
| Spremanje novog korisnika
|--------------------------------------------------------------------------
|
| Trenutačna web-aplikacija koristi MD5.
| Ovo ostavljamo radi kompatibilnosti s postojećim loginom.
*/

$passwordHash = md5($password);

$stmt = $conn->prepare(
    'INSERT INTO usernames (username, passwordHash)
     VALUES (?, ?)'
);

$stmt->bind_param(
    'ss',
    $username,
    $passwordHash
);

$stmt->execute();

$newUserId = $stmt->insert_id;

$stmt->close();

/*
|--------------------------------------------------------------------------
| Odgovor
|--------------------------------------------------------------------------
*/

success(
    [
        'user' => [
            'id' => (int) $newUserId,
            'username' => $username
        ]
    ],
    'Registration successful.',
    201
);