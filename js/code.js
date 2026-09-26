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
          if (jsonObject.role === "ADMIN") {
            window.location.href = "admin.html";
            return;
          }
          window.location.href = "dashboard.html";
        } else {
          showLoginError(this);
        }
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    document.getElementById("login-error").innerHTML = err.message;
  }
}

// Shows why the login request in xhr failed, under the Remember Me row. The
// API turns down a wrong username or password with 401 and explains any other
// refusal, such as a disabled account, in its error text.
function showLoginError(xhr) {
  const error = document.getElementById('login-error');
  let message = 'Login failed';

  if (xhr.status === 401) {
    message = 'That username and password do not match.';
  } else if (xhr.status === 0) {
    message = 'Could not reach the server. Try again.';
  } else {
    try {
      message = JSON.parse(xhr.responseText).error || message;
    } catch {
      // Not the API's JSON, so the general message stands.
    }
  }

  error.textContent = message;
  error.hidden = false;
}

// Everything on index.html besides the request itself, which the form's
// onsubmit sends through doLogin(). An error is about the last attempt, so it
// goes as soon as a field changes or the form is sent again.
function startLogin() {
  const form = document.getElementById('login-form');
  const error = document.getElementById('login-error');

  for (const type of ['input', 'submit']) {
    form.addEventListener(type, () => {
      error.hidden = true;
    });
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

// ======
// signup
// ======

// Everything on signup.html. The API's signup answers with only a status, so
// once the account exists this logs in with the same details, the way the
// login page does, to get the id and name saveCookie() needs.
function startSignup() {
  const form = document.getElementById('signup-form');
  const submitButton = form.querySelector('button[type="submit"]');
  const error = document.getElementById('signup-error');

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }

  // POSTs JSON to the API and returns its reply, throwing the API's own error
  // text when the status is not OK.
  async function post(payload) {
    let response;
    try {
      response = await fetch(urlBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('Could not reach the server. Try again.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  }

  // Runs once the browser has checked the required fields, the email format,
  // and the maxlengths. The button stays disabled while the requests run, which
  // also stops Enter from sending the form twice.
  async function submitSignup(event) {
    event.preventDefault();
    error.hidden = true;

    const data = new FormData(form);
    const account = {
      firstName: String(data.get('firstName') ?? '').trim(),
      lastName: String(data.get('lastName') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      login: String(data.get('login') ?? '').trim(),
      password: String(data.get('password') ?? ''),
    };

    submitButton.disabled = true;
    try {
      await post(account);
    } catch (failure) {
      showError(failure.message);
      submitButton.disabled = false;
      return;
    }

    // The account exists now, so if signing in fails the login page is the
    // way in, not another signup.
    try {
      const user = await post({ login: account.login, password: account.password });
      userId = user.id;
      firstName = user.firstName;
      lastName = user.lastName;
      saveCookie();
      window.location.href = 'dashboard.html';
    } catch {
      window.location.href = 'index.html';
    }
  }

  form.addEventListener('submit', submitSignup);
  // An error is about the last attempt, so it goes as soon as a field changes.
  form.addEventListener('input', () => {
    error.hidden = true;
  });
}

// =========
// dashboard
// =========

function startDashboard() {
  const dashboard = document.querySelector('.dashboard-container');
  const contactList = document.querySelector('.contact-list-items');
  const contactListScroll = document.querySelector('.contact-list-scroll');
  const contactListSpacer = document.querySelector('.contact-list-spacer');
  const contactListSearch = document.querySelector('.contact-list-search');
  const contactListAdd = document.querySelector('.contact-list-add');
  const addButton = contactListAdd.querySelector('.btn-add-contact');
  const status = document.getElementById('copy-status');
  const itemTemplate = document.getElementById('contact-list-item-template');
  const detailsView = document.querySelector('.contact-details-view');
  const detailsForm = document.querySelector('.contact-details-form');
  const editPanel = document.querySelector('.contact-edit-form');
  const editForm = document.getElementById('edit-contact-form');
  const addForm = document.getElementById('add-contact-form');
  const detailsBackButton = detailsView.querySelector('.mobile-back-button');
  const addBackButton = detailsForm.querySelector('.mobile-back-button');
  const editBackButton = editPanel.querySelector('.edit-back-button');
  const editButton = document.getElementById('edit-contact-button');
  const cancelEditButton = document.getElementById('cancel-edit-button');
  const deleteButton = document.getElementById('delete-contact-button');
  const deleteDialog = document.getElementById('delete-contact-dialog');
  const deleteDialogContactName = document.getElementById('delete-dialog-contact-name');
  const deleteDialogStatus = document.getElementById('delete-dialog-status');
  const confirmDeleteButton = document.getElementById('confirm-delete-contact-button');
  const cancelDeleteButton = deleteDialog.querySelector('.btn-dialog-cancel');
  const editStatus = document.getElementById('edit-contact-status');
  const addStatus = document.getElementById('add-contact-status');
  const mobileViewport = window.matchMedia('(max-width: 767px)');

  const view = {
    initials: document.getElementById('contact-view-initials'),
    name: document.getElementById('contact-view-name'),
    created: document.getElementById('contact-view-created'),
    email: document.getElementById('contact-view-email'),
    emailLink: document.getElementById('contact-view-email-link'),
    phone: document.getElementById('contact-view-phone'),
    phoneLink: document.getElementById('contact-view-phone-link'),
  };

  const editFields = {
    firstName: document.getElementById('edit-first-name'),
    lastName: document.getElementById('edit-last-name'),
    email: document.getElementById('edit-email'),
    phone: document.getElementById('edit-phone'),
  };

  // Filled in by loadContacts().
  let contacts = [];
  let selectedContactId = null;
  let selectedContact = null;
  let mobileReturnTarget = null;
  let mobileWindowScroll = 0;
  let mobileListScroll = 0;

  function rememberMobileOrigin(target) {
    if (!mobileViewport.matches) return;

    mobileReturnTarget = target;
    mobileWindowScroll = window.scrollY;
    mobileListScroll = contactListScroll.scrollTop;
  }

  function focusMobileView(target) {
    if (!mobileViewport.matches) return;

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      target.focus({ preventScroll: true });
    });
  }

  function updateSelectedRows() {
    for (const button of contactList.querySelectorAll('.contact-list-item')) {
      const isActive = Number(button.dataset.contactId) === Number(selectedContactId);
      button.classList.toggle('is-active', isActive);
      if (isActive) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
  }

  function openContact(contact, trigger) {
    rememberMobileOrigin(trigger);
    selectedContactId = contact.ID;
    selectedContact = contact;
    dashboard.classList.remove('is-adding');
    dashboard.classList.remove('is-editing');
    editPanel.hidden = true;
    contactListAdd.classList.remove('is-active');
    dashboard.dataset.mobileView = 'detail';
    updateSelectedRows();
    renderDetails();
    focusMobileView(detailsBackButton);
  }

  function openAddContact(trigger) {
    rememberMobileOrigin(trigger);
    dashboard.classList.remove('is-editing');
    dashboard.classList.add('is-adding');
    editPanel.hidden = true;
    contactListAdd.classList.add('is-active');
    dashboard.dataset.mobileView = 'add';
    addStatus.textContent = '';

    if (mobileViewport.matches) focusMobileView(addBackButton);
    else detailsForm.querySelector('input')?.focus();
  }

  function returnToContactList() {
    dashboard.dataset.mobileView = 'list';
    dashboard.classList.remove('is-adding');
    dashboard.classList.remove('is-editing');
    editPanel.hidden = true;
    contactListAdd.classList.remove('is-active');

    requestAnimationFrame(() => {
      contactListScroll.scrollTop = mobileListScroll;
      window.scrollTo({ top: mobileWindowScroll, left: 0, behavior: 'auto' });
      if (mobileReturnTarget?.isConnected) {
        mobileReturnTarget.focus({ preventScroll: true });
      }
    });
  }

  function fillEditForm() {
    if (!selectedContact) return;

    editFields.firstName.value = selectedContact.FirstName ?? '';
    editFields.lastName.value = selectedContact.LastName ?? '';
    editFields.email.value = selectedContact.Email ?? '';
    editFields.phone.value = selectedContact.Phone ?? '';
    editStatus.textContent = '';
  }

  function openEditContact() {
    if (!selectedContact) return;

    fillEditForm();
    dashboard.classList.remove('is-adding');
    dashboard.classList.add('is-editing');
    editPanel.hidden = false;
    dashboard.dataset.mobileView = 'edit';

    if (mobileViewport.matches) focusMobileView(editBackButton);
    else editFields.firstName.focus();
  }

  function closeEditContact() {
    dashboard.classList.remove('is-editing');
    editPanel.hidden = true;
    dashboard.dataset.mobileView = 'detail';
    editStatus.textContent = '';

    requestAnimationFrame(() => editButton.focus({ preventScroll: true }));
  }

  // The decorative spacer fills any unused list height. Once a full list is
  // scrolled to its end, contract the Add Contact divider to the inset style.
  function syncContactListFillState() {
    const isFull = contactListSpacer.getBoundingClientRect().height < 1;
    const distanceFromBottom = contactListScroll.scrollHeight
      - contactListScroll.clientHeight
      - contactListScroll.scrollTop;
    const isAtTop = contactListScroll.scrollTop <= 1;
    const isAtBottom = distanceFromBottom <= 1;

    contactListScroll.classList.toggle('is-full', isFull);
    contactListSearch.classList.toggle('is-list-start', isAtTop);
    contactListAdd.classList.toggle('is-list-end', isFull && isAtBottom);
  }

  contactListScroll.addEventListener('scroll', syncContactListFillState, { passive: true });

  const contactListResizeObserver = new ResizeObserver(syncContactListFillState);
  contactListResizeObserver.observe(contactListScroll);
  contactListResizeObserver.observe(contactList);
  contactListResizeObserver.observe(contactListSpacer);

  // One cloned template item per contact.
  function renderList(list = contacts) {
    for (const entry of contactList.querySelectorAll('.contact-list-entry')) entry.remove();

    for (const contact of list) {
      const entry = itemTemplate.content.firstElementChild.cloneNode(true);
      const button = entry.querySelector('.contact-list-item');
      button.dataset.contactId = contact.ID;
      button.querySelector('.contact-list-avatar').textContent = initials(contact);
      button.querySelector('.contact-list-name-text').textContent = fullName(contact);

      if (Number(contact.ID) === Number(selectedContactId)) {
        button.classList.add('is-active');
        button.setAttribute('aria-current', 'true');
      }

      contactList.append(entry);
    }

    syncContactListFillState();
  }

    contactListSearch.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    console.log('search input:', query);
    const filteredContacts = contacts.filter((contact) =>{
      const firstName = (contact.FirstName ?? '').toLowerCase();
      const lastName = (contact.LastName ?? '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query)
      );
    });
    console.log('filtered:', filteredContacts);
    renderList(filteredContacts);
  });

  contactList.addEventListener('click', (event) => {
    const button = event.target.closest('.contact-list-item');
    if (!button) return;

    const contact = contacts.find((candidate) =>
      Number(candidate.ID) === Number(button.dataset.contactId));
    if (contact) openContact(contact, button);
  });

  addButton.addEventListener('click', () => openAddContact(addButton));
  detailsBackButton.addEventListener('click', returnToContactList);
  addBackButton.addEventListener('click', returnToContactList);
  editButton.addEventListener('click', openEditContact);
  editBackButton.addEventListener('click', closeEditContact);
  cancelEditButton.addEventListener('click', closeEditContact);

  mobileViewport.addEventListener('change', (event) => {
    if (!event.matches) return;

    dashboard.dataset.mobileView = 'list';
    dashboard.classList.remove('is-adding');
    dashboard.classList.remove('is-editing');
    editPanel.hidden = true;
    contactListAdd.classList.remove('is-active');
  });

  // Hidden entirely when the user has no contacts yet.
  function renderDetails() {
    detailsView.hidden = !selectedContact;
    if (!selectedContact) {
      delete deleteButton.dataset.contactId;
      editPanel.hidden = true;
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

  function requestHeaders(includeJson = false) {
    const headers = { 'X-User-Id': String(userId) };
    if (includeJson) headers['Content-Type'] = 'application/json; charset=UTF-8';
    return headers;
  }

  async function responseData(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  }

  function formContact(form) {
    const data = new FormData(form);
    return {
      firstName: String(data.get('first_name') ?? '').trim(),
      lastName: String(data.get('last_name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
    };
  }

  function sortContacts() {
    contacts.sort((first, second) =>
      (first.LastName ?? '').localeCompare(second.LastName ?? '')
      || (first.FirstName ?? '').localeCompare(second.FirstName ?? ''));
  }

  // The API sorts the rows, so the first contact is the one the card opens on.
  async function loadContacts(search = '') {
    try {
      let url = urlBase;
      if (search.trim() !== ''){
        url.searchParams.set('q', search.trim());
      }
      const response = await fetch(urlBase, { headers: requestHeaders() });
      const data = await responseData(response);

      contacts = data.contacts ?? [];
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

  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedContact || !editForm.reportValidity()) return;

    const contact = formContact(editForm);
    const hasChanges = contact.firstName !== (selectedContact.FirstName ?? '')
      || contact.lastName !== (selectedContact.LastName ?? '')
      || contact.email !== (selectedContact.Email ?? '')
      || contact.phone !== (selectedContact.Phone ?? '');

    if (!hasChanges) {
      closeEditContact();
      return;
    }

    const submitButton = editForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    editStatus.textContent = 'Saving changes…';

    try {
      const response = await fetch(`${urlBase}?id=${selectedContact.ID}`, {
        method: 'PUT',
        headers: requestHeaders(true),
        body: JSON.stringify(contact),
      });
      const updatedContact = await responseData(response);
      selectedContact = { ...selectedContact, ...updatedContact };
      selectedContactId = selectedContact.ID;
      contacts = contacts.map((candidate) =>
        Number(candidate.ID) === Number(selectedContact.ID) ? selectedContact : candidate);
      sortContacts();
      renderList();
      renderDetails();
      closeEditContact();
    } catch (error) {
      console.error(error);
      editStatus.textContent = error.message || 'Could not save this contact.';
    } finally {
      submitButton.disabled = false;
    }
  });

  addForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!addForm.reportValidity()) return;

    const submitButton = addForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    addStatus.textContent = 'Adding contact…';

    try {
      const response = await fetch(urlBase, {
        method: 'POST',
        headers: requestHeaders(true),
        body: JSON.stringify(formContact(addForm)),
      });
      const newContact = await responseData(response);
      selectedContact = {
        Created: new Date().toISOString(),
        ...newContact,
      };
      selectedContactId = selectedContact.ID;
      contacts.push(selectedContact);
      sortContacts();
      addForm.reset();
      addStatus.textContent = '';
      dashboard.classList.remove('is-adding');
      contactListAdd.classList.remove('is-active');
      dashboard.dataset.mobileView = 'detail';
      renderList();
      renderDetails();
      focusMobileView(detailsBackButton);
    } catch (error) {
      console.error(error);
      addStatus.textContent = error.message || 'Could not add this contact.';
    } finally {
      submitButton.disabled = false;
    }
  });

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

  function setDeleteDialogBusy(isBusy) {
    deleteDialog.toggleAttribute('data-busy', isBusy);
    confirmDeleteButton.disabled = isBusy;
    cancelDeleteButton.disabled = isBusy;
  }

  deleteButton.addEventListener('click', () => {
    const contactId = deleteButton.dataset.contactId;

    if (!contactId || !selectedContact) return;

    deleteDialog.dataset.contactId = contactId;
    deleteDialogContactName.textContent = fullName(selectedContact);
    deleteDialogStatus.textContent = '';
    deleteDialogStatus.classList.remove('is-error');
    deleteDialog.returnValue = '';
    setDeleteDialogBusy(false);
    deleteDialog.showModal();
  });

  deleteDialog.addEventListener('cancel', (event) => {
    if (deleteDialog.hasAttribute('data-busy')) {
      event.preventDefault();
    }
  });

  deleteDialog.addEventListener('click', (event) => {
    if (deleteDialog.hasAttribute('data-busy')) return;

    const bounds = deleteDialog.getBoundingClientRect();
    const clickedBackdrop = event.clientX < bounds.left
      || event.clientX > bounds.right
      || event.clientY < bounds.top
      || event.clientY > bounds.bottom;

    if (clickedBackdrop) deleteDialog.close('cancel');
  });

  deleteDialog.addEventListener('close', () => {
    const shouldRestoreFocus = deleteDialog.returnValue !== 'deleted'
      && dashboard.classList.contains('is-editing');

    delete deleteDialog.dataset.contactId;
    deleteDialogStatus.textContent = '';
    deleteDialogStatus.classList.remove('is-error');
    setDeleteDialogBusy(false);

    if (shouldRestoreFocus) {
      requestAnimationFrame(() => deleteButton.focus({ preventScroll: true }));
    }
  });

  confirmDeleteButton.addEventListener('click', async () => {
    const contactId = deleteDialog.dataset.contactId;
    if (!contactId) return;

    setDeleteDialogBusy(true);
    deleteDialogStatus.classList.remove('is-error');
    deleteDialogStatus.textContent = 'Deleting contact…';

    try {
      const response = await fetch(`${urlBase}?id=${contactId}`, {
        method: 'DELETE',
        headers: requestHeaders(),
      });
      await responseData(response);

      contacts = contacts.filter((contact) => Number(contact.ID) !== Number(contactId));
      selectedContact = contacts[0] ?? null;
      selectedContactId = selectedContact?.ID ?? null;
      dashboard.classList.remove('is-editing');
      editPanel.hidden = true;
      dashboard.dataset.mobileView = mobileViewport.matches ? 'list' : 'detail';
      renderList();
      renderDetails();

      if (mobileViewport.matches) returnToContactList();

      deleteDialog.close('deleted');
    } catch (error) {
      console.error(error);
      deleteDialogStatus.classList.add('is-error');
      deleteDialogStatus.textContent = error.message || 'Could not delete this contact.';
    } finally {
      setDeleteDialogBusy(false);
    }
  });

  loadContacts();
}

// =====
// admin
// =====

// Everything on admin.html.
function startAdmin() {
  const usersBody = document.getElementById('users-table-body');
  const userCount = document.getElementById('user-count');
  const userSearch = document.getElementById('user-search');
  const contactsBody = document.getElementById('contacts-table-body');
  const contactCount = document.getElementById('contact-count');
  const contactSearch = document.getElementById('contact-search');
  const contactSearchField = document.getElementById('contact-search-field');
  const statusCard = document.getElementById('admin-status-card');
  const statusText = document.getElementById('admin-status');
  const passwordDialog = document.getElementById('password-dialog');
  const passwordForm = document.getElementById('password-form');
  const addUserDialog = document.getElementById('add-user-dialog');
  const addUserForm = document.getElementById('add-user-form');
  const tabs = document.querySelectorAll('.tab');

  // The user the password dialog is for, and whether its request is in flight.
  let passwordUser = null;
  let passwordBusy = false;

  // Counts user list requests, so a slow answer to an older search is ignored.
  let latestUsersRequest = 0;

  // How many users exist, from the last load without a search. A search only
  // returns its matches, so this is what "of N" in the count refers to.
  let totalUsers = null;

  // The rows each table last loaded, kept so a header click can re-sort them
  // without asking the API again. Contacts are { contact, owner } pairs.
  let loadedUsers = [];
  let loadedContacts = [];

  // Each table's sort: the data-sort key of the column, and 1 for ascending or
  // -1 for descending. Both start on ID ascending.
  const userSort = { key: 'ID', dir: 1 };
  const contactSort = { key: 'ID', dir: 1 };

  // Whether the contacts tab has its data. Contacts load the first time the tab
  // opens; later visits keep what was loaded.
  let contactsLoaded = false;

  // The userId cookie saveCookie() writes. The API trusts this value as sent,
  // so it only tells the page who is signed in; it is not proof of identity.
  function currentUserId() {
    const match = document.cookie.match(/(?:^|[;,]\s*)userId=(\d+)/);
    return match ? match[1] : null;
  }

  // Screen readers only announce a live region that was already showing when its
  // text changed, so the card is shown first and the text set a frame later.
  function setPageStatus(message) {
    statusCard.hidden = false;
    statusText.textContent = '';
    requestAnimationFrame(() => {
      statusText.textContent = message;
    });
  }

  function dismissPageStatus() {
    statusCard.hidden = true;
    statusText.textContent = '';
  }

  // One cell spanning the whole table, for the loading, empty, and error states.
  function showStatus(tbody, message) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = tbody.closest('table').tHead.rows[0].cells.length;
    cell.textContent = message;
    row.append(cell);
    tbody.replaceChildren(row);
  }

  // A table cell for one value. Missing or blank values show a muted "----" so an
  // empty cell reads as "no data" rather than a gap.
  function dataCell(value) {
    const cell = document.createElement('td');
    const text = String(value ?? '').trim();
    if (text === '') {
      cell.textContent = '----';
      cell.className = 'empty-cell';
    } else {
      cell.textContent = text;
    }
    return cell;
  }

  // Orders rows by one column. Values compare as text that understands numbers,
  // so IDs go 1, 2, 10 and "YYYY-MM-DD HH:MM:SS" dates go oldest first; case is
  // ignored. Empty values stay last in either direction, and ties fall back to
  // ID so the order never shuffles.
  function compareBy(key, dir, valueOf) {
    return (a, b) => {
      const x = String(valueOf(a, key) ?? '').trim();
      const y = String(valueOf(b, key) ?? '').trim();
      if (x === '' || y === '') {
        if (x !== y) return x === '' ? 1 : -1;
      } else {
        const order = x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
        if (order !== 0) return order * dir;
      }
      return Number(valueOf(a, 'ID')) - Number(valueOf(b, 'ID'));
    };
  }

  // Makes each sortable header in the table re-sort it: a new column sorts
  // ascending, the same column again flips the direction.
  function makeSortable(table, sort, render) {
    const headers = table.querySelectorAll('th[data-sort]');
    for (const header of headers) {
      header.querySelector('.sort-button').addEventListener('click', () => {
        sort.dir = sort.key === header.dataset.sort ? -sort.dir : 1;
        sort.key = header.dataset.sort;
        for (const other of headers) {
          const direction = sort.dir === 1 ? 'ascending' : 'descending';
          other.setAttribute('aria-sort', other === header ? direction : 'none');
        }
        render();
      });
    }
  }

  function menuItem(menu, label, onSelect) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      menu.hidePopover();
      onSelect();
    });
    item.append(button);
    return item;
  }

  // The menu is a popover, so the browser closes it on an outside click or
  // Escape, keeps only one open, and returns focus to the toggle. It renders in
  // the top layer, so it is placed under its toggle here by hand.
  function actionsCell(user) {
    const cell = document.createElement('td');

    const menu = document.createElement('ul');
    menu.className = 'actions-menu';
    menu.id = `actions-menu-${user.ID}`;
    menu.popover = 'auto';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn actions-toggle';
    toggle.textContent = 'Actions ▾';
    toggle.popoverTargetElement = menu;

    menu.addEventListener('toggle', (event) => {
      if (event.newState !== 'open') return;
      const rect = toggle.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 4}px`;
      menu.style.right = `${document.documentElement.clientWidth - rect.right}px`;
    });

    menu.append(
      menuItem(menu, 'View contacts', () => viewContacts(user)),
      menuItem(menu, 'Reset password', () => openPasswordDialog(user, toggle)),
    );
    // Disabling your own account would lock you out of this page.
    if (String(user.ID) !== currentUserId()) {
      const label = user.IsDisabled ? 'Enable' : 'Disable';
      menu.append(menuItem(menu, label, () => setDisabled(user, !user.IsDisabled, toggle)));
    }

    cell.append(toggle, menu);
    return cell;
  }

  // The API sends IsVerified and IsDisabled as 0 or 1, sometimes as strings, so
  // each user's flags become true or false once, as the user loads.
  function withFlags(user) {
    return {
      ...user,
      IsVerified: Boolean(Number(user.IsVerified)),
      IsDisabled: Boolean(Number(user.IsDisabled)),
    };
  }

  function userRow(user) {
    const row = document.createElement('tr');
    row.dataset.userId = user.ID;
    row.classList.toggle('is-disabled', user.IsDisabled);
    const values = [
      user.ID,
      user.Login,
      user.FirstName,
      user.LastName,
      user.Email,
      user.Role,
      user.IsVerified ? 'Yes' : 'No',
      user.IsDisabled ? 'Yes' : 'No',
      user.Created,
    ];
    for (const value of values) row.append(dataCell(value));
    row.append(actionsCell(user));
    return row;
  }

  // The count under a table: "5 total users", or "1 of 5 total users" when a
  // search shows only some of them.
  function countText(noun, total, shown = null) {
    const label = total === 1 ? `total ${noun}` : `total ${noun}s`;
    return shown === null ? `${total} ${label}` : `${shown} of ${total} ${label}`;
  }

  // Fills the users table from loadedUsers in the current sort. With nothing
  // loaded it leaves the table alone, so a loading, empty, or error message stays.
  function renderUsers() {
    if (loadedUsers.length === 0) return;
    const sorted = [...loadedUsers].sort(compareBy(userSort.key, userSort.dir, (user, key) => user[key]));
    usersBody.replaceChildren(...sorted.map(userRow));
  }

  // Loads every user, or those whose name, email, or login contains the search
  // text. Only the first load shows a loading row; while searching, the current
  // rows stay until the new ones arrive, so the table does not flicker.
  async function loadUsers(search = '') {
    const request = ++latestUsersRequest;
    // Only before the first full list arrives; later searches keep the current
    // rows (or an empty table) until the new ones come in.
    if (totalUsers === null) showStatus(usersBody, 'Loading users...');

    // api stuff here
    // set users to the array from GET action=users, adding
    // q=<search> when searching.
    const users = [];

    if (request !== latestUsersRequest) return;
    if (!search) totalUsers = users.length;
    loadedUsers = users.map(withFlags);
    userCount.textContent = search && totalUsers !== null
      ? countText('user', totalUsers, users.length)
      : countText('user', users.length);
    if (users.length === 0) {
      // A search with no matches leaves the table empty; the count says
      // "0 of N". Only an empty user list gets a message.
      if (search) usersBody.replaceChildren();
      else showStatus(usersBody, 'No users found.');
      return;
    }
    renderUsers();
  }

  // How an owner is shown in the Owner column and matched by the search, so the
  // two agree.
  function ownerLabel(owner) {
    return `${owner.FirstName} ${owner.LastName} (${owner.Login})`;
  }

  function contactRow(contact, owner) {
    const row = document.createElement('tr');
    // Contacts of a disabled user are greyed out like the user's own row.
    row.classList.toggle('is-disabled', owner.IsDisabled);
    const values = [
      contact.ID,
      ownerLabel(owner),
      contact.Email,
      contact.Phone,
      contact.Created,
    ];
    for (const value of values) row.append(dataCell(value));
    return row;
  }

  // Whether a contact matches the search text in the chosen "Search in" field,
  // ignoring case. Username and ID must match exactly, so a login such as "TJ"
  // never picks up another owner's "TJones" or an email that contains "tj".
  function contactMatches({ contact, owner }, field, needle) {
    const text = (value) => String(value ?? '').toLowerCase();
    switch (field) {
      case 'username': return text(owner.Login) === needle;
      case 'email': return text(contact.Email).includes(needle);
      case 'phone': return text(contact.Phone).includes(needle);
      case 'id': return text(contact.ID) === needle;
      default:
        return [ownerLabel(owner), contact.Email, contact.Phone]
          .some((value) => text(value).includes(needle));
    }
  }

  // Sets the "Search in" dropdown and gives the search box that option's
  // placeholder.
  function setContactSearchField(value) {
    contactSearchField.value = value;
    contactSearch.placeholder = contactSearchField.selectedOptions[0].dataset.placeholder;
  }

  // Fills the contacts table from loadedContacts: only those matching the
  // search box in the chosen "Search in" field, in the current sort, with the
  // count under the table. An empty box shows everything. With nothing loaded it
  // leaves the table alone, so a loading, empty, or error message stays.
  function renderContacts() {
    if (loadedContacts.length === 0) return;
    const search = contactSearch.value.trim();
    const field = contactSearchField.value;
    const needle = search.toLowerCase();

    const matches = search
      ? loadedContacts.filter((entry) => contactMatches(entry, field, needle))
      : [...loadedContacts];

    const total = loadedContacts.length;
    contactCount.textContent = search
      ? countText('contact', total, matches.length)
      : countText('contact', total);

    // With no matches the table is left empty; the count says "0 of N".
    matches.sort(compareBy(contactSort.key, contactSort.dir, (entry, key) => entry.contact[key]));
    contactsBody.replaceChildren(...matches.map(({ contact, owner }) => contactRow(contact, owner)));
  }

  // The admin API only lists contacts one user at a time, so this asks for
  // every user's contacts at once and joins them to their owners here.
  async function loadContacts() {
    showStatus(contactsBody, 'Loading contacts...');
    contactCount.textContent = '';

    // api stuff here
    // set users to the array from GET action=users, and lists to
    // each user's contacts from GET action=contacts&userId=<ID>, in the same
    // order as users.
    const users = [];
    const lists = [];

    // Pairs each contact with its owner; lists[i] holds users[i]'s contacts.
    loadedContacts = [];
    users.forEach((user, i) => {
      const owner = withFlags(user);
      for (const contact of lists[i]) loadedContacts.push({ contact, owner });
    });
    if (loadedContacts.length === 0) {
      contactCount.textContent = countText('contact', 0);
      showStatus(contactsBody, 'No contacts found.');
    } else {
      renderContacts();
    }
  }

  // Stores the API's answer and redraws the table from memory, so nothing is
  // fetched again and the rows keep their order.
  async function setDisabled(user, disabled, toggle) {
    toggle.disabled = true;

    // api stuff here
    // set result to the answer from PUT action=disable&id=<user.ID>
    // with the body { disabled }.
    const result = { IsDisabled: disabled };

    const isDisabled = Boolean(result.IsDisabled);
    loadedUsers = loadedUsers.map((u) => (u.ID === user.ID ? { ...u, IsDisabled: isDisabled } : u));
    renderUsers();
    // Redrawing replaced every row, so focus goes to this user's new toggle.
    usersBody.querySelector(`[data-user-id="${user.ID}"] .actions-toggle`).focus();
    setPageStatus(`${user.Login} is now ${isDisabled ? 'disabled' : 'enabled'}.`);
  }

  function setPasswordBusy(busy) {
    passwordBusy = busy;
    for (const control of passwordForm.querySelectorAll('input, button')) {
      control.disabled = busy;
    }
  }

  function openPasswordDialog(user, toggle) {
    passwordUser = { user, toggle };
    passwordForm.reset();
    // Shows whose password is being reset, and tells password managers the
    // new password belongs to this user, not to the admin who is signed in.
    passwordForm.elements.username.value = user.Login;
    passwordDialog.showModal();
  }

  async function submitPassword(event) {
    event.preventDefault();
    if (passwordBusy) return;

    const { user } = passwordUser;
    const password = event.target.elements.password.value;
    setPasswordBusy(true);

    // api stuff here
    // PUT action=password&id=<user.ID> with the body { password }.

    setPageStatus(`Password reset for ${user.Login}.`);
    setPasswordBusy(false);
    passwordDialog.close();
  }

  function openAddUserDialog() {
    addUserForm.reset();
    addUserDialog.showModal();
  }

  // Runs once the browser has checked the required fields. The form is done,
  // but nothing is sent yet.
  async function submitAddUser(event) {
    event.preventDefault();

    // api stuff here
    // create the user from event.target.elements: firstName,
    // lastName, email, login, password, and role ('USER' or 'ADMIN').
    //  - ADMIN: POST action=create-admin, which api/admin.php already has.
    //  - USER: api/admin.php has no action for this yet; add one first.
    //  - While it runs, disable the form and block Escape, like the password
    //    dialog does with setPasswordBusy.
    //  - Success: close the dialog, setPageStatus(`${login} was added.`), and
    //    loadUsers() with the current search. When searching, also add one to
    //    totalUsers, since only a load without a search refreshes it.
    //  - Failure: keep the dialog open and show the error with setPageStatus.
  }

  // Shows one tab's section and marks its nav button as the current page.
  function showTab(tabId) {
    for (const tab of tabs) {
      const selected = tab.dataset.tab === tabId;
      tab.classList.toggle('active', selected);
      if (selected) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
      document.getElementById(tab.dataset.tab).hidden = !selected;
    }
    if (tabId === 'contacts-tab' && !contactsLoaded) {
      contactsLoaded = true;
      loadContacts();
    }
  }

  // Opens the Contact entries tab showing exactly one user's contacts: the
  // Username field with their login. If contacts are still loading, the first
  // render picks up the search already in the box.
  function viewContacts(user) {
    setContactSearchField('username');
    contactSearch.value = user.Login;
    showTab('contacts-tab');
    renderContacts();
    document.querySelector('.tab[data-tab="contacts-tab"]').focus();
  }

  if (!currentUserId()) {
    window.location.href = 'index.html';
    return;
  }

  passwordForm.addEventListener('submit', submitPassword);
  document.getElementById('password-cancel').addEventListener('click', () => passwordDialog.close());
  document.getElementById('password-close').addEventListener('click', () => passwordDialog.close());
  // Escape must not close the dialog while its request is still running.
  passwordDialog.addEventListener('cancel', (event) => {
    if (passwordBusy) event.preventDefault();
  });
  passwordDialog.addEventListener('close', () => passwordUser?.toggle.focus());
  document.getElementById('admin-status-close').addEventListener('click', dismissPageStatus);

  document.getElementById('add-user-button').addEventListener('click', openAddUserDialog);
  addUserForm.addEventListener('submit', submitAddUser);
  document.getElementById('add-user-cancel').addEventListener('click', () => addUserDialog.close());
  document.getElementById('add-user-close').addEventListener('click', () => addUserDialog.close());

  // Searches a moment after typing stops, rather than on every keystroke.
  let searchTimer = null;
  userSearch.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadUsers(userSearch.value.trim()), 250);
  });

  // Contacts are all in memory, so their search filters on every keystroke
  // and whenever the "Search in" field changes.
  contactSearch.addEventListener('input', renderContacts);
  contactSearchField.addEventListener('change', () => {
    setContactSearchField(contactSearchField.value);
    renderContacts();
  });

  // Each × empties the search box beside it and puts a "Search in" dropdown
  // in the same toolbar back to its first option; the input event then runs
  // that box's search.
  for (const clear of document.querySelectorAll('.search-clear')) {
    clear.addEventListener('click', () => {
      const input = clear.closest('.search-field').querySelector('input');
      const searchIn = clear.closest('.toolbar').querySelector('.search-in');
      if (searchIn) setContactSearchField(searchIn.options[0].value);
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    });
  }

  makeSortable(document.querySelector('#users-tab table'), userSort, renderUsers);
  makeSortable(document.querySelector('#contacts-tab table'), contactSort, renderContacts);

  for (const tab of tabs) {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
  }

  // An open menu is placed for where its toggle was, so it closes on scroll.
  document.addEventListener('scroll', () => {
    document.querySelector('.actions-menu:popover-open')?.hidePopover();
  }, true);

  loadUsers();
}
