<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Manager</title>
        <link rel="stylesheet" href="css/style.css">
    </head>
    <body>
        <div class="hero-container">
            <div class="hero-inner">
                <div class="hero-image">
                    <img src="images/Monke.png" alt="Monke">
                </div>
                <div class="login-container">
                    <div class="login-title">
                        Login to Contact Manager
                    </div>
                    <form action="api/login.php" method="POST">
                        <div class="login-form">
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
                            <div class="login-row">
                                <label class="remember-label" for="remember">
                                    <input
                                    class="remember-input"
                                    type="checkbox"
                                    id="remember"
                                    name="remember"
                                    >
                                    Remember Me
                                </label>
                                    <a href="api/resetpassword.php">Forgot Password?</a>
                            </div>
                            <button class="form-btn" type="submit">Login</button>
                            <div class="login-divider">
                                <span>OR</span>
                            </div>
                            <button class="form-btn" type="button">Sign Up</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </body>
</html>
