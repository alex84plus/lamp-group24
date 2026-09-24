<?php
// ============================================================
//  api/index.php — Unified Contact Manager RESTful API
//
//  GET    /api/index.php?ping=1    — status ping health check
//  POST   /api/index.php (signup)  — create new user
//  POST   /api/index.php (login)   — authenticate user
//  GET    /api/index.php?q=email   — send password reset to email
//  PUT    /api/index.php?id=1      — update user password (idk if I need this in auth yet, maybe temp auth)
//  ===============================
//  auth required beyond this point
//  ===============================
//  GET    /api/index.php           — list all contacts for user
//  GET    /api/index.php?q=term    — partial search contacts
//  GET    /api/index.php?id=1      — get single contact by ID
//  POST   /api/index.php (contact) — create new contact
//  PUT    /api/index.php?id=1      — update contact by ID
//  DELETE /api/index.php?id=1      — delete contact by ID
// ============================================================

// The program is a personal contact manager. Each user needs a login. If
// someone does not have an account, you need to offer a registration/signup
// mechanism. For each user, they can add their own contacts (not shared
// contacts). They can search for, edit, and delete contacts. When the initial
// page appears, users can either log in or sign up (register).

// Please note: you must have a search API and not cache all contacts client side.

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// 1. Unauthenticated Health Check (Ping)
if ($method === 'GET' &&
    ( isset( $_GET['ping'] ) || ( isset( $_GET['action'] ) && $_GET['action'] === 'ping' ) ) )
{
    respond( 200, ['status' => 'OK', 'timestamp' => time()] );
}

// Unauthenticated Signup
if ($method === 'POST')
{
    $body = getRequestBody();
    if ( isset( $body['firstName'] ) &&
         isset( $body['lastName'] ) &&
         isset( $body['password'] ) &&
         isset( $body['login'] ) )
    {
        $login     = clean( $body['login'] );
        $password  = clean( $body['password'] );
        $firstName = clean( $body['firstName'] );
        $lastName  = clean( $body['lastName'] );

        //check all our data is actually defined
        if ( !$login || !$password || !$firstName || !$lastName )
        {
            respond( 400, ['error' => 'Login, Password, First Name, and Last Name are required'] );
        }

        //check to see if user already exists
        $stmt = $db->prepare('SELECT ID FROM Users WHERE Login = :login LIMIT 1');
        $stmt->execute( [':login' => $login] );
        $user = $stmt->fetch();

        // if user exists, send 403 Forbidden, if not, create a new account with 201 Created
        if ($user)
        {
            respond( 403, ['error' => 'Username Taken'] );
        }
        else
        {
            //create new account
            $stmt = $db->prepare( 'INSERT INTO Users (FirstName,LastName,Login,Password)
                                    VALUES (:firstName, :lastName, :login, :password);' );
            $stmt->execute( [':firstName' => $firstName, ':lastName' => $lastName, ':login' => $login, ':password' => $password ] );

            respond( 201, ['error' => ''] );
        }
    }
}

// 2. Unauthenticated Login (POST with login & password in body)
if ($method === 'POST')
{
    $body = getRequestBody();
    if (isset($body['login']) && isset($body['password']))
    {
        $login    = clean($body['login']);
        $password = clean($body['password']);

        if (!$login || !$password)
        {
            respond(400, ['error' => 'Login and password are required']);
        }

        // best way I can understand this is that stmt loads up a command from the database
        // and uses variables to execute it on the next line, at that point, stmt should be
        // able to fetch that user if it exists, and so we put it into user
        $stmt = $db->prepare('SELECT ID, firstName, lastName FROM Users WHERE Login = :login AND Password = :pass LIMIT 1');
        $stmt->execute([':login' => $login, ':pass' => $password]);
        $user = $stmt->fetch();

        // if user exists, send OK 200, if not, 401
        if ($user)
        {
            respond(200, [
                'id'        => (int) $user['ID'],
                'firstName' => $user['firstName'],
                'lastName'  => $user['lastName'],
                'token'     => (string) $user['ID'],
                'error'     => ''
            ]);
        }
        else
        {
            respond(401, [
                'id'        => 0,
                'firstName' => '',
                'lastName'  => '',
                'error'     => 'No Records Found'
            ]);
        }
    }
}

// user auth required to access api calls beyond this point
$userId = requireAuth();
// 3. Get contacts for authenticated user
if ($method === 'GET')
{
    // Get one contact by ID
    if (isset($_GET['id']))
    {
        $contactId = (int) $_GET['id'];

        $stmt = $db->prepare(
            'SELECT ID, FirstName, LastName, Phone, Email, Created
             FROM Contacts
             WHERE ID = ? AND UserID = ?
             LIMIT 1'
        );

        $stmt->execute([$contactId, $userId]);

        $contact = $stmt->fetch();

        if (!$contact)
        {
            respond(404, ['error' => "Monke couldn't find the Contact"]);
        }

        respond(200, $contact);
    }

    // Search contacts
    $search = isset($_GET['q']) ? clean($_GET['q']) : '';

    if ($search !== '')
    {
        $stmt = $db->prepare(
            'SELECT ID, FirstName, LastName, Phone, Email, Created
             FROM Contacts
             WHERE UserID = ?
             AND (
                 FirstName LIKE ?
                 OR LastName LIKE ?
                 OR Phone LIKE ?
                 OR Email LIKE ?
             )
             ORDER BY LastName, FirstName'
        );

        $searchTerm = '%' . $search . '%';

        $stmt->execute([
            $userId,
            $searchTerm,
            $searchTerm,
            $searchTerm,
            $searchTerm
        ]);
    }
    else
    {
        $stmt = $db->prepare(
            'SELECT ID, FirstName, LastName, Phone, Email, Created
             FROM Contacts
             WHERE UserID = ?
             ORDER BY LastName, FirstName'
        );

        $stmt->execute([$userId]);
    }

    $contacts = $stmt->fetchAll();
    respond(200, $contacts);
}

// 4. Create a new contact
if ($method === 'POST')
{
    $body = getRequestBody();

    $firstName = clean($body['firstName'] ?? '');
    $lastName  = clean($body['lastName'] ?? '');
    $phone     = clean($body['phone'] ?? '');
    $email     = clean($body['email'] ?? '');

    if (!$firstName || !$lastName)
    {
        respond(400, ['error' => 'First name and last name are required']);
    }

    $stmt = $db->prepare(
        'INSERT INTO Contacts
         (FirstName, LastName, UserID, Phone, Email)
         VALUES (:firstName, :lastName, :uid, :phone, :email)'
    );

    $stmt->execute([
        ':firstName' => $firstName,
        ':lastName'  => $lastName,
        ':uid'       => $userId,
        ':phone'     => $phone,
        ':email'     => $email
    ]);

    $contactId = $db->lastInsertId();

    respond(201, [
        'ID'        => (int) $contactId,
        'FirstName' => $firstName,
        'LastName'  => $lastName,
        'Phone'     => $phone,
        'Email'     => $email
    ]);
}

// 5. Update a contact
if ( $method === 'PUT' )
{
    $contactId = isset( $_GET['id'] ) ? ( int ) $_GET['id'] : 0;
    if ( !$contactId )
    {
        respond(400, ['error' => 'Contact ID is required — use ?id=']);
    }

    $check = $db->prepare( 'SELECT ID FROM Contacts WHERE ID = :id AND UserID = :uid LIMIT 1' );
    $check->execute( [':id' => $contactId, ':uid' => $userId] );
    if (!$check->fetch()) {
        respond( 404, ['error' => 'Monke couldn\'t find the Contact'] );
    }

    $body = getRequestBody();
    $firstName = clean( $body['firstName'] ?? '' );
    $lastName  = clean( $body['lastName'] ?? '' );
    $phone     = clean( $body['phone'] ?? '' );
    $email     = clean( $body['email'] ?? '' );

    if ( !$firstName || !$lastName )
    {
        respond( 400, ['error' => 'First name and last name are required'] );
    }

    $stmt = $db->prepare(
        'UPDATE Contacts
         SET FirstName = :firstName, LastName = :lastName, Phone = :phone, Email = :email
         WHERE ID = :cid AND UserID = :uid
         LIMIT 1'
    );
    $stmt->execute([
        ':firstName' => $firstName,
        ':lastName'  => $lastName,
        ':phone'     => $phone,
        ':email'     => $email,
        ':cid'       => $contactId,
        ':uid'       => $userId
    ]);

    respond(200, [
        'ID'        => $contactId,
        'FirstName' => $firstName,
        'LastName'  => $lastName,
        'Phone'     => $phone,
        'Email'     => $email
    ]);
}

// 6. Delete a contact
if ( $method === 'DELETE' )
{
    $contactId   = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($contactId > 0) {
        $stmt = $db->prepare('DELETE FROM Contacts WHERE ID = :cid AND UserID = :uid');
        $stmt->execute([':cid' => $contactId, ':uid' => $userId]);
    }
    else
    {
        respond( 400, ['error' => 'Contact ID is required — use ?id='] );
    }

    if ( $stmt->rowCount() === 0 )
    {
        respond( 404, ['error' => "Monke couldn't find the Contact"] );
    }

    respond( 200, ['message' => 'Monke deleted Contact successfully'] );
}

respond(405, ['error' => 'Method not allowed']);
