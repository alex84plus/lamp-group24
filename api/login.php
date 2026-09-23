<?php

//Log in

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../index.html');
    exit;
}

$login = clean($_POST['username'] ?? '');
$password = clean($_POST['password'] ?? '');

if (!$login || !$password) {
    header('Location: ../index.html?error=missing');
    exit;
}

$db = getDB();

$stmt = $db->prepare(
    'SELECT ID, FirstName, LastName, Role, IsDisabled
     FROM Users
     WHERE Login = ? AND Password = ?
     LIMIT 1'
);

$stmt->execute([$login, $password]);

$user = $stmt->fetch();

if (!$user) {
    header('Location: ../index.html?error=invalid');
    exit;
}

if((bool)$user['IsDisabled']){
    header('Location: ../index.html?error=disabled');
    exit;
}

$_SESSION['userId'] = (int)$user['ID'];
$_SESSION['firstName'] = $user['FirstName'];
$_SESSION['lastName'] = $user['LastName'];
$_SESSION['role'] = strtoupper($user['Role']);

setcookie('userId', (string)$user['ID'], 0, '/');

if($_SESSION['role'] === 'ADMIN'){
    header('Location: ../admin.html');
    exit;
}

header('Location: ../dashboard.html');
exit;
