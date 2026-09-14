<?php

//Log in

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../index.php');
    exit;
}

$login = clean($_POST['username'] ?? '');
$password = clean($_POST['password'] ?? '');

if (!$login || !$password) {
    header('Location: ../index.php?error=missing');
    exit;
}

$db = getDB();

$stmt = $db->prepare(
    'SELECT ID, FirstName, LastName
     FROM Users
     WHERE Login = ? AND Password = ?
     LIMIT 1'
);

$stmt->execute([$login, $password]);

$user = $stmt->fetch();

if (!$user) {
    header('Location: ../index.php?error=invalid');
    exit;
}

$_SESSION['userId'] = (int)$user['ID'];
$_SESSION['firstName'] = $user['FirstName'];
$_SESSION['lastName'] = $user['LastName'];

setcookie('userId', (string)$user['ID'], 0, '/');

header('Location: ../dashboard.php');
exit;