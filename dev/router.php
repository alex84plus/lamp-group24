<?php
// Local preview router for PHP's built-in server.
//
//     php -S localhost:8000 dev/router.php
//
// Every request is signed in as user 1, so the login-gated pages render
// without a database. It only runs under the built-in server; anywhere else
// it answers 404, so it is inert if it ever reaches Apache.

if (PHP_SAPI !== 'cli-server') {
    http_response_code(404);
    exit;
}

$root = realpath(__DIR__ . '/..');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
if ($path === '/') {
    $path = '/index.php';
}
$file = realpath($root . $path);

// Without this, the built-in server answers a missing path with index.php.
if ($file === false || $file === __FILE__ || !str_starts_with($file, $root . DIRECTORY_SEPARATOR)) {
    http_response_code(404);
    echo 'Not found';
    exit;
}

// Static files and directories are the built-in server's job.
if (!is_file($file) || !str_ends_with($file, '.php')) {
    return false;
}

session_start();
$_SESSION['userId'] ??= 1;
session_write_close();

chdir(dirname($file));
require $file;
