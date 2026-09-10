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
