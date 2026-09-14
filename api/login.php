<!DOCTYPE html>
<html>
<head>
    <title>Contact Manager Login</title>
</head>
<body>

<h1>Contact Manager</h1>

<form id="loginForm">
    <input type="text" id="login" placeholder="Login" required>
    <br><br>

    <input type="password" id="password" placeholder="Password" required>
    <br><br>

    <button type="submit">Login</button>
</form>

<p id="message"></p>

<script>
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    const response = await fetch('index.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login: login,
            password: password
        })
    });

    const data = await response.json();

    if (response.ok) {
        document.getElementById('message').textContent =
            'Welcome ' + data.firstName + ' ' + data.lastName;
    } else {
        document.getElementById('message').textContent =
            data.error || 'Login failed';
    }
});
</script>

</body>
</html>