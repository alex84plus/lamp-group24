<?php
// ============================================================
//  api/config/db.php — Database connection helper using MySQL (PDO)
// ============================================================

require_once __DIR__ . '/helpers.php';

/**
 * Returns a PDO connection instance for the MySQL database.
 * Uses a static variable to maintain a single connection per request.
 *
 * @return PDO
 */
function getDB() {
    static $db = null;

    if ($db === null) {
        loadEnv();

        $host    = getenv('DB_HOST')     ?: 'localhost';
        $dbname  = getenv('DB_NAME')     ?: 'ContactManagerDB';
        $user    = getenv('DB_USER')     ?: 'DBuser';
        $pass    = getenv('DB_PASSWORD') !== false 
                     ? getenv('DB_PASSWORD')
                     : (getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
        $charset = getenv('DB_CHARSET')  ?: 'utf8mb4';
        $port    = getenv('DB_PORT')     ?: 3306;

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $db = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Database connection error: ' . $e->getMessage()]);
            exit;
        }
    }

    return $db;
}
