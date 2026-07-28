<?php

require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error('Method not allowed. Use GET.', 405);
}

/*
|--------------------------------------------------------------------------
| Provjera prijavljenog korisnika
|--------------------------------------------------------------------------
|
| requireLogin() podržava:
|
| 1. Bearer token
| 2. PHP sesiju
|
*/

$user = requireLogin();

/*
|--------------------------------------------------------------------------
| Odgovor
|--------------------------------------------------------------------------
*/

success(
    [
        'user' => [
            'id' => (int) $user['id'],
            'username' => $user['username'],
            'authentication_type' =>
                $user['authentication_type'] ?? 'unknown'
        ]
    ],
    'Authenticated user retrieved successfully.'
);