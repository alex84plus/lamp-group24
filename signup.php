<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Manager</title>
        <link rel="stylesheet" href="css/style.css">
        <script src="js/site.js" type="module"></script>
    </head>
    <body>
        <div class="hero-container">
            <div class="login-container">
                <div class="login-title">
                    Sign Up for Contact Manager
                </div>
                <form action="api/signup.php" method="POST">
                    <div class="login-form">
                        <input
                        class="form-input"
                        type="text"
                        id="firstName"
                        name="firstName"
                        placeholder="First Name"
                        required
                        >
                        <input
                        class="form-input"
                        type="text"
                        id="lastName"
                        name="lastName"
                        placeholder="Last Name"
                        required
                        >
                        <input
                        class="form-input"
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Username"
                        required
                        >
                        <input
                        class="form-input"
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Password"
                        required
                        >
                        <button class="btn-primary" type="submit">Sign Up</button>
                    </div>
                </form>
            </div>
        </div>
    </body>
</html>
