<?php

header('Content-Type: application/json; charset=utf-8');

/**
 * Vraća uspješan JSON odgovor.
 */
function success($data = [], $message = 'Success')
{
    http_response_code(200);

    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);

    exit();
}

/**
 * Vraća grešku.
 */
function error($message, $statusCode = 400)
{
    http_response_code($statusCode);

    echo json_encode([
        'success' => false,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);

    exit();
}