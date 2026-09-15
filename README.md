### WOAHHH!

Crazy lamp stack contact manager!!!!

Login: https://lamp.alex84plus.xyz/

Sign Up: https://lamp.alex84plus.xyz/signup.php

Dashboard: https://lamp.alex84plus.xyz/dashboard.php

### Tech Stack

- PHP
- MySQL
- Apache

### Local preview

The dashboard redirects to the login page without a session. To browse it
without a database, serve the project with the dev router, which signs every
request in as user 1:

```
php -S localhost:8000 dev/router.php
```

Then open http://localhost:8000/dashboard.php. The router only works under
PHP's built-in server and answers 404 anywhere else.

### Contributors

- Frontend: Nathan Davis
- Backend: Daniel Rangosch
- Database: Alexandra King, Wilkenson Alcida

### AI Disclosure

Frontend:
- Created the cursor with the assistance of generative AI

