<?php

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

setCORSHeaders();

$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

$userId = requireAuth();

$stmt = $db->prepare(
    'SELECT ID, Role, IsDisabled
     FROM Users
     WHERE ID = ?
     LIMIT 1'
);

$stmt->execute([$userId]);

$currentUser = $stmt->fetch();

if (!$currentUser) {
    respond(401, ['error' => 'Invalid user']);
}

if ((bool)$currentUser['IsDisabled']) {
    respond(403, ['error' => 'Account disabled']);
}

if (strtoupper($currentUser['Role']) !== 'ADMIN') {
    respond(403, ['error' => 'Administrator access required']);
}
// List of users
if ($method === 'GET' && ($_GET['action'] ?? '') === 'users')
{
    $search = clean($_GET['q'] ?? '');

    if ($search !== '')
    {
        $term = '%' . $search . '%';

        $stmt = $db->prepare(
            'SELECT
                ID,
                FirstName,
                LastName,
                Email,
                Login,
                Role,
                IsDisabled,
                IsVerified,
                Created
             FROM Users
             WHERE FirstName LIKE ?
                OR LastName LIKE ?
                OR Email LIKE ?
                OR Login LIKE ?
             ORDER BY LastName, FirstName'
        );

        $stmt->execute([
            $term,
            $term,
            $term,
            $term
        ]);
    }
    else
    {
        $stmt = $db->prepare(
            'SELECT
                ID,
                FirstName,
                LastName,
                Email,
                Login,
                Role,
                IsDisabled,
                IsVerified,
                Created
             FROM Users
             ORDER BY LastName, FirstName'
        );

        $stmt->execute();
    }

    respond(200, $stmt->fetchAll());
}
// view a users contacts
if ($method === 'GET' && ($_GET['action'] ?? '') === 'contacts')
{
    $targetUserId = (int)($_GET['userId'] ?? 0);

    if ($targetUserId <= 0) {
        respond(400, ['error' => 'User ID required']);
    }

    $stmt = $db->prepare(
        'SELECT
            ID,
            UserID,
            FirstName,
            LastName,
            Phone,
            Email,
            Created
         FROM Contacts
         WHERE UserID = ?
         ORDER BY LastName, FirstName'
    );

    $stmt->execute([$targetUserId]);

    respond(200, $stmt->fetchAll());
}
// disable or enable users
if ($method === 'PUT' && ($_GET['action'] ?? '') === 'disable')
{
    $targetUserId = (int)($_GET['id'] ?? 0);

    if ($targetUserId <= 0) {
        respond(400, ['error' => 'User ID required']);
    }

    $body = getRequestBody();

    if (!isset($body['disabled'])) {
        respond(400, ['error' => 'Disabled state required']);
    }

    $disabled = $body['disabled'] ? 1 : 0;

    $stmt = $db->prepare(
        'UPDATE Users
         SET IsDisabled = ?
         WHERE ID = ?'
    );

    $stmt->execute([
        $disabled,
        $targetUserId
    ]);

    respond(200, [
        'ID' => $targetUserId,
        'IsDisabled' => (bool)$disabled
    ]);
}
// change another users pass
if ($method === 'PUT' && ($_GET['action'] ?? '') === 'password')
{
    $targetUserId = (int)($_GET['id'] ?? 0);

    if ($targetUserId <= 0) {
        respond(400, ['error' => 'User ID required']);
    }

    $body = getRequestBody();

    $password = $body['password'] ?? '';

    if (trim($password) === '') {
        respond(400, ['error' => 'Password required']);
    }

    $stmt = $db->prepare(
        'UPDATE Users
         SET Password = ?
         WHERE ID = ?'
    );

    $stmt->execute([
        $password,
        $targetUserId
    ]);

    respond(200, [
        'message' => 'Password changed successfully'
    ]);
}

// create new admin

if ($method === 'POST' && ($_GET['action'] ?? '') === 'create-admin')
{
    $body = getRequestBody();

    $firstName = clean($body['firstName'] ?? '');
    $lastName  = clean($body['lastName'] ?? '');
    $email     = clean($body['email'] ?? '');
    $login     = clean($body['login'] ?? '');
    $password  = $body['password'] ?? '';

    if (!$firstName || !$lastName || !$login || !$password) {
        respond(400, [
            'error' => 'First name, last name, login and password are required'
        ]);
    }

    $stmt = $db->prepare(
        'SELECT ID
         FROM Users
         WHERE Login = ?
         LIMIT 1'
    );

    $stmt->execute([$login]);

    if ($stmt->fetch()) {
        respond(409, ['error' => 'Username already exists']);
    }

    $stmt = $db->prepare(
        'INSERT INTO Users
         (FirstName, LastName, Email, Login, Password, Role, IsVerified)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)'
    );

    $stmt->execute([
        $firstName,
        $lastName,
        $email,
        $login,
        $password,
        'ADMIN'
    ]);

    respond(201, [
        'ID' => (int)$db->lastInsertId(),
        'FirstName' => $firstName,
        'LastName' => $lastName,
        'Email' => $email,
        'Login' => $login,
        'Role' => 'ADMIN'
    ]);
}
