// Every page's JavaScript, including all the calls to the API. Loaded by all
// three pages, so each part checks for the markup it needs before running.
// Values go into the page as text, so nothing needs escaping.

//get url base
const urlBase = (typeof window !== 'undefined' && window.location && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.origin.includes('alex84plus')))
  ? '/api/index.php'
  : 'http://lamp.alex84plus.xyz/api/index.php';

const loginUrlBase = urlBase;

// A static page cannot see the PHP session, so api/login.php also leaves a
// readable userId cookie. This only turns a signed-out visitor around at the
// door; the API is what keeps one user out of another's contacts.
function signedIn() {
    return /(?:^|;\s*)userId=\d+/.test(document.cookie);
}

function initials({ FirstName = '', LastName = '' }) {
    return (FirstName.charAt(0) + LastName.charAt(0)).toUpperCase();
}

function fullName({ FirstName = '', LastName = '' }) {
    return `${FirstName} ${LastName}`.trim();
}

// MySQL sends `YYYY-MM-DD HH:MM:SS`, which not every browser parses. Undated
// rows come back null, so the formatters below can return an empty string.
function toDate(value) {
    const date = new Date(String(value ?? '').replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
}

// Sep 3, 2026
function formatDate(value) {
    const date = toDate(value);
    return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

// 2026-09-03
function isoDate(value) {
    const date = toDate(value);
    if (!date) return '';

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

// The login page: the form never posts itself, this sends it.
// const loginForm = document.getElementById('login-form');
// if (loginForm) startLogin(loginForm);

//old login function
// function startLogin(form) {
//     const error = document.getElementById('login-error');

//     function showError(message) {
//         error.textContent = message;
//         error.hidden = false;
//     }

//     // api/login.php answers with a redirect rather than JSON: to the dashboard
//     // when the login worked, back here with ?error=... when it did not. fetch
//     // follows that redirect, so response.url is what says which one happened.
//     form.addEventListener('submit', async (event) => {
//         event.preventDefault();
//         error.hidden = true;

//         let landed;

//         try {
//             const response = await fetch('api/login.php', {
//                 method: 'POST',
//                 body: new URLSearchParams(new FormData(form)),
//             });
//             if (!response.ok) throw new Error(`Login request failed: ${response.status}`);
//             landed = new URL(response.url);
//         } catch (failure) {
//             console.error(failure);
//             showError('Could not reach the server. Try again.');
//             return;
//         }

//         if (landed.pathname.endsWith('/dashboard.html')) {
//             window.location.replace('dashboard.html');
//             return;
//         }

//         showError(landed.searchParams.get('error') === 'missing'
//             ? 'Enter a username and password.'
//             : 'That username and password do not match.');
//     });
// }

function doLogin() {
  userId = 0;
  firstName = "";
  lastName = "";

  let loginInput = document.getElementById("username");
  let passwordInput = document.getElementById("password");
  let login = loginInput ? loginInput.value.trim() : "";
  let password = passwordInput ? passwordInput.value.trim() : "";

  // loginResult this is the text at the bottom that
  // tells you "wrong username or password" usually
  document.getElementById("login-error").innerHTML = "";

  let jsonPayload = JSON.stringify({ login: login, password: password });
  let url = loginUrlBase;

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          let jsonObject = JSON.parse(xhr.responseText);
          userId = jsonObject.id;

          if (userId < 1) {
            document.getElementById("login-error") =
              "User/Password combination incorrect";
            return;
          }

          firstName = jsonObject.firstName;
          lastName = jsonObject.lastName;

          saveCookie();
          window.location.href = "dashboard.html";
        } else {
          document.getElementById("login-error").innerHTML =
            "Login failed";
        }
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    document.getElementById("login-error").innerHTML = err.message;
  }
}

// save user info as a cookie
function saveCookie() {
  let minutes = 20;
  let date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  document.cookie =
    "firstName=" +
    encodeURIComponent(firstName) +
    ",lastName=" +
    encodeURIComponent(lastName) +
    ",userId=" +
    userId +
    ";expires=" +
    date.toGMTString() +
    ";path=/";
}

// this function should be the first thing ran on the dashboard page
// it checks to make sure the user has a valid session and also loads
// page content
// TODO: implement this function into the html on dashboard.html
function readCookie() {
  userId = -1;
  let data = document.cookie;
  let splits = data.split(";");
  for (var i = 0; i < splits.length; i++) {
    let pair = splits[i].trim();
    let tokens = pair.split(",");
    for (var j = 0; j < tokens.length; j++) {
      let keyVal = tokens[j].trim().split("=");
      if (keyVal[0] === "firstName") {
        firstName = decodeURIComponent(keyVal[1] || "");
      } else if (keyVal[0] === "lastName") {
        lastName = decodeURIComponent(keyVal[1] || "");
      } else if (keyVal[0] === "userId") {
        userId = parseInt(keyVal[1].trim());
      }
    }
  }
  if (userId < 0 || isNaN(userId)) {
    window.location.href = "index.html";
  } else {
    let userNameEl = document.getElementById("userName");
    if (userNameEl) {
      userNameEl.innerHTML = `<i class="bi bi-person-circle me-1 text-primary"></i> <span>Logged in as <strong class="text-white">${firstName} ${lastName}</strong></span>`;
    }
    // I believe you can put any functions you'd like to run when the page is loaded
    // searchColor(); was here before
    startDashboard();
  }
}

// Removes cookies on logout and returns you to index.html
function doLogout() {
  userId = 0;
  firstName = "";
  lastName = "";
  document.cookie = "firstName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "lastName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  window.location.href = "index.html";
}

// =========
// dashboard
// =========

function startDashboard() {
    const contactList = document.querySelector('.contact-list-items');
    const status = document.getElementById('copy-status');
    const addItem = contactList.querySelector('.contact-list-add-item');
    const itemTemplate = document.getElementById('contact-list-item-template');
    const detailsView = document.querySelector('.contact-details-view');
    const deleteButton = document.getElementById('delete-contact-button');

    const view = {
        initials: document.getElementById('contact-view-initials'),
        name: document.getElementById('contact-view-name'),
        created: document.getElementById('contact-view-created'),
        email: document.getElementById('contact-view-email'),
        emailLink: document.getElementById('contact-view-email-link'),
        phone: document.getElementById('contact-view-phone'),
        phoneLink: document.getElementById('contact-view-phone-link'),
    };

    // Filled in by loadContacts().
    let contacts = [];
    let selectedContactId = null;
    let selectedContact = null;

    // One cloned template item per contact, above the add button.
    function renderList() {
        for (const item of contactList.querySelectorAll('.contact-list-item')) item.remove();

        for (const contact of contacts) {
            const item = itemTemplate.content.firstElementChild.cloneNode(true);
            item.querySelector('.contact-list-avatar').textContent = initials(contact);
            item.querySelector('.contact-list-name h3').textContent = fullName(contact);

            if (Number(contact.ID) === Number(selectedContactId)) {
                item.classList.add('is-active');
                item.setAttribute('aria-current', 'true');
            }

            contactList.insertBefore(item, addItem);
        }
    }

    // Hidden entirely when the user has no contacts yet.
    function renderDetails() {
        detailsView.hidden = !selectedContact;
        if (!selectedContact) {
            delete deleteButton.dataset.contactId;
            return;
        }

        const email = selectedContact.Email ?? '';
        const phone = selectedContact.Phone ?? '';

        view.initials.textContent = initials(selectedContact);
        view.name.textContent = fullName(selectedContact);
        view.email.textContent = email;
        view.emailLink.href = `mailto:${email}`;
        view.phone.textContent = phone;
        view.phoneLink.href = `tel:${phone}`;
        deleteButton.dataset.contactId = selectedContact.ID;

        const iso = isoDate(selectedContact.Created);
        view.created.textContent = formatDate(selectedContact.Created);
        if (iso) view.created.dateTime = iso;
        else view.created.removeAttribute('datetime');
    }

    // The API sorts the rows, so the first contact is the one the card opens on.
    async function loadContacts() {
        if (!signedIn()) {
            window.location.replace('index.html');
            return;
        }

        try {
            const response = await fetch('api/index.php');
            if (response.status === 401) {
                window.location.replace('index.html');
                return;
            }
            if (!response.ok) throw new Error(`Contacts request failed: ${response.status}`);
            contacts = await response.json();
        } catch (error) {
            console.error(error);
            status.textContent = 'Could not load contacts';
            return;
        }

        selectedContactId = contacts[0]?.ID ?? null;
        selectedContact = contacts[0] ?? null;

        renderList();
        renderDetails();
    }

    // Copy buttons on the details card.
    document.addEventListener('click', async (event) => {
        const button = event.target.closest('.contact-view-copy');
        if (!button) return;

        const field = button.closest('.contact-view-field');
        const label = field.querySelector('.contact-view-label').textContent;
        const value = field.querySelector('.contact-view-value').textContent.trim();

        try {
            await navigator.clipboard.writeText(value);
        } catch {
            status.textContent = `Could not copy ${label.toLowerCase()}`;
            return;
        }

        status.textContent = `${label} copied`;
        button.classList.add('is-copied');
        clearTimeout(button.resetTimer);
        button.resetTimer = setTimeout(() => button.classList.remove('is-copied'), 1500);
    });

    deleteButton.addEventListener('click', async () => {
        const contactId = deleteButton.dataset.contactId;

        if (!contactId) {
            return;
        }

        const confirmed = confirm('Are you sure you want to delete this contact?');

        if (!confirmed) {
            return;
        }

        const response = await fetch(`api/index.php?id=${contactId}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
            alert('Contact deleted successfully.');
            window.location.reload();
        } else {
            alert(data.error || 'Failed to delete contact.');
        }
    });

    loadContacts();
}
