<?php
//Log out

session_start();

$_SESSION = [];

session_destroy();

setcookie('userId', '', time() - 3600, '/');

header('Location: ../index.html');
exit;