<?php

require_once __DIR__ . '/auth.php';

$user = requireLogin();
$conn = Database::getInstance()->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

/*
|--------------------------------------------------------------------------
| Čitanje i provjera ID-a programa
|--------------------------------------------------------------------------
*/

$programId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if ($programId === false || $programId === null || $programId <= 0) {
    error('A valid program ID is required.', 400);
}

$userId = $user['id'];

/*
|--------------------------------------------------------------------------
| Pomoćna funkcija: dohvat programa prijavljenog korisnika
|--------------------------------------------------------------------------
|
| Program se traži istovremeno prema:
|
| - programskom ID-u
| - ID-u prijavljenog korisnika
|
| Tako korisnik ne može dohvatiti tuđi program.
*/

function findUserProgram(
    mysqli $conn,
    int $programId,
    int $userId
): ?array {
    $stmt = $conn->prepare(
        'SELECT
            id,
            user_id,
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

    return $program ?: null;
}

/*
|--------------------------------------------------------------------------
| GET /api/program.php?id=4
|--------------------------------------------------------------------------
| Dohvaća jedan program prijavljenog korisnika.
*/

if ($method === 'GET') {

    $program = findUserProgram(
        $conn,
        $programId,
        $userId
    );

    if (!$program) {
        error('Program not found.', 404);
    }

    success(
        [
            'program' => [
                'id' => (int) $program['id'],
                'title' => $program['title'],
                'code' => $program['code'],
                'created_at' => $program['created_at'],
                'updated_at' => $program['updated_at']
            ]
        ],
        'Program retrieved successfully.'
    );
}

/*
|--------------------------------------------------------------------------
| PUT /api/program.php?id=4
|--------------------------------------------------------------------------
| Mijenja naslov i kod postojećeg programa.
|
| Očekivani JSON:
|
| {
|     "title": "Novi naziv programa",
|     "code": "LOAD s0, FF"
| }
*/

if ($method === 'PUT') {

    $existingProgram = findUserProgram(
        $conn,
        $programId,
        $userId
    );

    if (!$existingProgram) {
        error('Program not found.', 404);
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

    $title = trim($data['title'] ?? '');
    $code = trim($data['code'] ?? '');

    if ($title === '') {
        error('The title field is required.', 422);
    }

    if ($code === '') {
        error('The code field is required.', 422);
    }

    if (mb_strlen($title) > 255) {
        error(
            'The title may not be longer than 255 characters.',
            422
        );
    }

    $stmt = $conn->prepare(
        'UPDATE user_programs
         SET title = ?, code = ?
         WHERE id = ? AND user_id = ?'
    );

    $stmt->bind_param(
        'ssii',
        $title,
        $code,
        $programId,
        $userId
    );

    $stmt->execute();
    $stmt->close();

    $updatedProgram = findUserProgram(
        $conn,
        $programId,
        $userId
    );

    if (!$updatedProgram) {
        error(
            'The program was updated, but could not be retrieved.',
            500
        );
    }

    success(
        [
            'program' => [
                'id' => (int) $updatedProgram['id'],
                'title' => $updatedProgram['title'],
                'code' => $updatedProgram['code'],
                'created_at' => $updatedProgram['created_at'],
                'updated_at' => $updatedProgram['updated_at']
            ]
        ],
        'Program updated successfully.'
    );
}

/*
|--------------------------------------------------------------------------
| DELETE /api/program.php?id=4
|--------------------------------------------------------------------------
| Briše jedan program prijavljenog korisnika.
*/

if ($method === 'DELETE') {

    $existingProgram = findUserProgram(
        $conn,
        $programId,
        $userId
    );

    if (!$existingProgram) {
        error('Program not found.', 404);
    }

    $stmt = $conn->prepare(
        'DELETE FROM user_programs
         WHERE id = ? AND user_id = ?'
    );

    $stmt->bind_param(
        'ii',
        $programId,
        $userId
    );

    $stmt->execute();

    if ($stmt->affected_rows !== 1) {
        $stmt->close();

        error('Program could not be deleted.', 500);
    }

    $stmt->close();

    success(
        [
            'deleted_program' => [
                'id' => (int) $existingProgram['id'],
                'title' => $existingProgram['title']
            ]
        ],
        'Program deleted successfully.'
    );
}

/*
|--------------------------------------------------------------------------
| Nedopuštena HTTP metoda
|--------------------------------------------------------------------------
*/

error(
    'Method not allowed. Use GET, PUT or DELETE.',
    405
);