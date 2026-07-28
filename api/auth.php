<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../db_helper.php';
require_once __DIR__ . '/response.php';

/**
 * Dohvaća Authorization header.
 */
function getAuthorizationHeader(): ?string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }

    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }

    if (function_exists('getallheaders')) {
        $headers = getallheaders();

        foreach ($headers as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                return trim($value);
            }
        }
    }

    return null;
}

/**
 * Iz Authorization headera čita Bearer token.
 */
function getBearerToken(): ?string
{
    $authorizationHeader = getAuthorizationHeader();

    if ($authorizationHeader === null) {
        return null;
    }

    if (
        !preg_match(
            '/^Bearer\s+(.+)$/i',
            $authorizationHeader,
            $matches
        )
    ) {
        return null;
    }

    $token = trim($matches[1]);

    return $token !== '' ? $token : null;
}

/**
 * Pokušava autentikaciju pomoću Bearer tokena.
 */
function authenticateWithToken(): ?array
{
    $plainToken = getBearerToken();

    if ($plainToken === null) {
        return null;
    }

    /*
     * Token koji je poslao klijent pretvaramo u isti
     * SHA-256 hash koji je spremljen u bazi.
     */
    $tokenHash = hash('sha256', $plainToken);

    $conn = Database::getInstance()->getConnection();

    $stmt = $conn->prepare(
        'SELECT
            usernames.id,
            usernames.username
         FROM api_tokens
         INNER JOIN usernames
            ON usernames.id = api_tokens.user_id
         WHERE api_tokens.token_hash = ?
           AND api_tokens.expires_at > NOW()
         LIMIT 1'
    );

    $stmt->bind_param('s', $tokenHash);
    $stmt->execute();

    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    $stmt->close();

    if (!$user) {
        error('Invalid or expired access token.', 401);
    }

    return [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'authentication_type' => 'token'
    ];
}

/**
 * Pokušava autentikaciju pomoću PHP sesije.
 */
function authenticateWithSession(): ?array
{
    if (
        !isset($_SESSION['user_id']) ||
        !isset($_SESSION['username'])
    ) {
        return null;
    }

    return [
        'id' => (int) $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'authentication_type' => 'session'
    ];
}

/**
 * Zahtijeva prijavljenog korisnika.
 *
 * Redoslijed provjere:
 * 1. Bearer token
 * 2. PHP sesija
 */
function requireLogin(): array
{
    /*
     * Ako postoji Authorization header, tretiramo zahtjev
     * kao API zahtjev i provjeravamo token.
     */
    if (getAuthorizationHeader() !== null) {
        $tokenUser = authenticateWithToken();

        if ($tokenUser !== null) {
            return $tokenUser;
        }
    }

    /*
     * Ako nema Bearer tokena, pokušavamo web sesiju.
     */
    $sessionUser = authenticateWithSession();

    if ($sessionUser !== null) {
        return $sessionUser;
    }

    error('Unauthorized. Please log in.', 401);
}