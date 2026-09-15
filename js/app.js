// Dashboard behaviour: copy-to-clipboard buttons on the contact details card.
const status = document.getElementById('copy-status');

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

const deleteButton = document.getElementById("delete-contact-button");

deleteButton.addEventListener("click", async () => {
    const contactId = deleteButton.dataset.contactId;

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