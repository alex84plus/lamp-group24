// Fills the contact list and the details card, the way dashboard.php did before
// the page went static. Values go in as text, so nothing needs escaping.

const status = document.getElementById('copy-status');
const list = document.querySelector('.contact-list-items');
const addItem = list.querySelector('.contact-list-add-item');
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

// One cloned template item per contact, above the add button.
function renderList() {
    for (const item of list.querySelectorAll('.contact-list-item')) item.remove();

    for (const contact of contacts) {
        const item = itemTemplate.content.firstElementChild.cloneNode(true);
        item.querySelector('.contact-list-avatar').textContent = initials(contact);
        item.querySelector('.contact-list-name h3').textContent = fullName(contact);

        if (Number(contact.ID) === Number(selectedContactId)) {
            item.classList.add('is-active');
            item.setAttribute('aria-current', 'true');
        }

        list.insertBefore(item, addItem);
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

deleteButton.addEventListener("click", async () => {
    const contactId = deleteButton.dataset.contactId;

    if (!contactId) {
        return;
    }

    const confirmed = confirm("Are you sure you want to delete this contact?");

    if (!confirmed) {
        return;
    }

    const response = await fetch(`api/index.php?id=${contactId}`, {
        method: "DELETE"
    });

    const data = await response.json();

    if (response.ok) {
        alert("Contact deleted successfully.");
        window.location.reload();
    } else {
        alert(data.error || "Failed to delete contact.");
    }
});

loadContacts();
