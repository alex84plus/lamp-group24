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
      contacts = await responseData(response);
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
