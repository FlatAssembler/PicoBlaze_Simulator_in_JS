<?php

require_once __DIR__ . '/auth.php';

$user = requireLogin();
$conn = Database::getInstance()->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

/*
|--------------------------------------------------------------------------
| GET /api/programs.php
|--------------------------------------------------------------------------
| Vraća sve programe trenutačno prijavljenog korisnika.
*/
if ($method === 'GET') {

    $stmt = $conn->prepare(
        'SELECT
            id,
            title,
            code,
            created_at,
            updated_at
         FROM user_programs
         WHERE user_id = ?
         ORDER BY updated_at DESC, id DESC'
    );

    $userId = $user['id'];

    $stmt->bind_param('i', $userId);
    $stmt->execute();

    $result = $stmt->get_result();

    $programs = [];

    while ($row = $result->fetch_assoc()) {
        $programs[] = [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'code' => $row['code'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }

    $stmt->close();

    success(
        [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username']
            ],
            'programs' => $programs,
            'count' => count($programs)
        ],
        'Programs retrieved successfully.'
    );
}

/*
|--------------------------------------------------------------------------
| POST /api/programs.php
|--------------------------------------------------------------------------
| Dodaje novi program trenutačno prijavljenom korisniku.
|
| Očekivani JSON:
|
| {
|     "title": "Naziv programa",
|     "code": "LOAD s0, 01"
| }
*/
if ($method === 'POST') {

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

    $title = trim($data['title'] ?? '');
    $code = trim($data['code'] ?? '');

    if ($title === '') {
        error('The title field is required.', 422);
    }

    if ($code === '') {
        error('The code field is required.', 422);
    }

    if (mb_strlen($title) > 255) {
        error('The title may not be longer than 255 characters.', 422);
    }

    $conn->query(<<<SQL
CREATE TABLE IF NOT EXISTS user_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_programs_user
        FOREIGN KEY (user_id)
        REFERENCES usernames(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
SQL);

    $stmt = $conn->prepare(
        'INSERT INTO user_programs (user_id, title, code)
         VALUES (?, ?, ?)'
    );

    $userId = $user['id'];

    $stmt->bind_param(
        'iss',
        $userId,
        $title,
        $code
    );

    $stmt->execute();

    $programId = $conn->insert_id;

    $stmt->close();

    $stmt = $conn->prepare(
        'SELECT
            id,
            title,
            code,
            created_at,
            updated_at
         FROM user_programs
         WHERE id = ? AND user_id = ?
         LIMIT 1'
    );

    $stmt->bind_param(
        'ii',
        $programId,
        $userId
    );

    $stmt->execute();

    $result = $stmt->get_result();
    $program = $result->fetch_assoc();

    $stmt->close();

    if (!$program) {
        error('The program was saved, but could not be retrieved.', 500);
    }

    http_response_code(201);

    echo json_encode(
        [
            'success' => true,
            'message' => 'Program created successfully.',
            'data' => [
                'program' => [
                    'id' => (int) $program['id'],
                    'title' => $program['title'],
                    'code' => $program['code'],
                    'created_at' => $program['created_at'],
                    'updated_at' => $program['updated_at']
                ]
            ]
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit();
}

/*
|--------------------------------------------------------------------------
| Nedopuštena HTTP metoda
|--------------------------------------------------------------------------
*/
error('Method not allowed. Use GET or POST.', 405);
