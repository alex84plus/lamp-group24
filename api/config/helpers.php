<?php
// ============================================================
//  api/config/helpers.php — Utility & Helper Functions for API
// ============================================================

/**
 * Loads environment variables from a .env file into putenv, $_ENV, and $_SERVER.
 *
 * @param string|null $path Path to the .env file
 */
function loadEnv($path = null) {
    static $loaded = false;
    if ($loaded) {
        return;
    }

    if ($path === null) {
        $possiblePaths = [
            __DIR__ . '/../../.env',
            __DIR__ . '/../.env',
            __DIR__ . '/.env',
            (defined('ROOT_PATH') ? ROOT_PATH . '/.env' : null),
        ];
        foreach ($possiblePaths as $p) {
            if ($p && file_exists($p)) {
                $path = $p;
                break;
            }
        }
    }

    if ($path && file_exists($path)) {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name  = trim($name);
                $value = trim($value);

                // Strip surrounding quotes
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }

                if (getenv($name) === false) {
                    putenv("{$name}={$value}");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }
    $loaded = true;
}

// Automatically load environment variables
loadEnv();

/**
 * Sets standard CORS headers to allow cross-origin API requests.
 * Handles preflight OPTIONS requests by exiting with 200 OK.
 */
function setCORSHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-Id");

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Sends a JSON response with the specified HTTP status code and terminates execution.
 *
 * @param int $statusCode HTTP status code (e.g. 200, 201, 400, 404, 405, 500)
 * @param mixed $data Data array or object to serialize as JSON
 */
function respond($statusCode, $data) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

/**
 * Gets and decodes the JSON request body or falls back to $_POST input.
 *
 * @return array
 */
function getRequestBody() {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $decoded = json_decode($rawInput, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return $_POST ?? [];
}

/**
 * Sanitizes input data by trimming whitespace and stripping HTML tags.
 *
 * @param mixed $data
 * @return mixed
 */
function clean($data) {
    if (is_string($data)) {
        return trim(strip_tags($data));
    }
    return $data;
}

/**
 * Requires authentication and returns the authenticated User ID.
 * Looks for user identification in headers, cookies, session, query parameters, or request body.
 * If unauthenticated, sends a 401 Unauthorized response and exits.
 *
 * @return int User ID
 */
function requireAuth() {
    $userId = null;

    // 1. Check Authorization Header (Bearer token, raw ID, or JWT)
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] 
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] 
        ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? null) : null);

    if ($authHeader) {
        $token = trim(preg_replace('/^Bearer\s+/i', '', $authHeader));
        if (is_numeric($token) && (int)$token > 0) {
            $userId = (int)$token;
        } else {
            // Check if JWT payload contains userId, user_id, or sub
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
                if (is_array($payload)) {
                    $userId = $payload['userId'] ?? $payload['user_id'] ?? $payload['id'] ?? $payload['sub'] ?? null;
                }
            }
        }
    }

    // 2. Check X-User-Id or User-Id custom HTTP header
    if (!$userId) {
        $xUserId = $_SERVER['HTTP_X_USER_ID'] ?? $_SERVER['HTTP_USER_ID'] ?? null;
        if ($xUserId && is_numeric($xUserId) && (int)$xUserId > 0) {
            $userId = (int)$xUserId;
        }
    }

    // 3. Check Cookie (userId or user_id)
    if (!$userId && isset($_COOKIE['userId']) && is_numeric($_COOKIE['userId'])) {
        $userId = (int)$_COOKIE['userId'];
    } elseif (!$userId && isset($_COOKIE['user_id']) && is_numeric($_COOKIE['user_id'])) {
        $userId = (int)$_COOKIE['user_id'];
    }

    // 4. Check Session
    if (!$userId) {
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            @session_start();
        }
        if (isset($_SESSION['userId']) && is_numeric($_SESSION['userId'])) {
            $userId = (int)$_SESSION['userId'];
        } elseif (isset($_SESSION['user_id']) && is_numeric($_SESSION['user_id'])) {
            $userId = (int)$_SESSION['user_id'];
        }
    }

    // 5. Check Query Parameters (?userId= or ?user_id= or ?uid=)
    if (!$userId) {
        $qUserId = $_GET['userId'] ?? $_GET['user_id'] ?? $_GET['uid'] ?? null;
        if ($qUserId && is_numeric($qUserId) && (int)$qUserId > 0) {
            $userId = (int)$qUserId;
        }
    }

    // 6. Check Request Body (userId or user_id)
    if (!$userId) {
        $body = getRequestBody();
        $bUserId = $body['userId'] ?? $body['user_id'] ?? $body['uid'] ?? null;
        if ($bUserId && is_numeric($bUserId) && (int)$bUserId > 0) {
            $userId = (int)$bUserId;
        }
    }

    // If still no valid numeric user ID, deny access with 401 Unauthorized
    if (!$userId || (int)$userId <= 0) {
        respond(401, ['error' => 'Unauthorized']);
    }

    return (int)$userId;
}
