<?php

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